'use client';

/**
 * Adaptive quality tier.
 *
 * The brief asks for 60fps *and* heavy post-processing. Those only coexist if the
 * scene scales itself to the device. We pick a tier once at boot from cheap,
 * synchronous signals — no benchmark frame-drop dance that makes the first
 * second of the hero stutter.
 */
export type Tier = 'low' | 'medium' | 'high';

export type QualitySettings = {
  tier: Tier;
  dpr: [number, number];
  /** Particle counts are the single biggest lever on GPU cost. */
  starCount: number;
  logoParticles: number;
  fieldParticles: number;
  bloom: boolean;
  chromaticAberration: boolean;
  antialias: boolean;
  reducedMotion: boolean;
};

function detectTier(): Tier {
  if (typeof window === 'undefined') return 'medium';

  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const narrow = window.innerWidth < 768;

  // Phones do the same work on a fraction of the thermal budget.
  if (coarse || narrow) {
    return cores >= 8 && mem >= 6 ? 'medium' : 'low';
  }
  if (cores >= 8 && mem >= 8) return 'high';
  if (cores >= 4) return 'medium';
  return 'low';
}

export function getQuality(): QualitySettings {
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const tier = reducedMotion ? 'low' : detectTier();

  const presets: Record<Tier, Omit<QualitySettings, 'tier' | 'reducedMotion'>> = {
    low: {
      dpr: [1, 1.25],
      starCount: 1800,
      logoParticles: 6000,
      fieldParticles: 900,
      bloom: false,
      chromaticAberration: false,
      antialias: false,
    },
    medium: {
      dpr: [1, 1.6],
      starCount: 4500,
      logoParticles: 18000,
      fieldParticles: 2200,
      bloom: true,
      chromaticAberration: false,
      antialias: false,
    },
    high: {
      dpr: [1, 2],
      starCount: 9000,
      logoParticles: 42000,
      fieldParticles: 4500,
      bloom: true,
      chromaticAberration: true,
      antialias: false,
    },
  };

  return { tier, reducedMotion, ...presets[tier] };
}
