'use client';

import { useCallback, useRef, useState } from 'react';
import { REGISTER_URL } from '@/data/events';

/**
 * Registration CTA.
 *
 * Note on the "transition before opening": the click is NOT intercepted. Calling
 * preventDefault, animating, then window.open() lands outside the user-gesture
 * window and popup blockers eat it — the user would click Register and nothing
 * would happen. Instead the anchor navigates natively (new tab, immediately)
 * while the burst plays on this page, which is what the viewer actually sees
 * during the tab switch.
 */
export default function RegisterButton({
  label = 'Register Now',
  note = 'Limited Slots Available',
  size = 'md',
  className = '',
}: {
  label?: string;
  note?: string | null;
  size?: 'md' | 'xl';
  className?: string;
}) {
  const [burst, setBurst] = useState(0);
  const timer = useRef<number | undefined>(undefined);

  const onClick = useCallback(() => {
    // Re-keying the ripple restarts the animation on rapid repeat clicks.
    setBurst((n) => n + 1);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setBurst(0), 700);
  }, []);

  return (
    <span className={`register-wrap ${size === 'xl' ? 'register-wrap--xl' : ''} ${className}`}>
      <a
        href={REGISTER_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`btn-primary btn-register ${size === 'xl' ? 'btn-register--xl' : ''}`}
        onClick={onClick}
      >
        <span className="btn-register-label">{label}</span>

        {/* External-link affordance */}
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

        {/* Idle pulse ring + click ripple */}
        <span className="btn-pulse" aria-hidden="true" />
        {burst > 0 && <span key={burst} className="btn-ripple" aria-hidden="true" />}
      </a>

      {note && <span className="register-note">{note}</span>}
    </span>
  );
}
