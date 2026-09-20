import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '../components/site/PageShell';

export const metadata: Metadata = { title: 'Page not found', robots: { index: false, follow: false } };

export default function NotFound() {
  return (
    <PageShell>
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-24">
        <p className="eyebrow !text-[var(--accent-text)]">404</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">This page does not exist.</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--text-secondary)]">The address may be wrong, or the page may have moved.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="pressable inline-flex items-center h-11 px-5 rounded-lg text-sm font-semibold bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:bg-[var(--accent-primary-hover)]">Go to the home page</Link>
          <Link href="/help" className="pressable inline-flex items-center h-11 px-5 rounded-lg text-sm font-medium text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--surface-2)]">Help</Link>
        </div>
      </section>
    </PageShell>
  );
}
