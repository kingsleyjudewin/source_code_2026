'use client';

import { useEffect, useRef } from 'react';
import { initGsap } from '@/lib/gsap';
import { scrollStore } from '@/lib/scroll';
import { FEST, REGISTER_URL } from '@/data/events';

/**
 * SECTION 1 — the dark quantum web.
 *
 * The lattice itself lives in the WebGL layer (QuantumWeb). Everything here is
 * DOM, deliberately: the title is real text with a CSS metallic gradient and a
 * mask reveal, so it stays pin-sharp at any DPI. Rendering it as particles —
 * which is what this used to do — can only ever produce soft edges, and it cost
 * tens of thousands of points every frame for the privilege.
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
      const badge = st.querySelector('[data-hero="badge"]');
      const titleLines = gsap.utils.toArray<HTMLElement>('[data-hero="line"]', st);
      const sweep = st.querySelector('[data-hero="sweep"]');
      const words = gsap.utils.toArray<HTMLElement>('[data-hero="word"]', st);
      const cta = st.querySelector('[data-hero="cta"]');
      const cue = st.querySelector('[data-hero="cue"]');

      if (reduced) {
        gsap.set([badge, cta, cue, ...titleLines, ...words], { opacity: 1, y: 0 });
        gsap.set(titleLines, { '--reveal': 1 });
        return;
      }

      // ---- boot sequence: web powers up, then the title materialises -------
      const intro = gsap.timeline({ delay: 0.5 });

      intro
        .fromTo(badge, { opacity: 0, y: 18, filter: 'blur(8px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power3.out' })
        // Mask wipe — the letters are revealed, never faded, so edges stay crisp.
        .fromTo(titleLines, { '--reveal': 0, y: 26 },
          { '--reveal': 1, y: 0, duration: 1.1, stagger: 0.16, ease: 'power4.out' }, '-=0.45')
        // Metallic shine crosses the wordmark once it has landed.
        .fromTo(sweep, { xPercent: -130, opacity: 0 },
          { xPercent: 130, opacity: 1, duration: 1.1, ease: 'power2.inOut' }, '-=0.5')
        .fromTo(words, { opacity: 0, y: 30, filter: 'blur(10px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7, stagger: 0.13, ease: 'power3.out' }, '-=0.85')
        .fromTo(cta, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.35')
        .fromTo(cue, { opacity: 0 }, { opacity: 1, duration: 0.6 }, '-=0.2');

      // ---- scroll-away: the hero compresses as the web is pulled upward ----
      gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: '+=150%',
          pin: st,
          scrub: 1.15,
          anticipatePin: 1,
          onUpdate: (self) => scrollStore.set({ scene: 'hero', sceneProgress: self.progress }),
          onEnterBack: () => scrollStore.set({ scene: 'hero' }),
        },
      })
        .to(badge, { opacity: 0, y: -30, ease: 'none' }, 0)
        .to(titleLines, { y: -60, opacity: 0, stagger: 0.05, ease: 'power2.in' }, 0.08)
        .to(words, { y: -40, opacity: 0, stagger: 0.04, ease: 'power2.in' }, 0.2)
        .to(cta, { opacity: 0, y: -24, ease: 'none' }, 0.1)
        .to(cue, { opacity: 0, ease: 'none' }, 0.02);
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="hero" className="hero relative" aria-label="Source Code 2026">
      <div
        ref={stage}
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 text-center"
      >
        {/* Depth: dark gradient floor + corner falloff, under the DOM content. */}
        <div className="hero-veil" aria-hidden="true" />
        <div className="hero-sparks" aria-hidden="true">
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} style={{ ['--i' as string]: i }} />
          ))}
        </div>

        {/* Organiser strip — a glass badge, not loose text. */}
        <div data-hero="badge" className="hero-badge">
          <span className="hero-badge-mark" aria-hidden="true" />
          <span className="hero-badge-text">
            <strong>{FEST.university}</strong>
            <span>{FEST.department}</span>
          </span>
          <span className="hero-badge-div" aria-hidden="true" />
          <span className="hero-badge-org">{FEST.association}</span>
        </div>

        <h1 className="hero-title">
          <span className="sr-only">
            {FEST.name} — {FEST.university}
          </span>
          <span data-hero="line" className="hero-line" aria-hidden="true">
            Source Code
          </span>
          <span data-hero="line" className="hero-line hero-line--year" aria-hidden="true">
            2026
            <span data-hero="sweep" className="hero-sweep" />
          </span>
        </h1>

        <p className="hero-tagline">
          {FEST.tagline.map((word) => (
            <span key={word} data-hero="word" className="hero-word">
              {word}
            </span>
          ))}
        </p>

        <div data-hero="cta" className="hero-cta">
          <a
            href={REGISTER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hero-btn hero-btn--primary"
          >
            <span>Register Now</span>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M14 4h6v6M20 4l-8.5 8.5M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="sr-only">(opens in a new tab)</span>
          </a>

          <a href="#events" className="hero-btn hero-btn--ghost">
            Explore Events
          </a>
        </div>

        <div data-hero="cue" className="hero-cue">
          <span className="hero-cue-label">Enter the network</span>
          <span className="hero-cue-rail" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
