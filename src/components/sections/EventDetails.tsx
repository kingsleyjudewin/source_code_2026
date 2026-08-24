'use client';

import { useState } from 'react';
import { isTBA, type SourceEvent } from '@/data/events';
import RegisterButton from '@/components/ui/RegisterButton';

/* -- icons ------------------------------------------------------------------
   Inline so the panel carries no icon-font or library weight.               */
const ico = {
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
};

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" {...ico} aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" {...ico} aria-hidden="true">
      <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" {...ico} aria-hidden="true">
      <circle cx="9" cy="8" r="3.4" />
      <path d="M2.8 20a6.2 6.2 0 0 1 12.4 0M16.5 5.3a3.4 3.4 0 0 1 0 6.4M18 20a6 6 0 0 0-3-5.2" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" {...ico} aria-hidden="true">
      <path d="M6.2 3.5h3l1.5 3.8-1.9 1.4a12 12 0 0 0 5.5 5.5l1.4-1.9 3.8 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.2 5.7a2 2 0 0 1 2-2.2Z" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" {...ico} aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** One row of the information card. */
function InfoRow({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note?: string;
}) {
  const tba = isTBA(value);
  return (
    <div className="info-row">
      <span className="info-icon">{icon}</span>
      <span className="info-body">
        <span className="info-label">{label}</span>
        <span className={tba ? 'info-value info-value--tba' : 'info-value'}>
          {tba ? 'To be announced' : value}
        </span>
        {note && !tba && <span className="info-note">{note}</span>}
      </span>
    </div>
  );
}

export default function EventDetails({ event }: { event: SourceEvent }) {
  const { coordinators, rounds } = event;
  // Collapsed on narrow screens so long coordinator lists can never push the
  // card past the panel; always expanded from `sm` up (see CSS).
  const [open, setOpen] = useState(false);

  return (
    <div className="glass glass-rim relative rounded-3xl p-6 sm:p-7 lg:p-8" data-reveal="panel">
      {/* Category chip */}
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_oklab,var(--section-accent)_35%,transparent)] bg-[color-mix(in_oklab,var(--section-accent)_10%,transparent)] px-3.5 py-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--section-accent)] opacity-70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--section-accent)]" />
        </span>
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-[var(--section-accent)]">
          {event.category}
        </span>
      </div>

      {/* 1 — Event name */}
      <h3 className="display text-glow text-4xl leading-[0.95] sm:text-5xl">
        <span className="text-metal">{event.name}</span>
      </h3>

      {/* 2 — Tagline */}
      <p className="mt-3 font-mono text-sm tracking-wide text-[var(--section-accent)] text-glow sm:text-base">
        {event.tagline}
      </p>

      {/* 3 — Short description */}
      <p className="mt-4 max-w-prose text-[0.95rem] leading-relaxed text-[var(--color-silver)]/85">
        {event.description}
      </p>

      <div className="relative my-5 h-px w-full overflow-hidden bg-[color-mix(in_oklab,var(--color-holo)_10%,transparent)]">
        <span className="divider-pulse" />
      </div>

      {/* 4 — Information card */}
      <div className="info-card">
        <InfoRow icon={<CalendarIcon />} label="Date" value={event.date} />
        <InfoRow
          icon={<LocationIcon />}
          label="Venue"
          value={event.venue}
          note={event.venueNote}
        />
        <InfoRow icon={<UsersIcon />} label="Team Size" value={event.teamSize} />

        {/* Coordinators — expandable on mobile, always open from sm up. */}
        <div className={`info-row info-coords ${open ? 'is-open' : ''}`}>
          <span className="info-icon">
            <PhoneIcon />
          </span>
          <span className="info-body">
            <button
              type="button"
              className="coord-toggle"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="info-label">Coordinators</span>
              {coordinators.length > 0 && (
                <span className="coord-chevron">
                  <ChevronIcon />
                </span>
              )}
            </button>

            {coordinators.length === 0 ? (
              <span className="info-value info-value--tba">To be announced</span>
            ) : (
              <span className="coord-list">
                {coordinators.map((c) => (
                  <span key={c.name} className="coord">
                    <span className="coord-name">{c.name}</span>
                    {c.phone && (
                      <a className="coord-phone" href={`tel:${c.phone}`}>
                        {c.phone}
                      </a>
                    )}
                  </span>
                ))}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* 5 — Stage breakdown */}
      {rounds.length > 0 && (
        <ol className="round-list">
          {rounds.map((r) => (
            <li key={r.label + r.title} className="round">
              <span className="round-label">{r.label}</span>
              <span className="round-body">
                <span className="round-title">{r.title}</span>
                {r.detail && <span className="round-detail">{r.detail}</span>}
              </span>
            </li>
          ))}
        </ol>
      )}

      {event.closingLine && (
        <div className="closing-block">
          <p className="closing-line">{event.closingLine}</p>
          {event.closingSub && <p className="closing-sub">{event.closingSub}</p>}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-start gap-4">
        <RegisterButton />
        <a href="#brand-new-circuit" className="btn-ghost">
          All Events
        </a>
      </div>
    </div>
  );
}
