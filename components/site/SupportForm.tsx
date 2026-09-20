'use client';

import React, { useState } from 'react';
import { SUPPORT_TOPICS, SUPPORT_TOPIC_LABEL, type SupportTopic } from '../../lib/support';
import { Button } from '../ui/button';

/**
 * The support form, used on the public Contact page and (without the email field) inside Settings.
 * It posts to /api/support. `website` is a honeypot: it is hidden from people and left empty.
 */
export function SupportForm({ askEmail = true, defaultTopic = 'question', onSent }: { askEmail?: boolean; defaultTopic?: SupportTopic; onSent?: () => void }) {
  const [topic, setTopic] = useState<SupportTopic>(defaultTopic);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === 'sending') return;
    setState('sending');
    setError(null);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ topic, name, email, message, website }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || 'Could not send your message. Please try again.');
        setState('idle');
        return;
      }
      setState('sent');
      onSent?.();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      setState('idle');
    }
  };

  if (state === 'sent') {
    return (
      <div role="status" className="panel text-sm text-[var(--text-primary)]">
        <p className="font-semibold">Message sent.</p>
        <p className="mt-1 text-[var(--text-secondary)]">Thank you. We will reply by email{askEmail ? ' to the address you gave' : ''} as soon as we can.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="support-topic" className="text-xs font-medium text-[var(--text-secondary)]">What is this about?</label>
        <select id="support-topic" className="field" value={topic} onChange={(e) => setTopic(e.target.value as SupportTopic)}>
          {SUPPORT_TOPICS.map((t) => (
            <option key={t} value={t}>{SUPPORT_TOPIC_LABEL[t]}</option>
          ))}
        </select>
      </div>

      {askEmail && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="support-name" className="text-xs font-medium text-[var(--text-secondary)]">Name (optional)</label>
            <input id="support-name" className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="support-email" className="text-xs font-medium text-[var(--text-secondary)]">Email we can reply to</label>
            <input id="support-email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} autoComplete="email" required />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="support-message" className="text-xs font-medium text-[var(--text-secondary)]">Message</label>
        <textarea id="support-message" className="field min-h-[9rem] resize-y" value={message} onChange={(e) => setMessage(e.target.value)} minLength={10} maxLength={2000} required />
        <p className="text-[11px] text-[var(--text-muted)]">
          Do not include passwords, your encryption key or the text of private messages. {message.length}/2000
        </p>
      </div>

      {/* Honeypot: people never see or fill this. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      {error && (
        <p role="alert" className="text-xs text-[var(--danger-neutral)]">{error}</p>
      )}

      <div>
        <Button type="submit" variant="primary" size="lg" loading={state === 'sending'} disabled={message.trim().length < 10 || (askEmail && email.trim().length < 3)}>
          Send message
        </Button>
      </div>
    </form>
  );
}
