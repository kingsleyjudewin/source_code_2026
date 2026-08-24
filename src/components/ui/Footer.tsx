import { FEST, isTBA } from '@/data/events';

export default function Footer() {
  return (
    <footer
      id="contact"
      className="relative z-10 border-t border-[color-mix(in_oklab,var(--color-holo)_8%,transparent)] px-5 py-14 sm:px-8 lg:px-16"
      style={{ ['--section-accent' as string]: 'var(--color-arc)' }}
    >
      <div className="mx-auto flex max-w-[1500px] flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="display text-metal text-2xl">Source Code 2026</p>
          <p className="mt-3 max-w-sm text-xs leading-relaxed text-[var(--color-muted)]">
            {FEST.department}
            <br />
            {FEST.university} · {FEST.association}
          </p>
        </div>

        <div id="follow" className="flex flex-col gap-2 text-xs text-[var(--color-muted)]">
          <p className="font-mono text-[0.55rem] uppercase tracking-[0.3em] text-[var(--color-arc)]">
            Get in touch
          </p>
          {isTBA(FEST.contactEmail) ? (
            <p className="italic opacity-70">Contact details to be announced</p>
          ) : (
            <a href={`mailto:${FEST.contactEmail}`} className="hover:text-[var(--color-holo)]">
              {FEST.contactEmail}
            </a>
          )}
          {isTBA(FEST.instagram) ? (
            <p className="italic opacity-70">Social links to be announced</p>
          ) : (
            <a
              href={FEST.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--color-holo)]"
            >
              Instagram
            </a>
          )}
        </div>
      </div>

      <p className="mx-auto mt-10 max-w-[1500px] font-mono text-[0.55rem] tracking-[0.2em] text-[var(--color-muted)]/60">
        © {FEST.year} {FEST.association} · {FEST.university}
      </p>
    </footer>
  );
}
