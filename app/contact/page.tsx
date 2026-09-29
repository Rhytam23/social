import type { Metadata } from 'next';
import { PageShell, PageIntro } from '../../components/site/PageShell';
import { SupportForm } from '../../components/site/SupportForm';
import { CONTACT_EMAIL } from '../../lib/site';
import { isSupportTopic } from '../../lib/support';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Send a question, report a problem or ask about your account or data.',
  alternates: { canonical: '/contact' },
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;
  return (
    <PageShell current="contact">
      <PageIntro eyebrow="Contact" title="Tell us what you need.">
        We read every message and reply by email.
      </PageIntro>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pb-20 grid lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] gap-12 lg:gap-20 border-t border-[var(--border-subtle)] pt-10">
        <SupportForm defaultTopic={isSupportTopic(topic) ? topic : 'question'} />
        <aside aria-label="Other ways to reach us" className="text-sm leading-relaxed text-[var(--text-secondary)] space-y-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Prefer email?</h2>
          <p>
            Write to <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-[var(--text-primary)] break-all">{CONTACT_EMAIL}</a>.
          </p>
          <p>Please do not send passwords, your encryption key or the text of private messages. We will never ask for them.</p>
        </aside>
      </div>
    </PageShell>
  );
}
