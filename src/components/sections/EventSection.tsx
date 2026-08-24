'use client';

import { useEffect, useRef } from 'react';
import { initGsap } from '@/lib/gsap';
import { scrollStore, type SceneId } from '@/lib/scroll';
import type { SourceEvent } from '@/data/events';
import PosterFrame from '@/components/ui/PosterFrame';
import EventDetails from './EventDetails';
import UniverseBackdrop from './UniverseBackdrop';

/**
 * One event = one pinned narrative beat.
 *
 * The section pins for 150vh of scroll. While pinned, a single scrubbed
 * timeline drives everything: the poster pushes in, the detail panel rises,
 * the beat words fire one at a time, and the progress rail fills. The next
 * section only arrives once the story has finished telling itself.
 */
export default function EventSection({
  event,
  index,
}: {
  event: SourceEvent;
  index: number;
}) {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const st = stage.current;
    if (!el || !st) return;

    const { gsap, ScrollTrigger } = initGsap();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      const poster = st.querySelector('[data-reveal="poster"]');
      const panel = st.querySelector('[data-reveal="panel"]');
      const eyebrow = st.querySelector('[data-reveal="eyebrow"]');
      const beats = gsap.utils.toArray<HTMLElement>('[data-beat]', st);
      const rail = st.querySelector('[data-rail]');

      const setScene = (progress?: number) =>
        scrollStore.set({
          scene: event.id as SceneId,
          ...(progress === undefined ? {} : { sceneProgress: progress }),
        });

      // --- entrance (not scrubbed: fires once, on approach) ----------------
      gsap.set([poster, panel, eyebrow], { opacity: 0 });

      const intro = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top 78%',
          once: true,
        },
      });

      intro
        .fromTo(eyebrow, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7 })
        .fromTo(
          poster,
          { opacity: 0, y: 70, rotateY: index % 2 === 0 ? -14 : 14, scale: 0.94 },
          { opacity: 1, y: 0, rotateY: 0, scale: 1, duration: 1.35, ease: 'power4.out' },
          '-=0.45',
        )
        .fromTo(panel, { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' }, '-=1.0');

      if (reduced) {
        gsap.set([poster, panel, eyebrow], { opacity: 1, y: 0, scale: 1, rotateY: 0 });
        gsap.set(beats, { opacity: 1, y: 0, filter: 'blur(0px)' });
        return;
      }

      /** Reveals the beat words in sequence along whichever timeline is active. */
      const addBeats = (tl: gsap.core.Timeline, from: number, span: number) => {
        beats.forEach((b, i) => {
          const at = from + i * (span / Math.max(beats.length, 1));
          tl.fromTo(
            b,
            { opacity: 0, y: 34, filter: 'blur(10px)', scale: 0.9 },
            { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1, ease: 'power3.out', duration: 0.18 },
            at,
          );
          tl.to(b, { '--burst': 1, duration: 0.1, ease: 'power2.out' }, at);
          tl.to(b, { '--burst': 0, duration: 0.3, ease: 'power2.in' }, at + 0.1);
        });
      };

      const mm = gsap.matchMedia();

      // ================= DESKTOP — pinned scrub =========================
      mm.add('(min-width: 1024px)', () => {
        /**
         * Half the amount by which the details panel exceeds the viewport.
         * Offsetting +drift at the start and -drift at the end walks the whole
         * panel through the viewport across the pin, so every row stays
         * reachable. Returns 0 when it already fits, leaving the original 54px
         * parallax untouched.
         */
        const drift = () => {
          if (!panel) return 0;
          const over = panel.getBoundingClientRect().height + 56 - window.innerHeight;
          return over > 0 ? over / 2 : 0;
        };

        const scrub = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: '+=150%',
            pin: st,
            pinSpacing: true,
            scrub: 1.15,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => setScene(self.progress),
            onEnter: () => setScene(),
            onEnterBack: () => setScene(),
          },
        });

        scrub.to(poster, { scale: 1.12, y: -30, ease: 'none' }, 0);
        addBeats(scrub, 0.12, 0.62);
        if (rail) scrub.fromTo(rail, { scaleY: 0 }, { scaleY: 1, ease: 'none' }, 0);
        scrub.fromTo(panel, { y: () => drift() }, { y: () => -drift() - 54, ease: 'none' }, 0);
      });

      // ================= MOBILE — natural scroll ========================
      //
      // Stacked, a section runs ~1200–1600px against an ~844px viewport. Pinning
      // that fixes a box far taller than the screen, so everything below the fold
      // is unreachable for the whole pin. Letting it scroll normally keeps the
      // reveals, the beat sequence and the per-section scene changes, and the
      // card simply reads top-to-bottom the way it should on a phone.
      mm.add('(max-width: 1023px)', () => {
        const flow = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            end: 'bottom 15%',
            scrub: 1.15,
            invalidateOnRefresh: true,
            onUpdate: (self) => setScene(self.progress),
            onEnter: () => setScene(),
            onEnterBack: () => setScene(),
          },
        });

        // Gentle poster parallax only — no scaling that would crop the artwork
        // against a narrow column.
        flow.fromTo(poster, { y: 26 }, { y: -26, ease: 'none' }, 0);
        addBeats(flow, 0.3, 0.45);
        if (rail) flow.fromTo(rail, { scaleY: 0 }, { scaleY: 1, ease: 'none' }, 0);
      });
    }, el);

    return () => ctx.revert();
  }, [event.id, index]);

  return (
    <section
      ref={root}
      id={event.id}
      className="relative"
      style={{
        ['--section-accent' as string]: event.accent,
        ['--section-accent-deep' as string]: event.accentDeep,
      }}
      aria-labelledby={`${event.id}-title`}
    >
      <div ref={stage} className="relative flex min-h-screen items-center overflow-hidden py-14">
        <UniverseBackdrop universe={event.universe} />

        {/* Vertical progress rail */}
        <div className="pointer-events-none absolute left-5 top-1/2 hidden h-40 w-px -translate-y-1/2 bg-[color-mix(in_oklab,var(--color-holo)_12%,transparent)] lg:block">
          <span
            data-rail
            className="absolute inset-x-0 top-0 h-full origin-top bg-[var(--section-accent)]"
            style={{ boxShadow: '0 0 12px var(--section-accent)' }}
          />
          <span className="absolute -left-[3px] top-0 font-mono text-[0.55rem] tracking-[0.3em] text-[var(--color-muted)] [writing-mode:vertical-rl] translate-y-[-130%]">
            0{index + 1}
          </span>
        </div>

        <div className="relative mx-auto grid w-full max-w-[1500px] items-center gap-10 px-5 sm:px-8 lg:grid-cols-[55fr_45fr] lg:gap-14 lg:px-16">
          {/* IMAGE — 55% */}
          <div data-reveal="poster" className={index % 2 === 1 ? 'lg:order-2' : ''}>
            <div
              data-reveal="eyebrow"
              className="eyebrow mb-5 flex items-center gap-3"
            >
              <span className="h-px w-10 bg-[var(--section-accent)]" />
              Event 0{index + 1} — {event.universe.replace('-', ' ')}
            </div>
            <PosterFrame
              poster={event.poster}
              alt={`${event.name} — official event poster`}
              priority={index === 0}
            />
          </div>

          {/* CONTENT — 45% */}
          <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
            <h2 id={`${event.id}-title`} className="sr-only">
              {event.name}
            </h2>
            <EventDetails event={event} />

            {/* Beat words */}
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              {event.beats.map((beat) => (
                <span key={beat} data-beat className="beat-word">
                  {beat}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
