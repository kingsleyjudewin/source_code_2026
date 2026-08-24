'use client';

import { useEffect, useRef } from 'react';
import { initGsap } from '@/lib/gsap';
import { scrollStore } from '@/lib/scroll';
import { TEAM, TEAM_GROUPS, PLACEHOLDER_SLOTS, type TeamMember } from '@/data/team';

/**
 * SECTION 8 — Avengers Initiative.
 *
 * Roster is grouped into faculty and event coordinators. Every card keeps the
 * `data-member` hook so the existing scroll-in stagger covers both groups in one
 * sweep; a category with no members still renders its placeholder grid.
 */

function initials(name: string) {
  return name
    .replace(/^(Dr|Prof|Mr|Ms|Mrs)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

function MemberCard({ member }: { member: TeamMember }) {
  return (
    <article data-member className="member-card group">
      {/* Circular portrait — same glass, rim and scan treatment as before. */}
      <div className="member-orb glass glass-rim">
        {member.image ? (
          <img src={member.image} alt="" aria-hidden="true" loading="lazy" decoding="async" />
        ) : (
          <span className="member-monogram">{initials(member.name)}</span>
        )}
        <span className="member-scan" aria-hidden="true" />
      </div>

      <h4 className="member-name">{member.name}</h4>
      <p className="member-role">{member.designation}</p>

      {member.phone && (
        <a className="member-phone" href={`tel:${member.phone}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6.2 3.5h3l1.5 3.8-1.9 1.4a12 12 0 0 0 5.5 5.5l1.4-1.9 3.8 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.2 5.7a2 2 0 0 1 2-2.2Z" />
          </svg>
          <span>{member.phone}</span>
        </a>
      )}

      {member.linkedin && (
        <a
          href={member.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="member-link"
          aria-label={`${member.name} on LinkedIn`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.65h.05a4.17 4.17 0 0 1 3.75-2.05c4 0 4.75 2.63 4.75 6.05V21h-4v-5.4c0-1.29-.03-2.95-1.8-2.95s-2.07 1.4-2.07 2.86V21h-4V9Z" />
          </svg>
          <span>LinkedIn</span>
        </a>
      )}
    </article>
  );
}

function PlaceholderCard({ index }: { index: number }) {
  return (
    <article data-member className="member-card member-card--empty" aria-hidden="true">
      <div className="member-orb glass">
        <span className="member-monogram opacity-30">?</span>
        <span className="member-scan" />
      </div>
      <h4 className="member-name text-[var(--color-muted)]">Classified</h4>
      <p className="member-role">{String(index + 1).padStart(2, '0')} — TBA</p>
    </article>
  );
}

export default function Team() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const { gsap } = initGsap();

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-member]',
        { opacity: 0, y: 60, rotateX: -18 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 1,
          stagger: { each: 0.07, from: 'start' },
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 72%', once: true },
        },
      );

      gsap.fromTo(
        '[data-team-heading]',
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          scrollTrigger: { trigger: el, start: 'top 80%', once: true },
        },
      );

      gsap.fromTo(
        '[data-group-heading]',
        { opacity: 0, y: 26 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.12,
          scrollTrigger: { trigger: el, start: 'top 74%', once: true },
        },
      );

      // No pin here — a card grid wants to be scannable, not scrubbed.
      gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top 60%',
          end: 'bottom 40%',
          scrub: true,
          onUpdate: (self) => scrollStore.set({ scene: 'team', sceneProgress: self.progress }),
          onEnter: () => scrollStore.set({ scene: 'team' }),
          onEnterBack: () => scrollStore.set({ scene: 'team' }),
        },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      id="team"
      className="relative py-28 sm:py-36"
      style={{ ['--section-accent' as string]: 'var(--color-arc)' }}
      aria-labelledby="team-title"
    >
      <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:px-16">
        <div data-team-heading className="mb-16 text-center">
          <p className="eyebrow mb-4">Avengers Initiative</p>
          <h2 id="team-title" className="display text-metal text-[clamp(1.9rem,5.5vw,4rem)]">
            The Organising Team
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm text-[var(--color-silver)]/70">
            The people assembling Source Code 2026.
          </p>
        </div>

        {TEAM_GROUPS.map((group) => {
          const members = TEAM.filter((m) => m.category === group.id).sort(
            (a, b) => (a.order ?? 99) - (b.order ?? 99),
          );

          return (
            <div key={group.id} className="team-group">
              <div data-group-heading className="team-group-heading">
                <span className="team-group-rule" aria-hidden="true" />
                <h3>{group.title}</h3>
                <span className="team-group-rule" aria-hidden="true" />
              </div>

              <div className="team-grid">
                {members.length
                  ? members.map((m) => <MemberCard key={m.name} member={m} />)
                  : Array.from({ length: PLACEHOLDER_SLOTS }).map((_, i) => (
                      <PlaceholderCard key={i} index={i} />
                    ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
