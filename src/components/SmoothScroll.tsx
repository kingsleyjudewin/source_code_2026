'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { initGsap } from '@/lib/gsap';
import { scrollStore } from '@/lib/scroll';

/**
 * Wires Lenis, GSAP ScrollTrigger and the global scroll store into one clock.
 *
 * The critical detail: ScrollTrigger must be driven *by* Lenis (scrollerProxy +
 * manual update), not run alongside it. Two independent RAF loops reading the
 * same scroll position is where 90% of "my pinned section jitters" comes from.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const { gsap, ScrollTrigger } = initGsap();

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const lenis = new Lenis({
      // Continuous damping rather than a fixed-duration tween.
      //
      // `duration` + `easing` restarts an ease on every wheel event, so a run of
      // ticks reads as a series of small lurches. A lerp is a single exponential
      // chase toward the target: consecutive input blends into one unbroken
      // glide, which is what actually reads as "smooth" on a scroll-driven site.
      lerp: prefersReduced ? 1 : 0.085,
      smoothWheel: !prefersReduced,
      // Slightly under 1 so each notch travels less and long pinned sections
      // can be scrubbed precisely instead of skipped past.
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
      // Touch devices keep native inertia; emulating it always feels wrong.
      syncTouch: false,
    });

    lenis.on('scroll', ({ progress, velocity }: { progress: number; velocity: number }) => {
      scrollStore.set({ progress, velocity });
      ScrollTrigger.update();
    });

    // Hand ScrollTrigger Lenis' clock instead of its own.
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.defaults({ markers: false });
    // Mobile browser chrome collapsing on scroll fires a resize, which otherwise
    // recalculates every pin mid-scroll and shows up as a visible jump.
    ScrollTrigger.config({ ignoreMobileResize: true });
    ScrollTrigger.refresh();

    // Fonts and posters both change layout height after first paint.
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener('load', refresh);

    return () => {
      gsap.ticker.remove(raf);
      window.removeEventListener('load', refresh);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return <>{children}</>;
}
