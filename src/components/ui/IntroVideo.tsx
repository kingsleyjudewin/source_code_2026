'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Cinematic intro film.
 *
 * Two cuts ship: a 16:9 landscape edit for desktop and a 9:16 portrait edit for
 * phones. The source is chosen client-side from a media query *before* the
 * <video> mounts, so only one file is ever fetched — picking with two <source
 * media> tags would be simpler but browser support for that is inconsistent, and
 * some engines speculatively fetch both.
 *
 * The intro owns the scroll lock while it runs (via a class on <html>, so the
 * preloader clearing its own inline style can't release it early), and always
 * has an exit: it ends on completion, on Skip, on Escape, if autoplay is
 * refused, or if the file simply fails to load.
 */
const FADE_MS = 900;

type Phase = 'playing' | 'out' | 'done';

export default function IntroVideo() {
  const [src, setSrc] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('playing');
  const [canSkip, setCanSkip] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const finished = useRef(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    setPhase('out');
    document.documentElement.classList.remove('intro-active');
    window.setTimeout(() => setPhase('done'), FADE_MS);
  }, []);

  // --- pick the cut, or bypass the intro entirely ------------------------
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finished.current = true;
      setPhase('done');
      return;
    }

    // Portrait phones get the vertical edit; everything else gets the wide one.
    const isMobile =
      window.matchMedia('(max-width: 820px)').matches ||
      (window.matchMedia('(pointer: coarse)').matches && window.innerWidth < 1100);

    document.documentElement.classList.add('intro-active');
    setSrc(isMobile ? '/intro/mobile.mp4' : '/intro/desktop.mp4');

    // Let the viewer bail out after a beat, not instantly — a skip button that
    // appears on frame one invites a reflexive click past the whole film.
    const t = window.setTimeout(() => setCanSkip(true), 1200);

    return () => {
      window.clearTimeout(t);
      document.documentElement.classList.remove('intro-active');
    };
  }, []);

  // --- escape hatches -----------------------------------------------------
  useEffect(() => {
    if (phase !== 'playing') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') finish();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, finish]);

  // --- autoplay ----------------------------------------------------------
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !src) return;

    // A hard ceiling well past both cuts (~7s), so a stalled network can never
    // strand someone on a black screen.
    const ceiling = window.setTimeout(finish, 12000);

    v.play().catch(() => {
      // Autoplay refused (some mobile data-saver modes do this even when muted).
      // Don't trap the viewer behind a play button — go straight to the site.
      finish();
    });

    return () => window.clearTimeout(ceiling);
  }, [src, finish]);

  if (phase === 'done') return null;

  return (
    <div
      className={`intro ${phase === 'out' ? 'intro--out' : ''}`}
      role="dialog"
      aria-label="Source Code 2026 intro film"
    >
      {src && (
        <video
          ref={videoRef}
          className="intro-video"
          src={src}
          muted
          playsInline
          autoPlay
          preload="auto"
          // Autoplay is only permitted while muted, so there is no audio track to
          // expose; the film is decorative and carries no information the page
          // doesn't also state in text.
          aria-hidden="true"
          onEnded={finish}
          onError={finish}
        />
      )}

      {/* Vignette so the film's edges meet the site's palette rather than the
          browser's black letterbox. */}
      <div className="intro-vignette" aria-hidden="true" />

      <button
        type="button"
        className={`intro-skip ${canSkip ? 'intro-skip--shown' : ''}`}
        onClick={finish}
      >
        Skip intro
      </button>
    </div>
  );
}
