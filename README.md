# SOURCE CODE 2026

Immersive scroll experience for **Source Code 2026** — Department of Electronics &
Communication Engineering, CHRIST University, presented by **CUESTIC**.

Nine sections, one continuous document, one persistent WebGL canvas.

---

## Run it

```bash
npm install
npm run posters   # process /IMAGES -> optimised web assets (run once, or after adding art)
npm run dev       # http://localhost:3000
```

```bash
npm run build && npm start   # production (build runs the poster pipeline first)
```

---

## ⚠️ What still needs your input

All five events and the full organising committee are live, and every Register
button points at the live form. What remains:

| File | What to fill in |
|---|---|
| `src/data/events.ts` → `brand-new-circuit` | `slots` — the only field not supplied for this event |
| `src/data/events.ts` → `FEST` | `contactEmail`, `instagram` (Contact Us / Follow Us currently fall back to on-page anchors) |
| `src/data/team.ts` | Optional `image` and `linkedin` per member — names, roles and phone numbers are in |
| `src/app/layout.tsx` | `metadataBase` — currently a placeholder domain |

Anything left as `TBA` renders as *"To be announced"* rather than blank, so the
layout never breaks while a field is outstanding.

`src/data/events.ts` is the single source of truth for all event copy. Nothing
else in the codebase hardcodes event text.

### Registration

One form serves the whole site: `REGISTER_URL` in `src/data/events.ts`. Change it
there and all six CTAs (five events plus the finale) follow. Every one opens in a
new tab with `rel="noopener noreferrer"`.

The click is deliberately **not** intercepted. Animating first and then calling
`window.open()` lands outside the user-gesture window and popup blockers discard
it — the viewer would click Register and nothing would happen. The anchor
navigates natively while the burst animation plays on this page, which is what
they actually see during the tab switch.

### Event content structure

Each event carries a `rounds` array (timeline rounds, story steps or challenge
cards, depending on the event) rendered under the information card, plus optional
`closingLine` / `closingSub`. `beats` are the short words the pinned scroll
reveals — keep them punchy and distinct from the round titles, since both are on
screen at once.

### Adding the team

Drop square photos in `public/team/`, then fill `TEAM` in `src/data/team.ts`.
The section switches from its "Classified" placeholder grid to real cards
automatically — no component changes needed.

---

## Posters

Source art lives in `IMAGES/`. `npm run posters` reads it and writes
`public/posters/generated/**` plus the `src/data/posters.generated.json` manifest.

Per poster it produces:

- **AVIF + WebP at four widths** (640/1080/1600/~2200) — Lanczos3 upscale with a
  gentle unsharp mask, served via `<picture>` + `srcset`
- **A base64 LQIP** thumbnail so images never flash in
- **A pseudo-depth map** — luminance, blurred and normalised — which drives the
  foreground parallax plane in `PosterFrame`
- **Dominant + accent colours**, so each section can theme itself from its own art

### To add or replace a poster

1. Put the file in `IMAGES/`
2. Add an entry to `SOURCES` in `scripts/process-posters.mjs` (an `id` and `file`;
   add a fractional `crop` if the source has junk baked into an edge)
3. `npm run posters`

Crops are expressed as fractions of the source, so they survive a re-export at a
different resolution. The Daily Bugle source is a screenshot with an image-viewer
toolbar baked into the bottom strip — that's cropped out automatically.

### An honest note on the "AI enhancement" pipeline

The brief asked for AI upscaling to 4K, background removal and subject extraction.
Those need a model this build doesn't ship, and pretending otherwise would have
meant shipping something that silently didn't work. What it does instead:

- **Upscaling** is real but conventional (Lanczos3 + unsharp), capped at 3.2× —
  past that, upscaling reads as mush rather than detail. Your smallest sources are
  648×543, so their true ceiling is ~2074px, not 4K.
- **Subject separation** happens *live in the browser* rather than being baked in:
  the depth map masks a duplicated foreground layer that travels ~4× further than
  the base on pointer parallax. This is better than a baked cut-out — it stays
  interactive, and it can't produce the crunchy edges an automatic matte would.
- **Cinematic lighting, glow, energy particles and holographic reflection** are all
  live CSS/WebGL layers on top of the art, for the same reason.

If you want true AI upscaling and background removal, that's a pre-processing step
to run on the source files before they enter `IMAGES/` — the pipeline will happily
consume the higher-resolution results.

---

## Architecture

```
src/
  app/               layout (fonts, SEO, JSON-LD), page, globals.css, icon, robots, sitemap
  components/
    canvas/          the single persistent WebGL layer
      SceneRoot      one <Canvas> for the whole site + post-processing
      Nebula         volumetric backdrop (full-screen triangle, fbm warp)
      Starfield      GPU starfield, recycled on Z, warps with scroll velocity
      ParticleLogo   hero title assembled from text rasterised to a 2D canvas
      InfinityStones the Gauntlet centrepiece — six stones, collected on scroll
      EnergyField    ambient motes, tinted per section
      CameraRig      per-scene dolly, drift and pointer parallax
    sections/        the nine narrative beats (DOM)
    ui/              PosterFrame, Nav, Preloader, Footer
  data/              events.ts, team.ts, posters.generated.json  <- content lives here
  lib/               scroll store, scene moods, GSAP init, quality tiers
```

**One canvas, never unmounted.** Sections publish their scroll progress to a tiny
external store (`lib/scroll.ts`); the WebGL layer subscribes and reads it inside the
render loop with zero React involvement. That's why transitions between "universes"
are continuous instead of a teardown and rebuild — and why layout reads never enter
the frame loop.

**Lenis drives ScrollTrigger**, not the other way around. Two RAF loops reading the
same scroll position is where pinned-section jitter comes from.

### Two implementation notes worth keeping

- **Shader materials are constructed imperatively**, not declared as
  `<shaderMaterial uniforms={...}>`. Passing `uniforms` as a JSX prop means React
  owns it — on re-render the reconciler re-applies the prop and the object the
  render loop mutates stops being the one the compiled program reads, so the
  uniform silently freezes at its initial value. This cost the hero logo an entire
  debugging session; don't reintroduce it.
- **Fragment shaders declare `precision highp float`.** Vertex shaders default to
  `highp` and fragment to `mediump`, so any uniform or varying shared across the
  two must be qualified identically or the program fails to link.

---

## Performance

- Quality tier is picked once at boot from cheap signals (cores, memory, pointer
  type) — see `lib/quality.ts`. Particle counts, DPR and post-processing scale with
  it; `PerformanceMonitor` drops resolution further before it drops frames.
- `three` + `postprocessing` are lazily loaded browser-side, so they stay out of
  the server bundle and off the critical path. First Load JS is **~165 kB**.
- Posters are pre-optimised at build time and cached immutably for a year.

## Accessibility

- `prefers-reduced-motion` removes all pinning, scrubbing and the preloader; the
  page collapses to a normal readable document (verified: 22.1 → 8.8 viewports,
  every revealed element visible).
- The hero title is real text for screen readers and crawlers; the particle version
  is decorative.
- Skip link, focus-visible rings, labelled sections, alt text on all imagery.

---

## Deploying to Vercel

The project is a standard Next.js 15 app — Vercel auto-detects everything. The
committed `vercel.json` only pins the framework, the Mumbai region (`bom1`,
closest to Bangalore) and silences deployment comments on commits.

### Import

1. **vercel.com → Add New → Project → Import** `kingsleyjudewin/source_code_2026`
2. Leave every build setting at its default:

   | Setting | Value |
   |---|---|
   | Framework Preset | Next.js |
   | Build Command | `next build` (default) |
   | Output Directory | `.next` (default) |
   | Install Command | `npm install` (default) |
   | Node Version | 20.x or 22.x |

3. **Deploy.** No environment variables are required for the first deploy.

### Environment variables

| Name | When | Value |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Only once you attach a custom domain | e.g. `https://sourcecode2026.example.com` |

Without it the site derives its origin from `VERCEL_PROJECT_PRODUCTION_URL`, so
Open Graph tags and the sitemap are correct on the `.vercel.app` domain out of
the box. See `src/lib/site.ts`.

### Why the build does *not* regenerate posters

`npm run build` is plain `next build`. The processed assets in
`public/posters/generated/` are committed, so deploys are fast and deterministic
and don't depend on `sharp` behaving identically in Vercel's build image.

**When you change artwork:** drop it in `IMAGES/`, run `npm run posters` locally,
and commit the regenerated `public/posters/generated/**` plus
`src/data/posters.generated.json`. Forgetting this is the one way the deployed
site can drift from the source art.

### After deploying

- Confirm the intro film plays — the two MP4s in `public/intro/` are ~2.5 MB
  combined and served as static assets.
- Check a Register button opens the Google Form in a new tab.
- Open the production URL on a phone to confirm the portrait intro cut loads.
