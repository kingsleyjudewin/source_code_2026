'use client';

/**
 * Adaptive quality.
 *
 * Two independent axes, deliberately:
 *
 *   `tier`   — how much raw work the device can do.
 *   `mobile` — whether it is a phone.
 *
 * They are separate because a phone is not simply "a weak desktop". Phones need
 * the *same* look on a smaller, denser screen with a fraction of the thermal
 * budget, so they get their own preset rather than inheriting the desktop `low`
 * tier. That distinction matters: the previous build sent phones to `low`, which
 * disabled bloom outright — and bloom is the entire glow layer, so every mobile
 * background rendered flat while desktop looked deep and cinematic.
 *
 * Desktop presets below are untouched.
 */
export type Tier = 'low' | 'medium' | 'high';

export type QualitySettings = {
  tier: Tier;
  /** Phone-class device: drives the mobile-only cost reductions. */
  mobile: boolean;
  dpr: [number, number];
  /** Particle counts are the single biggest lever on GPU cost. */
  starCount: number;
  /** Nodes in the hero quantum web. */
  webNodes: number;
  fieldParticles: number;
  bloom: boolean;
  /**
   * Mip levels in the bloom chain (postprocessing default: 8). Each level is a
   * downsample + upsample pass, so this is the real cost lever when `mipmapBlur`
   * is on — `resolutionScale` is explicitly deprecated and ignored in that mode.
   */
  bloomLevels: number;
  chromaticAberration: boolean;
  antialias: boolean;
  reducedMotion: boolean;
};

function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
}

function detectTier(mobile: boolean): Tier {
  if (typeof window === 'undefined') return 'medium';

  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;

  if (mobile) {
    // `deviceMemory` is unreliable here — iOS Safari doesn't implement it and
    // Android commonly reports 4 regardless — so it only separates the clearly
    // capable from everything else, and never gates whether bloom runs.
    return cores >= 6 ? 'medium' : 'low';
  }
  if (cores >= 8 && mem >= 8) return 'high';
  if (cores >= 4) return 'medium';
  return 'low';
}

/** Desktop presets — unchanged. */
const DESKTOP: Record<Tier, Omit<QualitySettings, 'tier' | 'reducedMotion' | 'mobile'>> = {
  low: {
    dpr: [1, 1.25],
    starCount: 1800,
    webNodes: 120,
    fieldParticles: 900,
    bloom: false,
    bloomLevels: 8,
    chromaticAberration: false,
    antialias: false,
  },
  medium: {
    dpr: [1, 1.6],
    starCount: 4500,
    webNodes: 200,
    fieldParticles: 2200,
    bloom: true,
    bloomLevels: 8,
    chromaticAberration: false,
    antialias: false,
  },
  high: {
    dpr: [1, 2],
    starCount: 9000,
    webNodes: 260,
    fieldParticles: 4500,
    bloom: true,
    bloomLevels: 8,
    chromaticAberration: true,
    antialias: false,
  },
};

/**
 * Phone presets.
 *
 * Bloom stays ON — it is what makes the scene read as atmosphere rather than
 * flat shapes — but runs a shorter mip chain (5–6 levels instead of 8). The
 * dropped levels are the widest, blurriest ones, so the visible change is a
 * marginally tighter halo while three full-screen passes disappear.
 *
 * The dominant saving, though, is DPR: phones report up to 4, and bloom cost
 * scales with pixel count, so capping at 1.5 cuts the fill by roughly 4x.
 *
 * Particle counts sit between the old `low` values and desktop: enough for the
 * dust and depth to read on a small screen, far below desktop's fill cost.
 */
const MOBILE: Record<Tier, Omit<QualitySettings, 'tier' | 'reducedMotion' | 'mobile'>> = {
  low: {
    // Phones report DPR up to 4. Anything past ~1.5 is invisible at arm's
    // length and quadruples the pixels the fragment shaders have to fill.
    dpr: [1, 1.4],
    starCount: 2600,
    webNodes: 110,
    fieldParticles: 1300,
    bloom: true,
    bloomLevels: 5,
    chromaticAberration: false,
    antialias: false,
  },
  medium: {
    dpr: [1, 1.5],
    starCount: 3600,
    webNodes: 150,
    fieldParticles: 1800,
    bloom: true,
    bloomLevels: 6,
    chromaticAberration: false,
    antialias: false,
  },
  high: {
    dpr: [1, 1.5],
    starCount: 3600,
    webNodes: 150,
    fieldParticles: 1800,
    bloom: true,
    bloomLevels: 6,
    chromaticAberration: false,
    antialias: false,
  },
};

export function getQuality(): QualitySettings {
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const mobile = isMobileDevice();
  const tier = reducedMotion ? 'low' : detectTier(mobile);
  const preset = (mobile ? MOBILE : DESKTOP)[tier];

  return { tier, mobile, reducedMotion, ...preset };
}
