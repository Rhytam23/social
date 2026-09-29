import type { Metadata } from 'next';
import { PageShell, PageIntro } from '../../components/site/PageShell';
import { FEATURE_GROUPS } from '../../components/site/content';

export const metadata: Metadata = {
  title: 'Features',
  description: 'Direct messages, groups, communities, calls, files and disappearing messages, all end-to-end encrypted.',
  alternates: { canonical: '/features' },
};

export default function FeaturesPage() {
  return (
    <PageShell current="features">
      <PageIntro eyebrow="What is in it" title="Messaging, without the extras.">
        Everything here is end-to-end encrypted. This is the full list of what the app does today.
      </PageIntro>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pb-20 flex flex-col">
        {FEATURE_GROUPS.map((group) => (
          <section key={group.title} aria-labelledby={`f-${group.title}`} className="border-t border-[var(--border-subtle)] py-10 grid lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] gap-6 lg:gap-16">
            <h2 id={`f-${group.title}`} className="text-xl font-semibold tracking-tight">{group.title}</h2>
            <dl className="divide-y divide-[var(--border-subtle)]">
              {group.items.map(([name, text]) => (
                <div key={name} className="py-4 first:pt-0 grid sm:grid-cols-[13rem_1fr] gap-1 sm:gap-6">
                  <dt className="text-sm font-semibold">{name}</dt>
                  <dd className="text-sm leading-relaxed text-[var(--text-secondary)]">{text}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
