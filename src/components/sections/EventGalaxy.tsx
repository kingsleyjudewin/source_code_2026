'use client';

import { useEffect, useRef } from 'react';
import { initGsap } from '@/lib/gsap';
import { scrollStore } from '@/lib/scroll';
import { EVENTS } from '@/data/events';

/**
 * SECTION 2 — the map.
 *
 * Events orbit a holographic core in the constellation the brief specifies.
 * On scroll the whole rig flies toward the camera and the cards spread apart,
 * handing the user off to the first event section.
 */

// Orbital placement, as % of the stage. Mirrors the brief's layout:
//              BRAND NEW CIRCUIT
//   DAILY BUGLE            BRAINVERSE
//              THE GAUNTLET
//               STARK FORGE
const ORBITS: Record<string, { x: number; y: number; depth: number }> = {
  'brand-new-circuit': { x: 50, y: 8, depth: -40 },
  'daily-bugle': { x: 13, y: 40, depth: 60 },
  brainverse: { x: 87, y: 40, depth: 60 },
  'the-gauntlet': { x: 50, y: 62, depth: 140 },
  'stark-forge': { x: 50, y: 90, depth: 20 },
};

export default function EventGalaxy() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const st = stage.current;
    if (!el || !st) return;

    const { gsap } = initGsap();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>('[data-orbit]', st);
      const core = st.querySelector('[data-core]');
      const heading = st.querySelector('[data-galaxy-heading]');

      gsap.timeline({
        scrollTrigger: { trigger: el, start: 'top 70%', once: true },
      })
        .fromTo(heading, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1 })
        .fromTo(core, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 1.4, ease: 'expo.out' }, '-=0.7')
        .fromTo(
          cards,
          { opacity: 0, scale: 0.6, z: -300 },
          { opacity: 1, scale: 1, z: 0, duration: 1.2, stagger: 0.11, ease: 'power3.out' },
          '-=1.0',
        );

      if (reduced) return;

      gsap
        .timeline({
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: '+=130%',
            pin: st,
            scrub: 1.15,
            anticipatePin: 1,
            onUpdate: (self) =>
              scrollStore.set({ scene: 'galaxy', sceneProgress: self.progress }),
            onEnter: () => scrollStore.set({ scene: 'galaxy' }),
            onEnterBack: () => scrollStore.set({ scene: 'galaxy' }),
          },
        })
        // Cards fly toward and past the camera, spreading as they come.
        .to(
          cards,
          {
            z: (i: number) => 420 + i * 90,
            x: (i: number) => (i % 2 === 0 ? -1 : 1) * (90 + i * 26),
            opacity: 0,
            ease: 'power2.in',
            stagger: 0.06,
          },
          0,
        )
        .to(core, { scale: 3.4, opacity: 0, ease: 'power2.in' }, 0.15)
        .to(heading, { opacity: 0, y: -50, ease: 'none' }, 0);
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      id="events"
      className="relative"
      style={{ ['--section-accent' as string]: 'var(--color-infinity)' }}
      aria-labelledby="galaxy-title"
    >
      <div
        ref={stage}
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-24"
      >
        <div data-galaxy-heading className="relative z-20 mb-10 text-center">
          <p className="eyebrow mb-4">The Event Galaxy</p>
          <h2 id="galaxy-title" className="display text-metal text-[clamp(1.9rem,5.5vw,4.2rem)]">
            Five Universes.
            <span className="block text-holo">One Fest.</span>
          </h2>
        </div>

        {/* Holographic core */}
        <div data-core className="galaxy-core" aria-hidden="true">
          <span className="galaxy-core-ring" />
          <span className="galaxy-core-ring galaxy-core-ring-2" />
          <span className="galaxy-core-glow" />
        </div>

        {/* Orbital field */}
        <div className="galaxy-field">
          {EVENTS.map((event, i) => {
            const orbit = ORBITS[event.id] ?? { x: 50, y: 50, depth: 0 };
            return (
              <a
                key={event.id}
                href={`#${event.id}`}
                data-orbit
                className="orbit-card group"
                style={{
                  left: `${orbit.x}%`,
                  top: `${orbit.y}%`,
                  ['--depth' as string]: `${orbit.depth}px`,
                  ['--orbit-accent' as string]: event.accent,
                  animationDelay: `${i * 0.7}s`,
                }}
              >
                <span className="orbit-trail" aria-hidden="true" />
                <span className="orbit-card-inner glass">
                  <span className="orbit-index">0{i + 1}</span>
                  <span className="orbit-name">{event.name}</span>
                  <span className="orbit-tag">{event.category}</span>
                  <span className="orbit-pulse" aria-hidden="true" />
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
