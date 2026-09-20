import React from 'react';
import { PageShell } from '../site/PageShell';

/** The shared frame for the privacy policy and the terms: a server component, plain HTML. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <PageShell current="legal">
      <div className="w-full max-w-3xl mx-auto px-5 py-12 md:py-16">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-xs text-[var(--text-muted)]">Last updated {updated}</p>
        <div className="mt-8 flex flex-col gap-8 text-sm leading-relaxed text-[var(--text-secondary)]">{children}</div>
      </div>
    </PageShell>
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
