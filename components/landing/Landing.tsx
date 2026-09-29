import React from 'react';
import Link from 'next/link';
import { PageShell } from '../site/PageShell';
import { FEATURE_GROUPS, LIMITS, PROTECTIONS } from '../site/content';
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from '../../lib/site';
import { RevealObserver } from './RevealObserver';
import { HeroVisual } from './HeroVisual';

/**
 * The public home page. A server component: plain HTML, nothing invented. Every statement describes what
 * the product does today (see docs/SECURITY.md). The buttons are links to /login and /signup, so they work
 * before any script has loaded. Motion is progressive enhancement: scroll reveal (RevealObserver), and on
 * computers a 3D scene (HeroVisual); without JavaScript, on phones or with reduced motion the page is plain.
 */

const PRIMARY_LINK =
  'pressable inline-flex items-center justify-center h-11 px-5 rounded-lg text-sm font-semibold bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:bg-[var(--accent-primary-hover)]';
const SECONDARY_LINK =
  'pressable inline-flex items-center justify-center h-11 px-5 rounded-lg text-sm font-medium text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)]';

/** The first item of each feature group: a short overview that links to the full list. */
const HIGHLIGHTS = FEATURE_GROUPS.flatMap((g) => g.items.slice(0, 2)).slice(0, 8);

export function Landing() {
  const home = absoluteUrl('/');
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    applicationCategory: 'CommunicationApplication',
    operatingSystem: 'Any modern web browser',
    ...(home ? { url: home } : {}),
  };

  return (
    <div id="landing" className="public-landing">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <RevealObserver />
      <PageShell current="home">
        <section className="relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 md:pt-24 pb-16 md:pb-28 grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-10 items-center">
            <div>
              <p className="hero-in eyebrow !text-[var(--accent-text)]" style={{ '--i': 0 } as React.CSSProperties}>End-to-end encrypted messaging</p>
              <h1 className="hero-in mt-4 max-w-3xl text-[clamp(2.25rem,5.4vw,4rem)] font-semibold tracking-[-0.03em] leading-[1.05]" style={{ '--i': 1 } as React.CSSProperties}>
                Conversations that stay yours.
              </h1>
              <p className="hero-in mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-[var(--text-secondary)]" style={{ '--i': 2 } as React.CSSProperties}>
                {SITE_NAME} encrypts every message on your device before it leaves. The server only ever holds ciphertext, so what you say stays between you and the people you say it to.
              </p>
              <div className="hero-in mt-8 flex flex-wrap items-center gap-3" style={{ '--i': 3 } as React.CSSProperties}>
                <Link href="/signup" className={PRIMARY_LINK}>Create account</Link>
                <Link href="/login" className={SECONDARY_LINK}>Sign in</Link>
              </div>
            </div>
            <HeroVisual />
          </div>
        </section>

        <section aria-labelledby="security-title" className="reveal border-t border-[var(--border-subtle)]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 md:py-24 grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 lg:gap-20">
            <div>
              <p className="eyebrow">How it is protected</p>
              <h2 id="security-title" className="mt-4 text-[clamp(1.75rem,3.4vw,2.5rem)] font-semibold tracking-[-0.025em] leading-[1.1]">
                Built so the server does not have to be trusted.
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[var(--text-secondary)]">
                Encryption happens in your browser, before anything is sent. <Link href="/security" className="underline hover:text-[var(--text-primary)]">Read the details</Link>.
              </p>
            </div>
            <ol className="divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
              {PROTECTIONS.map(([title, body], i) => (
                <li key={title} className="py-6 grid grid-cols-[2.5rem_1fr] gap-4">
                  <span className="font-mono text-xs text-[var(--text-muted)] pt-1" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="text-base font-semibold">{title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="features-title" className="reveal border-t border-[var(--border-subtle)]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 md:py-24 grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 lg:gap-20">
            <div>
              <p className="eyebrow">What is in it</p>
              <h2 id="features-title" className="mt-4 text-[clamp(1.75rem,3.4vw,2.5rem)] font-semibold tracking-[-0.025em] leading-[1.1]">
                Messaging, without the extras.
              </h2>
              <p className="mt-5 text-[15px]">
                <Link href="/features" className="underline text-[var(--text-secondary)] hover:text-[var(--text-primary)]">See every feature</Link>
              </p>
            </div>
            <dl className="divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
              {HIGHLIGHTS.map(([name, text]) => (
                <div key={name} className="py-4 grid sm:grid-cols-[12rem_1fr] gap-1 sm:gap-6">
                  <dt className="text-sm font-semibold">{name}</dt>
                  <dd className="text-sm leading-relaxed text-[var(--text-secondary)]">{text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section aria-labelledby="limits-title" className="reveal border-t border-[var(--border-subtle)]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 md:py-24 grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 lg:gap-20">
            <h2 id="limits-title" className="text-[clamp(1.5rem,2.8vw,2rem)] font-semibold tracking-[-0.02em] leading-[1.15]">
              Known limits
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              {LIMITS.slice(0, 4).map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="reveal border-t border-[var(--border-subtle)]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 md:py-24 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <h2 className="text-[clamp(1.75rem,3.4vw,2.5rem)] font-semibold tracking-[-0.025em] leading-[1.1] max-w-xl">Start with an account.</h2>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/signup" className={PRIMARY_LINK}>Create account</Link>
              <Link href="/login" className={SECONDARY_LINK}>Sign in</Link>
            </div>
          </div>
        </section>
      </PageShell>
    </div>
  );
}
