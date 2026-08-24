'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { Poster } from '@/data/events';

/**
 * Premium showcase frame.
 *
 * The poster is never presented as a flat rectangle. It sits inside a floating
 * glass slab with a holographic rim, and is split into two parallax planes: a
 * base layer and a foreground layer masked by the pipeline's depth map, so the
 * bright/high-energy subject genuinely separates from its background as you
 * move the pointer. Tilt, float and glare are driven from a single pointermove
 * handler writing CSS custom properties — no React state, no re-renders.
 */
export default function PosterFrame({
  poster,
  alt,
  priority = false,
  className = '',
}: {
  poster: Poster;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const pending = useRef({ x: 0, y: 0, active: 0 });
  const current = useRef({ x: 0, y: 0, active: 0 });

  const srcset = (tpl: string) =>
    poster.widths.map((w) => `${tpl.replace('{w}', String(w))} ${w}w`).join(', ');

  const loop = useCallback(() => {
    const el = root.current;
    if (!el) return;

    const c = current.current;
    const p = pending.current;

    // Critically-damped-ish follow. Slower than the pointer, which is what
    // makes it feel like a heavy object rather than a sticker.
    c.x += (p.x - c.x) * 0.09;
    c.y += (p.y - c.y) * 0.09;
    c.active += (p.active - c.active) * 0.09;

    el.style.setProperty('--px', c.x.toFixed(4));
    el.style.setProperty('--py', c.y.toFixed(4));
    el.style.setProperty('--hover', c.active.toFixed(4));

    const settled =
      Math.abs(p.x - c.x) < 0.0006 &&
      Math.abs(p.y - c.y) < 0.0006 &&
      Math.abs(p.active - c.active) < 0.0006;

    raf.current = settled ? 0 : requestAnimationFrame(loop);
  }, []);

  const kick = useCallback(() => {
    if (!raf.current) raf.current = requestAnimationFrame(loop);
  }, [loop]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    // Pointer parallax is a desktop affordance; on touch it just fights scrolling.
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pending.current.x = (e.clientX - r.left) / r.width - 0.5;
      pending.current.y = (e.clientY - r.top) / r.height - 0.5;
      pending.current.active = 1;
      kick();
    };
    const onLeave = () => {
      pending.current.x = 0;
      pending.current.y = 0;
      pending.current.active = 0;
      kick();
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [kick]);

  return (
    <div
      ref={root}
      className={`poster-frame group relative ${className}`}
      style={{
        ['--poster-accent' as string]: poster.accent,
        // Each poster is shown at its own aspect ratio — cropping a poster to a
        // fixed frame cuts the event name off the artwork. Clamped so an extreme
        // ratio can't blow out the split-screen row.
        ['--poster-aspect' as string]: String(Math.min(1.85, Math.max(0.82, poster.aspect))),
      }}
    >
      {/* Outer bloom — sits behind the glass and picks up the poster's own colour. */}
      <div className="poster-bloom" aria-hidden="true" />

      <div className="poster-slab glass glass-rim">
        <div className="poster-viewport">
          {/* Base plane */}
          <picture>
            <source type="image/avif" srcSet={srcset(poster.avif)} sizes="(max-width: 1024px) 92vw, 52vw" />
            <source type="image/webp" srcSet={srcset(poster.webp)} sizes="(max-width: 1024px) 92vw, 52vw" />
            <img
              className="poster-img poster-base"
              src={poster.webp.replace('{w}', String(poster.widths[poster.widths.length - 1]))}
              alt={alt}
              width={poster.width}
              height={poster.height}
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : 'auto'}
              decoding="async"
              style={{ backgroundImage: `url(${poster.lqip})` }}
            />
          </picture>

          {/* Foreground plane — same art, masked by the depth map so only the
              luminous subject survives, then pushed further on the parallax. */}
          {poster.depth && (
            <img
              className="poster-img poster-fg"
              src={poster.webp.replace('{w}', String(poster.widths[poster.widths.length - 1]))}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              style={{
                maskImage: `url(${poster.depth})`,
                WebkitMaskImage: `url(${poster.depth})`,
              }}
            />
          )}

          {/* Cinematic grade: lifts contrast and tints the shadows toward the void. */}
          <div className="poster-grade" aria-hidden="true" />
          {/* Edge feather — dissolves the rectangle into the frame. */}
          <div className="poster-feather" aria-hidden="true" />
          {/* Sweeping specular glare across the "glass". */}
          <div className="poster-glare" aria-hidden="true" />
          {/* Holographic sheen, hue-shifts with tilt. */}
          <div className="poster-holo" aria-hidden="true" />
          <div className="poster-scan" aria-hidden="true" />
        </div>

        {/* Corner brackets — the HUD/collectible-case detail. */}
        <span className="bracket bracket-tl" aria-hidden="true" />
        <span className="bracket bracket-tr" aria-hidden="true" />
        <span className="bracket bracket-bl" aria-hidden="true" />
        <span className="bracket bracket-br" aria-hidden="true" />
      </div>

      {/* Floor reflection. */}
      <div className="poster-reflection" aria-hidden="true">
        <img
          src={poster.webp.replace('{w}', String(poster.widths[0]))}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
}
