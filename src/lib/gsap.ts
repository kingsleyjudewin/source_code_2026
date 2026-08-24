'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let registered = false;

/**
 * GSAP must only be registered browser-side. Calling this from any client
 * component is safe and idempotent.
 */
export function initGsap() {
  if (registered || typeof window === 'undefined') return { gsap, ScrollTrigger };
  gsap.registerPlugin(ScrollTrigger);

  // Sub-pixel transforms cost us nothing visually and save a lot of raster work.
  gsap.config({ force3D: true, nullTargetWarn: false });
  gsap.defaults({ ease: 'power3.out', duration: 1 });

  registered = true;
  return { gsap, ScrollTrigger };
}

export { gsap, ScrollTrigger };
