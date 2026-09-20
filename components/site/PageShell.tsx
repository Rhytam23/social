import React from 'react';
import { SiteHeader, type SiteSection } from './SiteHeader';
import { SiteFooter } from './SiteFooter';

/** Header, main content and footer for every public page. */
export function PageShell({ current, children }: { current?: SiteSection; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--canvas-bg)] text-[var(--text-primary)] font-sans">
      <SiteHeader current={current} />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

/** A page heading block used at the top of the inner public pages. */
export function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-14 md:pt-20 pb-10 md:pb-14">
      <p className="eyebrow !text-[var(--accent-text)]">{eyebrow}</p>
      <h1 className="mt-4 max-w-3xl text-[clamp(2rem,4.6vw,3.25rem)] font-semibold tracking-[-0.03em] leading-[1.07]">{title}</h1>
      {children && <div className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)]">{children}</div>}
    </section>
  );
}
