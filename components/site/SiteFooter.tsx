import React from 'react';
import Link from 'next/link';
import { Logo } from '../brand/Logo';
import { LICENSE_URL, SITE_NAME } from '../../lib/site';

const COLUMNS: Array<{ title: string; links: Array<{ label: string; href: string; external?: boolean }> }> = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Security', href: '/security' },
      { label: 'Create account', href: '/signup' },
      { label: 'Sign in', href: '/login' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help', href: '/help' },
      { label: 'Contact', href: '/contact' },
      { label: 'Report a problem', href: '/contact?topic=problem' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Licence', href: LICENSE_URL, external: true },
    ],
  },
];

/**
 * The footer of the public pages. There is no footer inside the signed-in app: once someone is in, the
 * screen is the chat and what it needs.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--canvas-bg)]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 grid gap-10 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
        <div>
          <Link href="/" aria-label={`${SITE_NAME}, home`}>
            <Logo />
          </Link>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-[var(--text-muted)]">End-to-end encrypted messaging. The server only ever holds ciphertext.</p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="eyebrow">{col.title}</p>
            <ul className="mt-3 flex flex-col gap-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.external ? (
                    <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                      {l.label}
                    </a>
                  ) : (
                    <Link href={l.href} className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-[var(--border-subtle)]">
        <p className="max-w-6xl mx-auto px-5 sm:px-8 py-5 text-[11px] text-[var(--text-muted)]">
          &copy; 2026 {SITE_NAME}. Source available under a non-commercial learning licence.
        </p>
      </div>
    </footer>
  );
}
