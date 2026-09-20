import React from 'react';
import Link from 'next/link';
import { IconLock } from '../ui/icons';
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from '../../lib/site';

/**
 * The public home page. A server component: plain HTML, no client JavaScript, nothing invented.
 * Every statement here describes what the product does today (see docs/SECURITY.md for the details).
 * The buttons are links to /login and /signup, so they work before any script has loaded.
 */

const PRIMARY_LINK =
  'pressable inline-flex items-center justify-center h-11 px-5 rounded-lg text-sm font-semibold bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:bg-[var(--accent-primary-hover)]';
const SECONDARY_LINK =
  'pressable inline-flex items-center justify-center h-11 px-5 rounded-lg text-sm font-medium text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)]';

const PROTECTIONS: Array<[string, string]> = [
  ['Encrypted on your device', 'Direct messages use X25519 key exchange with XSalsa20-Poly1305 (libsodium). Attachments use AES-256-GCM. The plaintext never leaves your device.'],
  ['Keys that stay with you', 'Your private key lives in your browser. A backup protected by a passphrase (Argon2id) lets you restore your history on a new device, or link a second one.'],
  ['Groups that rotate keys', 'Each group and channel shares one key, sealed separately to every member. It changes when someone leaves, so they cannot read what comes next.'],
  ['What the server can see', 'Who is in a conversation, when messages are sent and how large they are. Not what they say. Search runs on your device, over messages already on it.'],
];

const FEATURES: Array<[string, string]> = [
  ['Direct messages', 'One-to-one chats with replies, reactions, read receipts and saved messages.'],
  ['Groups and roles', 'Owner, admin and member roles, admin-only posting, and keys that change when people leave.'],
  ['Threads', 'Reply in a thread without flooding the conversation.'],
  ['Communities', 'Public and private channels with invite links and roles.'],
  ['Calls', 'One-to-one voice and video, with encrypted signalling.'],
  ['Files and voice notes', 'Encrypted before they upload, up to 25 MB.'],
  ['Disappearing messages', 'Delete after 24 hours, 7 days or 90 days, per chat.'],
  ['Privacy controls', 'Block, report, PIN app lock, and switches for read receipts and typing.'],
  ['More than one device', 'Link a phone and a computer to the same account with your key backup.'],
];

const LIMITS = [
  'There is no forward secrecy yet: someone who obtains your key could read messages they also obtained.',
  'Your devices share one account key, which you link with your passphrase backup.',
  'Messages already on a device are readable by whoever holds and unlocks it.',
  'The software has not had an independent security audit.',
];

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
    <div id="landing" className="public-landing min-h-screen bg-[var(--canvas-bg)] text-[var(--text-primary)] font-sans">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />

      <header className="border-b border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto h-14 px-5 sm:px-8 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5" aria-label={`${SITE_NAME}, home`}>
            <span className="w-8 h-8 rounded-lg bg-[var(--surface-2)] border border-[var(--border-strong)] text-[var(--accent-text)] flex items-center justify-center">
              <IconLock className="w-4 h-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight">{SITE_NAME}</span>
          </Link>
          <nav aria-label="Page" className="hidden md:flex items-center gap-7 text-[13px] text-[var(--text-secondary)]">
            <a href="#security" className="hover:text-[var(--text-primary)]">Security</a>
            <a href="#features" className="hover:text-[var(--text-primary)]">Features</a>
            <Link href="/privacy" className="hover:text-[var(--text-primary)]">Privacy</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden sm:inline-flex items-center h-8 px-3 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]">
              Sign in
            </Link>
            <Link href="/signup" className="inline-flex items-center h-8 px-3 rounded-lg text-xs font-semibold bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:bg-[var(--accent-primary-hover)]">
              Create account
            </Link>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="focus:outline-none">
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 md:pt-24 pb-16 md:pb-24">
          <p className="eyebrow !text-[var(--accent-text)]">End-to-end encrypted messaging</p>
          <h1 className="mt-4 max-w-3xl text-[clamp(2.25rem,5.4vw,4rem)] font-semibold tracking-[-0.03em] leading-[1.05]">
            Conversations that stay yours.
          </h1>
          <p className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-[var(--text-secondary)]">
            {SITE_NAME} encrypts every message on your device before it leaves. The server only ever holds ciphertext, so what you say stays between you and the people you say it to.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/signup" className={PRIMARY_LINK}>Create account</Link>
            <Link href="/login" className={SECONDARY_LINK}>Sign in</Link>
          </div>
        </section>

        <section id="security" aria-labelledby="security-title" className="border-t border-[var(--border-subtle)]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 md:py-24 grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 lg:gap-20">
            <div>
              <p className="eyebrow">How it is protected</p>
              <h2 id="security-title" className="mt-4 text-[clamp(1.75rem,3.4vw,2.5rem)] font-semibold tracking-[-0.025em] leading-[1.1]">
                Built so the server does not have to be trusted.
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[var(--text-secondary)]">
                Encryption happens in your browser, before anything is sent. The limits are listed below because you should know them.
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

        <section id="features" aria-labelledby="features-title" className="border-t border-[var(--border-subtle)]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 md:py-24 grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 lg:gap-20">
            <div>
              <p className="eyebrow">What is in it</p>
              <h2 id="features-title" className="mt-4 text-[clamp(1.75rem,3.4vw,2.5rem)] font-semibold tracking-[-0.025em] leading-[1.1]">
                Messaging, without the extras.
              </h2>
            </div>
            <dl className="divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
              {FEATURES.map(([name, text]) => (
                <div key={name} className="py-4 grid sm:grid-cols-[12rem_1fr] gap-1 sm:gap-6">
                  <dt className="text-sm font-semibold">{name}</dt>
                  <dd className="text-sm leading-relaxed text-[var(--text-secondary)]">{text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section aria-labelledby="limits-title" className="border-t border-[var(--border-subtle)]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 md:py-24 grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 lg:gap-20">
            <h2 id="limits-title" className="text-[clamp(1.5rem,2.8vw,2rem)] font-semibold tracking-[-0.02em] leading-[1.15]">
              Known limits
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              {LIMITS.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-[var(--border-subtle)]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 md:py-24 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <h2 className="text-[clamp(1.75rem,3.4vw,2.5rem)] font-semibold tracking-[-0.025em] leading-[1.1] max-w-xl">Start with an account.</h2>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/signup" className={PRIMARY_LINK}>Create account</Link>
              <Link href="/login" className={SECONDARY_LINK}>Sign in</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[12px] text-[var(--text-muted)]">
          <p>{SITE_NAME}</p>
          <nav aria-label="Legal" className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-[var(--text-primary)]">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--text-primary)]">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
