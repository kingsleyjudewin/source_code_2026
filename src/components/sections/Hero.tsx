'use client';

import { useEffect, useRef } from 'react';
import { initGsap } from '@/lib/gsap';
import { scrollStore } from '@/lib/scroll';
import { FEST, HEADER_LOCKUP } from '@/data/events';

/**
 * SECTION 1 — arrival.
 *
 * The particle logo itself lives in the WebGL layer (ParticleLogo). This is the
 * DOM half: the institutional lockup, the tagline, and the arc reactor. The
 * section pins for 200vh so the assembly has room to breathe before the user is
 * released into the galaxy.
 */
export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const st = stage.current;
    if (!el || !st) return;

    const { gsap } = initGsap();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      const lockup = st.querySelector('[data-hero="lockup"]');
      const words = gsap.utils.toArray<HTMLElement>('[data-hero="word"]', st);
      const meta = gsap.utils.toArray<HTMLElement>('[data-hero="meta"]', st);
      const reactor = st.querySelector('[data-hero="reactor"]');
      const cue = st.querySelector('[data-hero="cue"]');

      // --- opening: everything arrives out of the dark ---------------------
      const intro = gsap.timeline({ delay: reduced ? 0 : 0.35 });

      intro
        .fromTo(reactor, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 1.8, ease: 'expo.out' })
        .fromTo(lockup, { opacity: 0, y: 30, filter: 'blur(14px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.4 }, '-=1.2')
        .fromTo(
          meta,
          { opacity: 0, y: 26 },
          { opacity: 1, y: 0, duration: 1, stagger: 0.14 },
          '-=0.9',
        )
        .fromTo(
          words,
          { opacity: 0, y: 60, rotateX: -70, filter: 'blur(12px)' },
          { opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)', duration: 1.1, stagger: 0.16, ease: 'power4.out' },
          '-=0.7',
        )
        .fromTo(cue, { opacity: 0 }, { opacity: 1, duration: 0.8 }, '-=0.3');

      if (reduced) return;

      // --- pinned scrub: the DOM recedes as the particle logo takes over ----
      gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: '+=200%',
          pin: st,
          scrub: 1.15,
          anticipatePin: 1,
          onUpdate: (self) => {
            scrollStore.set({ scene: 'hero', sceneProgress: self.progress });
          },
          onEnterBack: () => scrollStore.set({ scene: 'hero' }),
        },
      })
        // Institutional lockup fades early — it's the "presented by" card.
        .to(lockup, { opacity: 0, y: -40, ease: 'none' }, 0)
        .to(meta, { opacity: 0, y: -30, stagger: 0.04, ease: 'none' }, 0.02)
        // Tagline holds through the middle, then flies past the camera.
        .to(words, { y: -70, ease: 'none' }, 0)
        .to(words, { opacity: 0, scale: 1.5, filter: 'blur(14px)', stagger: 0.05, ease: 'power2.in' }, 0.55)
        .to(reactor, { scale: 2.6, opacity: 0, ease: 'power2.in' }, 0.45)
        .to(cue, { opacity: 0, ease: 'none' }, 0.05);
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      id="hero"
      className="relative"
      style={{ ['--section-accent' as string]: 'var(--color-arc)' }}
      aria-label="Source Code 2026 — introduction"
    >
      <div
        ref={stage}
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 text-center"
      >
        {/* Arc reactor */}
        <div data-hero="reactor" className="arc-reactor" aria-hidden="true">
          <span className="arc-ring arc-ring-1" />
          <span className="arc-ring arc-ring-2" />
          <span className="arc-ring arc-ring-3" />
          <span className="arc-core" />
          <span className="arc-wave" />
          <span className="arc-wave arc-wave-2" />
        </div>

        {/* Institutional lockup (CUESTIC · Source Code · CHRIST) */}
        <div data-hero="lockup" className="relative z-10 mb-10">
          <img
            src={HEADER_LOCKUP.webp.replace('{w}', '1080')}
            alt="CUESTIC · Source Code · CHRIST (Deemed to be University)"
            width={HEADER_LOCKUP.width}
            height={HEADER_LOCKUP.height}
            className="h-auto w-[min(78vw,520px)] opacity-95"
            fetchPriority="high"
            decoding="async"
          />
        </div>

        {/* The title itself is rendered in WebGL as particles. This h1 carries
            the same words for screen readers, crawlers and no-WebGL fallback. */}
        <h1 className="relative z-10 mb-14 sm:mb-20">
          <span className="sr-only">
            {FEST.name} — {FEST.university}
          </span>
          <span
            aria-hidden="true"
            className="display text-metal block text-[clamp(2.6rem,9vw,7.5rem)] leading-[0.86] opacity-0 motion-reduce:opacity-100"
          >
            Source Code
            <span className="block text-holo">2026</span>
          </span>
        </h1>

        {/* Tagline */}
        <div className="relative z-10 flex flex-wrap items-baseline justify-center gap-x-5 gap-y-1 [perspective:800px]">
          {FEST.tagline.map((word) => (
            <span
              key={word}
              data-hero="word"
              className="display text-glow text-[clamp(1.5rem,4.2vw,3.4rem)] text-[var(--color-holo)]"
            >
              {word}
            </span>
          ))}
        </div>

        {/* Institution meta */}
        <div className="relative z-10 mt-12 flex flex-col items-center gap-2.5">
          <p data-hero="meta" className="eyebrow">
            {FEST.university}
          </p>
          <p data-hero="meta" className="max-w-md text-sm text-[var(--color-silver)]/75">
            {FEST.department}
          </p>
          <p data-hero="meta" className="font-mono text-xs tracking-[0.4em] text-[var(--color-arc)]">
            {FEST.association}
          </p>
        </div>

        {/* Scroll cue */}
        <div
          data-hero="cue"
          className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3"
        >
          <span className="font-mono text-[0.55rem] uppercase tracking-[0.42em] text-[var(--color-muted)]">
            Begin
          </span>
          <span className="scroll-cue" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
