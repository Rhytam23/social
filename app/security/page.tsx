import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell, PageIntro } from '../../components/site/PageShell';
import { LIMITS, PROTECTIONS, SERVER_CANNOT_SEE, SERVER_CAN_SEE } from '../../components/site/content';

export const metadata: Metadata = {
  title: 'Security',
  description: 'How messages are encrypted, what the server can and cannot see, the known limits, and how to report a security problem.',
  alternates: { canonical: '/security' },
};

const list = 'list-disc pl-5 space-y-2 text-sm leading-relaxed text-[var(--text-secondary)]';
const section = 'border-t border-[var(--border-subtle)] py-10 grid lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] gap-6 lg:gap-16';

export default function SecurityPage() {
  return (
    <PageShell current="security">
      <PageIntro eyebrow="How it is protected" title="Built so the server does not have to be trusted.">
        Encryption happens in your browser, before anything is sent. This page says what that protects, what it does not, and how to tell us about a problem.
      </PageIntro>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 pb-20 flex flex-col">
        <section aria-labelledby="how" className={section}>
          <h2 id="how" className="text-xl font-semibold tracking-tight">How your messages are protected</h2>
          <ol className="divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
            {PROTECTIONS.map(([title, body], i) => (
              <li key={title} className="py-5 grid grid-cols-[2.5rem_1fr] gap-4">
                <span className="font-mono text-xs text-[var(--text-muted)] pt-1" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="text-base font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="server" className={section}>
          <h2 id="server" className="text-xl font-semibold tracking-tight">What the server can and cannot see</h2>
          <div className="grid sm:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-semibold">It can see</h3>
              <ul className={`mt-3 ${list}`}>{SERVER_CAN_SEE.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">It cannot see</h3>
              <ul className={`mt-3 ${list}`}>{SERVER_CANNOT_SEE.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
          </div>
        </section>

        <section aria-labelledby="limits" className={section}>
          <h2 id="limits" className="text-xl font-semibold tracking-tight">Known limits</h2>
          <ul className={list}>{LIMITS.map((t) => <li key={t}>{t}</li>)}</ul>
        </section>

        <section aria-labelledby="report" className={section}>
          <h2 id="report" className="text-xl font-semibold tracking-tight">Reporting a problem</h2>
          <div className="text-sm leading-relaxed text-[var(--text-secondary)] space-y-3 max-w-2xl">
            <p>
              If you find a security problem, please tell us privately through the <Link href="/contact" className="underline hover:text-[var(--text-primary)]">Contact page</Link> and give us a reasonable time to fix it before you tell anyone else. Good-faith reports made this way are welcome.
            </p>
            <p>
              Please test only on your own copy of the software, with your own accounts and data, and do not attack the service or other people&apos;s data. The <Link href="/terms" className="underline hover:text-[var(--text-primary)]">Terms</Link> and the licence say the same.
            </p>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
