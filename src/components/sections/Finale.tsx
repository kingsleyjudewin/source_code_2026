'use client';

import { useEffect, useRef } from 'react';
import { initGsap } from '@/lib/gsap';
import { scrollStore } from '@/lib/scroll';
import { FEST, isTBA } from '@/data/events';
import RegisterButton from '@/components/ui/RegisterButton';

/**
 * SECTION 9 — convergence.
 *
 * Every universe collapses inward: circuit traces, stone light, shutter flash,
 * synapse fire and cipher rain all streak toward one point, the logo ignites out
 * of the collision, and the page resolves into the call to action.
 */
const CONVERGENCE = [
  { color: 'var(--color-repulsor)', label: 'circuit' },
  { color: 'var(--color-infinity)', label: 'stone' },
  { color: 'var(--color-holo)', label: 'flash' },
  { color: 'var(--color-arc)', label: 'synapse' },
  { color: 'var(--color-quantum)', label: 'cipher' },
  { color: 'var(--color-stark)', label: 'forge' },
];

export default function Finale() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const st = stage.current;
    if (!el || !st) return;

    const { gsap } = initGsap();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      const streaks = gsap.utils.toArray<HTMLElement>('[data-streak]', st);
      const logo = st.querySelector('[data-finale="logo"]');
      const year = st.querySelector('[data-finale="year"]');
      const meta = gsap.utils.toArray<HTMLElement>('[data-finale="meta"]', st);
      const tagline = st.querySelector('[data-finale="tagline"]');
      const cta = st.querySelector('[data-finale="cta"]');
      const flash = st.querySelector('[data-finale="flash"]');

      if (reduced) {
        gsap.set([logo, year, tagline, cta, ...meta], { opacity: 1, y: 0, scale: 1 });
        return;
      }

      gsap.set([logo, year, tagline, cta, ...meta], { opacity: 0 });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: '+=180%',
            pin: st,
            scrub: 1.15,
            anticipatePin: 1,
            onUpdate: (self) =>
              scrollStore.set({ scene: 'finale', sceneProgress: self.progress }),
            onEnter: () => scrollStore.set({ scene: 'finale' }),
            onEnterBack: () => scrollStore.set({ scene: 'finale' }),
          },
        })
        // 1. Streaks rush inward from every direction.
        .fromTo(
          streaks,
          { opacity: 0, scaleX: 0.1 },
          { opacity: 1, scaleX: 1, duration: 0.22, stagger: 0.02, ease: 'power2.in' },
          0,
        )
        .to(streaks, { '--converge': 1, duration: 0.28, ease: 'power3.in' }, 0.05)
        // 2. Collision flash.
        .fromTo(flash, { opacity: 0, scale: 0.2 }, { opacity: 1, scale: 1, duration: 0.06, ease: 'power4.out' }, 0.33)
        .to(flash, { opacity: 0, scale: 3.2, duration: 0.22, ease: 'power2.out' }, 0.39)
        .to(streaks, { opacity: 0, duration: 0.1 }, 0.35)
        // 3. Logo emerges out of the flash.
        .fromTo(
          logo,
          { opacity: 0, scale: 0.72, filter: 'blur(28px)' },
          { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.24, ease: 'expo.out' },
          0.36,
        )
        .fromTo(year, { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: 0.18, ease: 'expo.out' }, 0.44)
        // 4. Institution, tagline, CTA.
        .fromTo(meta, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.14, stagger: 0.05 }, 0.56)
        .fromTo(tagline, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.14 }, 0.72)
        .fromTo(cta, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.16 }, 0.8);
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      id="finale"
      className="relative"
      style={{ ['--section-accent' as string]: 'var(--color-stark)' }}
      aria-labelledby="finale-title"
    >
      <div
        ref={stage}
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 text-center"
      >
        {/* Convergence streaks */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {CONVERGENCE.map((c, i) =>
            Array.from({ length: 5 }).map((_, j) => {
              const angle = (i * 60 + j * 12 - 24) % 360;
              return (
                <span
                  key={`${c.label}-${j}`}
                  data-streak
                  className="converge-streak"
                  style={{
                    ['--angle' as string]: `${angle}deg`,
                    ['--streak-color' as string]: c.color,
                    ['--offset' as string]: `${38 + (j % 3) * 10}%`,
                    animationDelay: `${(i * 5 + j) * 0.06}s`,
                  }}
                />
              );
            }),
          )}
        </div>

        <div data-finale="flash" className="finale-flash" aria-hidden="true" />

        <div className="relative z-10">
          <h2 id="finale-title" data-finale="logo" className="display text-metal text-[clamp(2.4rem,9vw,7.5rem)] leading-[0.85]">
            Source Code
          </h2>
          <span
            data-finale="year"
            className="display text-holo mt-1 block text-[clamp(3rem,13vw,11rem)] leading-[0.8]"
          >
            2026
          </span>

          <div className="mt-12 flex flex-col items-center gap-2.5">
            <p data-finale="meta" className="eyebrow">
              {FEST.university}
            </p>
            <p data-finale="meta" className="max-w-md text-sm text-[var(--color-silver)]/75">
              {FEST.department}
            </p>
            <p data-finale="meta" className="font-mono text-xs tracking-[0.4em] text-[var(--color-stark)]">
              {FEST.association}
            </p>
          </div>

          <p
            data-finale="tagline"
            className="display text-glow mt-12 text-[clamp(1rem,2.6vw,2rem)] text-[var(--color-holo)]"
          >
            {FEST.finaleTagline}
          </p>

          <div data-finale="cta" className="mt-12 flex flex-col items-center gap-7">
            <div>
              <p className="finale-cta-lead">Ready To Enter The Universe?</p>
              <RegisterButton label="Register for Source Code 2026" size="xl" />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a href={isTBA(FEST.contactEmail) ? '#contact' : `mailto:${FEST.contactEmail}`} className="btn-ghost">
                Contact Us
              </a>
              <a
                href={isTBA(FEST.instagram) ? '#follow' : FEST.instagram}
                className="btn-ghost"
                {...(isTBA(FEST.instagram) ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
              >
                Follow Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
