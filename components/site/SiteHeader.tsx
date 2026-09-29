import React from 'react';
import Link from 'next/link';
import { Logo } from '../brand/Logo';
import { SITE_NAME } from '../../lib/site';

export type SiteSection = 'home' | 'features' | 'security' | 'help' | 'contact' | 'legal';

const TABS: Array<{ id: SiteSection; label: string; href: string }> = [
  { id: 'features', label: 'Features', href: '/features' },
  { id: 'security', label: 'Security', href: '/security' },
  { id: 'help', label: 'Help', href: '/help' },
  { id: 'contact', label: 'Contact', href: '/contact' },
];

const link = 'inline-flex items-center min-h-11 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]';

/**
 * The header of the public pages (home, features, security, help, contact, privacy, terms). A server
 * component: the mobile menu is a plain disclosure element, so it works without JavaScript. It is never
 * shown inside the signed-in app.
 */
export function SiteHeader({ current }: { current?: SiteSection }) {
  return (
    <header className="border-b border-[var(--border-subtle)] bg-[var(--canvas-bg)]">
      <div className="max-w-6xl mx-auto h-14 px-5 sm:px-8 flex items-center justify-between gap-4">
        <Link href="/" aria-label={`${SITE_NAME}, home`} aria-current={current === 'home' ? 'page' : undefined} className="inline-flex items-center min-h-11">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden md:flex items-center gap-7">
          {TABS.map((t) => (
            <Link key={t.id} href={t.href} aria-current={current === t.id ? 'page' : undefined} className={`${link} ${current === t.id ? '!text-[var(--text-primary)] font-medium' : ''}`}>
              {t.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden sm:inline-flex items-center h-8 [@media(pointer:coarse)]:h-11 px-3 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]">
            Sign in
          </Link>
          <Link href="/signup" className="inline-flex items-center h-8 [@media(pointer:coarse)]:h-11 px-3 rounded-lg text-xs font-semibold bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:bg-[var(--accent-primary-hover)]">
            Create account
          </Link>

          <details className="md:hidden relative">
            <summary aria-label="Menu" className="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-8 h-8 [@media(pointer:coarse)]:w-11 [@media(pointer:coarse)]:h-11 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-2)]">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </summary>
            <nav aria-label="Menu" className="absolute right-0 top-10 z-50 w-48 p-1.5 floating flex flex-col">
              {TABS.map((t) => (
                <Link key={t.id} href={t.href} aria-current={current === t.id ? 'page' : undefined} className="px-3 py-2 rounded-lg text-sm text-[var(--text-primary)] hover:bg-[var(--surface-2)]">
                  {t.label}
                </Link>
              ))}
              <Link href="/login" className="px-3 py-2 rounded-lg text-sm text-[var(--text-primary)] hover:bg-[var(--surface-2)]">
                Sign in
              </Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
