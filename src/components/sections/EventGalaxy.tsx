'use client';

import { useEffect, useRef } from 'react';
import { initGsap, ScrollTrigger } from '@/lib/gsap';
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

      const setScene = (progress?: number) =>
        scrollStore.set({
          scene: 'galaxy',
          ...(progress === undefined ? {} : { sceneProgress: progress }),
        });

      const mm = gsap.matchMedia();

      // ================= DESKTOP — pinned fly-through ====================
      // Breakpoint matches the stylesheet: the orbital scatter only exists
      // above 900px, where .galaxy-field is still an absolutely-positioned
      // field rather than a stacked grid.
      mm.add('(min-width: 901px)', () => {
        const tl = gsap
          .timeline({
            scrollTrigger: {
              trigger: el,
              start: 'top top',
              end: '+=130%',
              pin: st,
              scrub: 1.15,
              anticipatePin: 1,
              // Function-based x/z below must be re-read after a resize.
              invalidateOnRefresh: true,
              onUpdate: (self) => setScene(self.progress),
              onEnter: () => setScene(),
              onEnterBack: () => setScene(),
              // Reloading with the galaxy already on screen leaves the scene
              // owned by the hero.
              //
              // Landing exactly on this section's start means its progress goes
              // 0 -> 0, so onUpdate never fires and onEnter never sees the edge
              // crossed. Meanwhile the hero's progress swept 0 -> 1 during scroll
              // restoration, so its onUpdate ran last and left the WebGL layer on
              // the hero's near-black mood — the galaxy rendered with no nebula.
              //
              // The rAF defers past the synchronous refresh pass, so this claim
              // lands after any other trigger's callbacks rather than racing them.
              onRefresh: (self) => {
                if (self.isActive) requestAnimationFrame(() => setScene(self.progress));
              },
            },
          })
          // Cards fly toward and past the camera, spreading as they come.
          //
          // `immediateRender: false` is load-bearing. The entrance timeline also
          // animates card opacity, but only fires at 'top 70%'. This timeline is
          // built on mount, and without the flag GSAP records its start values
          // right then — while the cards are still at opacity 0 — so it would
          // tween 0 -> 0 and the whole grid stays invisible. Whether that race
          // was lost depended on scroll position and refresh timing, which is
          // why the cards appeared only sometimes.
          .to(
            cards,
            {
              z: (i: number) => 420 + i * 90,
              x: (i: number) => (i % 2 === 0 ? -1 : 1) * (90 + i * 26),
              opacity: 0,
              ease: 'power2.in',
              stagger: 0.06,
              immediateRender: false,
              overwrite: 'auto',
            },
            0,
          )
          .to(core, { scale: 3.4, opacity: 0, ease: 'power2.in', immediateRender: false, overwrite: 'auto' }, 0.15)
          .to(heading, { opacity: 0, y: -50, ease: 'none', immediateRender: false, overwrite: 'auto' }, 0);

        /**
         * Claim the scene if this section is what's actually on screen.
         *
         * A pinned section entered at exactly its start has progress 0 -> 0, so
         * onUpdate never fires and it never announces itself — while the hero's
         * progress swept 0 -> 1 during scroll restoration and left the WebGL
         * layer on its near-black mood. onRefresh alone doesn't cover it either,
         * because the browser restores scroll *after* the initial refresh, when
         * this trigger still looks inactive.
         *
         * Both hooks are no-ops unless this section is genuinely active, so they
         * can't steal the scene from anywhere else.
         */
        /**
         * Geometry, not trigger state.
         *
         * `isActive` cannot be trusted for this: it is `undefined` until a
         * trigger has been updated at least once, and when the page lands
         * exactly on a pinned trigger's start the progress never changes, so no
         * update runs and it stays `false`. Landing on this section is precisely
         * that case. Asking whether the section covers the viewport's midpoint
         * is deterministic and needs no internal state.
         */
        const claimIfInView = () => {
          const r = el.getBoundingClientRect();
          const mid = window.innerHeight / 2;
          if (r.top <= mid && r.bottom >= mid) {
            setScene(tl.scrollTrigger?.progress ?? 0);
          }
        };

        // Visibility, not a timer. The intro film locks scrolling, so on a reload
        // the page sits at y=0 until it is dismissed — any timeout fires while
        // this section is still off screen and claims nothing. An observer fires
        // whenever the section actually arrives, however long the film runs.
        //
        // The midpoint test makes it inert once the pin has been scrolled past,
        // so it can never steal the scene from the section that follows.
        const io = new IntersectionObserver(
          (entries) => {
            if (entries.some((e) => e.isIntersecting)) claimIfInView();
          },
          { threshold: 0.5 },
        );
        io.observe(el);

        ScrollTrigger.addEventListener('refresh', claimIfInView);

        return () => {
          io.disconnect();
          ScrollTrigger.removeEventListener('refresh', claimIfInView);
        };
      });

      // ================= MOBILE — cards stay put and stay readable =======
      //
      // Below 900px the field is a vertical stack, so the desktop fly-out was
      // actively harmful: it wrote an inline horizontal transform of up to
      // ~194px, which the stylesheet's `transform: none` could not override
      // (inline wins), pushing full-width cards off the left edge. It also faded
      // them to zero mid-scroll. Here the cards simply hold their position, and
      // only the scene tracking runs.
      mm.add('(max-width: 900px)', () => {
        const trigger = ScrollTrigger.create({
          trigger: el,
          start: 'top 85%',
          end: 'bottom 15%',
          onUpdate: (self) => setScene(self.progress),
          onEnter: () => setScene(),
          onEnterBack: () => setScene(),
        });

        const claimIfInView = () => {
          const r = el.getBoundingClientRect();
          const mid = window.innerHeight / 2;
          if (r.top <= mid && r.bottom >= mid) setScene(trigger.progress);
        };

        const io = new IntersectionObserver(
          (entries) => {
            if (entries.some((e) => e.isIntersecting)) claimIfInView();
          },
          { threshold: 0.5 },
        );
        io.observe(el);
        ScrollTrigger.addEventListener('refresh', claimIfInView);

        return () => {
          io.disconnect();
          ScrollTrigger.removeEventListener('refresh', claimIfInView);
          trigger.kill();
        };
      });

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
