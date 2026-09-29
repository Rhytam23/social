import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell, PageIntro } from '../../components/site/PageShell';
import { FAQ } from '../../components/site/content';

export const metadata: Metadata = {
  title: 'Help',
  description: 'Answers about keys and backups, linking a device, files, calls, safety and your data.',
  alternates: { canonical: '/help' },
};

export default function HelpPage() {
  return (
    <PageShell current="help">
      <PageIntro eyebrow="Help" title="Answers to common questions.">
        Cannot find what you need? <Link href="/contact" className="underline hover:text-[var(--text-primary)]">Send us a message</Link>.
      </PageIntro>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pb-20 flex flex-col">
        {FAQ.map((group) => (
          <section key={group.topic} aria-labelledby={`h-${group.topic}`} className="border-t border-[var(--border-subtle)] py-10 grid lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] gap-6 lg:gap-16">
            <h2 id={`h-${group.topic}`} className="text-xl font-semibold tracking-tight">{group.topic}</h2>
            <div className="divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
              {group.items.map((item) => (
                <details key={item.q} className="group py-4">
                  <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-start justify-between gap-4 text-sm font-medium text-[var(--text-primary)]">
                    {item.q}
                    <span aria-hidden="true" className="mt-0.5 text-[var(--text-muted)] transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
