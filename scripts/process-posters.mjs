/**
 * Poster treatment pipeline.
 *
 * Turns the raw PNGs in /IMAGES into premium, web-optimised assets:
 *   - deterministic crops (strips screenshot chrome baked into some sources)
 *   - Lanczos3 upscale + unsharp mask  -> crisp large renders from small sources
 *   - AVIF + WebP at four widths       -> ~90% smaller than the source PNGs
 *   - LQIP base64 thumbnail            -> zero-flash progressive load
 *   - luminance depth map              -> drives the parallax displacement shader
 *   - dominant + accent colour         -> each event section themes itself from its poster
 *
 * Output: public/posters/generated/** and src/data/posters.generated.json
 * Idempotent: safe to re-run. Drop new art in /IMAGES, add an entry to SOURCES, re-run.
 */
import sharp from 'sharp';
import { mkdir, writeFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(ROOT, 'IMAGES');
const OUT_DIR = path.join(ROOT, 'public', 'posters', 'generated');
const MANIFEST = path.join(ROOT, 'src', 'data', 'posters.generated.json');

const WIDTHS = [640, 1080, 1600, 2200];
const MAX_UPSCALE = 3.2; // beyond this, upscaling reads as mush rather than detail

/**
 * `crop` is expressed in fractions of the source so it survives any future re-export
 * of the same artwork at a different resolution.
 */
const SOURCES = [
  { id: 'brand-new-circuit', file: 'BRANDNEWCIRCUIT.png' },
  {
    id: 'daily-bugle',
    file: 'DAILY BUGLE.png',
    // Source is a screenshot: an image-viewer toolbar is baked into the bottom strip.
    crop: { top: 0, left: 0, width: 1, height: 0.93 },
  },
  { id: 'brainverse', file: 'BRAINVERSE.png' },
  { id: 'the-gauntlet', file: 'gontlet.png' },
  { id: 'stark-forge', file: 'STARKFORGE.png' },
  {
    id: 'header-lockup',
    file: 'HEADER IN HOMEPAGE.png',
    flat: true,
    alphaFromLuma: true,
    // Source ends its content at col 659 but carries an orphaned vertical rule
    // at 677–679. Invisible against the original black slab; a stray mark once
    // the background is keyed out.
    crop: { top: 0, left: 0, width: 0.978, height: 1 },
  },
];

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/**
 * Key a black backdrop out to real transparency.
 *
 * The supplied lockup is light artwork flattened onto solid black with a fully
 * opaque alpha channel, so it renders as a black slab on the hero's starfield.
 * Compositing over black is exactly `rgb = colour × coverage`, so luminance IS
 * the coverage: take alpha from it, then unpremultiply to recover the original
 * colour at full strength. That beats a CSS `mix-blend-mode: screen` patch —
 * the asset itself becomes correct, so it composites cleanly anywhere.
 */
async function keyOutBlack(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(data.length);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    // Slight lift so anti-aliased glyph edges don't go translucent and muddy.
    const a = clamp(Math.round(luma * 1.35), 0, 255);

    if (a < 4) {
      out[i] = out[i + 1] = out[i + 2] = out[i + 3] = 0;
      continue;
    }

    const k = 255 / a;
    out[i] = clamp(Math.round(r * k), 0, 255);
    out[i + 1] = clamp(Math.round(g * k), 0, 255);
    out[i + 2] = clamp(Math.round(b * k), 0, 255);
    out[i + 3] = a;
  }

  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
}
const hex = ({ r, g, b }) =>
  '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');

/** Push a colour to the saturated, luminous end so it works as a neon accent. */
function toAccent({ r, g, b }) {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    const [rn, gn, bn] = [r / 255, g / 255, b / 255];
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = clamp(d === 0 ? 0.7 : clamp(d / (1 - Math.abs(2 * l - 1)), 0, 1) * 1.35, 0.55, 1);
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(clamp(l * 1.45, 0.5, 0.72) * 100) };
}

async function processOne(entry) {
  const srcPath = path.join(SRC_DIR, entry.file);
  const base = sharp(srcPath, { limitInputPixels: 268402689 });
  const meta = await base.metadata();

  // ---- crop -------------------------------------------------------------
  let pipeline = sharp(srcPath);
  let w = meta.width;
  let h = meta.height;
  if (entry.crop) {
    const region = {
      left: Math.round(entry.crop.left * meta.width),
      top: Math.round(entry.crop.top * meta.height),
      width: Math.round(entry.crop.width * meta.width),
      height: Math.round(entry.crop.height * meta.height),
    };
    pipeline = pipeline.extract(region);
    w = region.width;
    h = region.height;
  }

  let cropped = await pipeline.png().toBuffer();
  if (entry.alphaFromLuma) cropped = await keyOutBlack(cropped);
  const aspect = w / h;

  // ---- colour analysis --------------------------------------------------
  const stats = await sharp(cropped).stats();
  const dominant = stats.dominant;
  const mean = { r: stats.channels[0].mean, g: stats.channels[1].mean, b: stats.channels[2].mean };
  const accent = toAccent(dominant);

  const outDir = path.join(OUT_DIR, entry.id);
  await mkdir(outDir, { recursive: true });

  // Clear previous renders. A changed crop shifts the width ladder, and stale
  // files from an earlier run would otherwise linger in the deploy forever.
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  // ---- responsive renders ----------------------------------------------
  const ceiling = Math.round(w * MAX_UPSCALE);
  const widths = WIDTHS.filter((x) => x <= ceiling);
  if (widths.length === 0) widths.push(Math.min(WIDTHS[0], ceiling));
  if (!widths.includes(ceiling) && ceiling < WIDTHS[WIDTHS.length - 1]) widths.push(ceiling);

  const rendered = [];
  for (const targetW of widths) {
    const resized = sharp(cropped)
      .resize({ width: targetW, kernel: sharp.kernel.lanczos3, withoutEnlargement: false })
      // Restores micro-contrast lost to upscaling. Gentle: heavy sharpening haloes on neon art.
      .sharpen({ sigma: targetW > w ? 1.1 : 0.6, m1: 0.4, m2: 2.2 });

    await resized
      .clone()
      .avif({ quality: 62, effort: 6 })
      .toFile(path.join(outDir, `${targetW}.avif`));
    await resized
      .clone()
      // alphaQuality keeps the keyed-out edge clean instead of blocky.
      .webp({ quality: 86, effort: 5, alphaQuality: 100 })
      .toFile(path.join(outDir, `${targetW}.webp`));
    rendered.push(targetW);
  }

  // ---- LQIP -------------------------------------------------------------
  const lqipBuf = await sharp(cropped)
    .resize({ width: 24 })
    .blur(1.2)
    .webp({ quality: 40, alphaQuality: 100 })
    .toBuffer();
  const lqip = `data:image/webp;base64,${lqipBuf.toString('base64')}`;

  // ---- pseudo-depth map -------------------------------------------------
  // Luminance, blurred and normalised. Not monocular depth estimation — but bright,
  // high-energy regions of this artwork *are* the foreground subjects, so it drives
  // a convincing parallax displacement at a fraction of the cost.
  let depth = null;
  if (!entry.flat) {
    await sharp(cropped)
      .resize({ width: 512, height: Math.round(512 / aspect), fit: 'fill' })
      .greyscale()
      .normalise()
      .blur(6)
      .linear(1.25, -18)
      .webp({ quality: 72 })
      .toFile(path.join(outDir, 'depth.webp'));
    depth = `/posters/generated/${entry.id}/depth.webp`;
  }

  return [
    entry.id,
    {
      id: entry.id,
      source: entry.file,
      width: w,
      height: h,
      aspect: Number(aspect.toFixed(4)),
      widths: rendered,
      avif: `/posters/generated/${entry.id}/{w}.avif`,
      webp: `/posters/generated/${entry.id}/{w}.webp`,
      depth,
      lqip,
      dominant: hex(dominant),
      mean: hex(mean),
      accent: `hsl(${accent.h} ${accent.s}% ${accent.l}%)`,
      accentHsl: accent,
    },
  ];
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const present = new Set(await readdir(SRC_DIR));
  const manifest = {};
  const skipped = [];

  for (const entry of SOURCES) {
    if (!present.has(entry.file)) {
      skipped.push(entry.file);
      continue;
    }
    const [id, data] = await processOne(entry);
    manifest[id] = data;
    const kb = data.widths.map((x) => x).join('/');
    console.log(`  ✓ ${id.padEnd(20)} ${data.width}×${data.height}  →  ${kb}px  accent ${data.accent}`);
  }

  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\n  manifest → src/data/posters.generated.json (${Object.keys(manifest).length} assets)`);
  if (skipped.length) console.warn(`  ! missing from /IMAGES: ${skipped.join(', ')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
