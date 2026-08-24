'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { scrollStore } from '@/lib/scroll';
import { EVENTS, FEST } from '@/data/events';

const LINKS = [
  { href: '#hero', label: 'Home' },
  { href: '#events', label: 'Events' },
  { href: '#team', label: 'Team' },
  { href: '#finale', label: 'Register' },
];

/**
 * HUD-style navigation. Hides on the hero, materialises once the user commits
 * to scrolling, and carries the document progress ring.
 */
export default function Nav() {
  const progress = useStore(scrollStore, (s) => s.progress);
  const scene = useStore(scrollStore, (s) => s.scene);
  const [open, setOpen] = useState(false);
  const visible = progress > 0.02;
  const panel = useRef<HTMLDivElement>(null);

  // Close the mobile sheet on Escape and on navigation.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const circumference = 2 * Math.PI * 13;

  return (
    <>
      <a href="#events" className="skip-link">
        Skip to events
      </a>

      <header
        className={`nav-shell ${visible ? 'nav-shell--visible' : ''}`}
        style={{ ['--section-accent' as string]: 'var(--color-arc)' }}
      >
        <nav className="nav-inner glass" aria-label="Primary">
          <a href="#hero" className="nav-brand">
            <span className="nav-brand-mark" aria-hidden="true" />
            <span className="nav-brand-text">
              Source Code <span className="text-[var(--color-arc)]">2026</span>
            </span>
          </a>

          <ul className="nav-links">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="nav-link"
                  aria-current={
                    (l.href === '#events' && scene === 'galaxy') ||
                    (l.href === '#team' && scene === 'team') ||
                    (l.href === '#finale' && scene === 'finale') ||
                    (l.href === '#hero' && scene === 'hero')
                      ? 'page'
                      : undefined
                  }
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            {/* Document progress ring */}
            <svg className="nav-progress" viewBox="0 0 32 32" aria-hidden="true">
              <circle cx="16" cy="16" r="13" className="nav-progress-track" />
              <circle
                cx="16"
                cy="16"
                r="13"
                className="nav-progress-fill"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: circumference * (1 - progress),
                }}
              />
            </svg>

            <button
              type="button"
              className="nav-toggle"
              aria-expanded={open}
              aria-controls="nav-sheet"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
              <span className={`nav-burger ${open ? 'nav-burger--open' : ''}`} aria-hidden="true" />
            </button>
          </div>
        </nav>

        {/* Mobile sheet */}
        <div
          id="nav-sheet"
          ref={panel}
          className={`nav-sheet glass ${open ? 'nav-sheet--open' : ''}`}
          hidden={!open}
        >
          <ul>
            {[...LINKS.slice(0, 1), ...EVENTS.map((e) => ({ href: `#${e.id}`, label: e.name })), ...LINKS.slice(2)].map(
              (l) => (
                <li key={l.href}>
                  <a href={l.href} onClick={() => setOpen(false)}>
                    {l.label}
                  </a>
                </li>
              ),
            )}
          </ul>
          <p className="mt-6 font-mono text-[0.55rem] tracking-[0.3em] text-[var(--color-muted)]">
            {FEST.association} · {FEST.university}
          </p>
        </div>
      </header>
    </>
  );
}
