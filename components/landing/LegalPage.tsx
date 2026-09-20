import React from 'react';
import Link from 'next/link';
import { IconLock } from '../ui/icons';
import { SITE_NAME } from '../../lib/site';

/** The shared frame for the privacy policy and the terms: a server component, plain HTML. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--canvas-bg)] text-[var(--text-primary)] font-sans flex flex-col">
      <header className="border-b border-[var(--border-subtle)]">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-sm font-semibold" aria-label={`${SITE_NAME}, home`}>
            <span className="w-8 h-8 rounded-lg bg-[var(--surface-2)] border border-[var(--border-strong)] text-[var(--accent-text)] flex items-center justify-center">
              <IconLock className="w-4 h-4" />
            </span>
            {SITE_NAME}
          </Link>
          <Link href="/" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Home
          </Link>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 w-full max-w-3xl mx-auto px-5 py-12 focus:outline-none">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-xs text-[var(--text-muted)]">Last updated {updated}</p>
        <div className="mt-8 flex flex-col gap-8 text-sm leading-relaxed text-[var(--text-secondary)]">{children}</div>
      </main>

      <footer className="border-t border-[var(--border-subtle)]">
        <nav aria-label="Legal" className="max-w-3xl mx-auto px-5 py-6 flex items-center gap-5 text-xs text-[var(--text-muted)]">
          <Link href="/privacy" className="hover:text-[var(--text-primary)]">Privacy</Link>
          <Link href="/terms" className="hover:text-[var(--text-primary)]">Terms</Link>
        </nav>
      </footer>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
      {children}
    </section>
  );
}
