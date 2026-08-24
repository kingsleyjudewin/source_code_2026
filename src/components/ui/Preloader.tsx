'use client';

import { useEffect, useState } from 'react';

/**
 * Arc reactor boot sequence.
 *
 * Covers the gap between first paint and the WebGL layer being ready, so the
 * user never sees an empty black void or a half-assembled particle logo. Exits
 * on `window.load` or after a hard ceiling, whichever comes first — a preloader
 * that can hang forever is worse than no preloader.
 */
const CEILING_MS = 3200;

export default function Preloader() {
  const [phase, setPhase] = useState<'boot' | 'out' | 'gone'>('boot');

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('gone');
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setPhase('out');
      document.body.style.overflow = '';
      // Matches the CSS exit duration.
      window.setTimeout(() => setPhase('gone'), 900);
    };

    // Minimum on-screen time so the boot animation doesn't flash-cut on fast loads.
    const min = window.setTimeout(() => {
      if (document.readyState === 'complete') finish();
      else window.addEventListener('load', finish, { once: true });
    }, 1100);

    const ceiling = window.setTimeout(finish, CEILING_MS);

    return () => {
      window.clearTimeout(min);
      window.clearTimeout(ceiling);
      window.removeEventListener('load', finish);
      document.body.style.overflow = '';
    };
  }, []);

  if (phase === 'gone') return null;

  return (
    <div className={`preloader ${phase === 'out' ? 'preloader--out' : ''}`} role="status" aria-live="polite">
      <div className="preloader-reactor" aria-hidden="true">
        <span className="preloader-ring" />
        <span className="preloader-ring preloader-ring-2" />
        <span className="preloader-core" />
      </div>
      <p className="preloader-label">Initialising</p>
      <div className="preloader-bar" aria-hidden="true">
        <span />
      </div>
      <span className="sr-only">Loading Source Code 2026</span>
    </div>
  );
}
