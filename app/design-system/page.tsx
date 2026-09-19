'use client';

import React, { useState } from 'react';
import { notFound } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Dialog } from '../../components/ui/dialog';
import { Avatar } from '../../components/ui/avatar';
import {
  Badge,
  CountBadge,
  ConversationListSkeleton,
  EmptyState,
  ErrorState,
  Kbd,
  SettingRow,
  Switch,
  TypingDots,
} from '../../components/ui/primitives';
import { toast } from '../../lib/ui/toastStore';
import { useTheme, type ThemePreference } from '../../lib/ui/theme';

/** Living style guide. Development only: production builds return 404. */
export default function DesignSystemPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  const [theme, setTheme] = useTheme();
  const [on, setOn] = useState(true);
  const [open, setOpen] = useState(false);

  return (
    <main id="main" tabIndex={-1} className="max-w-3xl mx-auto p-6 flex flex-col gap-10 font-sans">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">Design system</h1>
        <div role="group" aria-label="Theme" className="flex gap-1">
          {(['dark', 'light', 'system'] as ThemePreference[]).map((t) => (
            <Button key={t} size="sm" variant={theme === t ? 'primary' : 'tertiary'} onClick={() => setTheme(t)}>
              {t}
            </Button>
          ))}
        </div>
      </header>

      <section aria-labelledby="ds-buttons" className="flex flex-col gap-3">
        <h2 id="ds-buttons" className="text-sm font-semibold text-[var(--text-secondary)]">Buttons</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary">Primary</Button>
          <Button>Secondary</Button>
          <Button variant="tertiary">Tertiary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" loading>Saving</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <section aria-labelledby="ds-avatars" className="flex flex-col gap-3">
        <h2 id="ds-avatars" className="text-sm font-semibold text-[var(--text-secondary)]">Avatars and presence</h2>
        <div className="flex items-center gap-4">
          <Avatar name="Ada Lovelace" size="lg" presence="online" />
          <Avatar name="Grace Hopper" size="lg" presence="away" />
          <Avatar name="Linus T" size="lg" presence="dnd" />
          <Avatar name="Offline User" size="lg" presence="offline" />
          <Avatar name="Small" size="xs" />
        </div>
      </section>

      <section aria-labelledby="ds-badges" className="flex flex-col gap-3">
        <h2 id="ds-badges" className="text-sm font-semibold text-[var(--text-secondary)]">Badges, counts, keys, typing</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge>Neutral</Badge>
          <Badge tone="accent">Verified</Badge>
          <Badge tone="warning">Away</Badge>
          <Badge tone="danger">Muted</Badge>
          <CountBadge count={3} />
          <CountBadge count={120} mention />
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
          <TypingDots />
        </div>
      </section>

      <section aria-labelledby="ds-forms" className="flex flex-col gap-1">
        <h2 id="ds-forms" className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Settings rows</h2>
        <SettingRow title="Read receipts" description="Let people see when you have read their messages.">
          <Switch checked={on} onChange={setOn} label="Read receipts" />
        </SettingRow>
      </section>

      <section aria-labelledby="ds-feedback" className="flex flex-col gap-3">
        <h2 id="ds-feedback" className="text-sm font-semibold text-[var(--text-secondary)]">Feedback</h2>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => toast('Saved', { kind: 'success' })}>Success toast</Button>
          <Button onClick={() => toast('Could not send', { kind: 'error' })}>Error toast</Button>
          <Button onClick={() => setOpen(true)}>Open dialog</Button>
        </div>
        <Dialog isOpen={open} onClose={() => setOpen(false)} title="Example dialog" footerAction={<Button variant="primary" size="sm" onClick={() => setOpen(false)}>Done</Button>}>
          Focus stays inside, Escape closes, and focus returns to the button.
        </Dialog>
      </section>

      <section aria-labelledby="ds-states" className="grid gap-4 sm:grid-cols-3">
        <h2 id="ds-states" className="sr-only">States</h2>
        <div className="border border-[var(--border-subtle)] rounded-2xl"><ConversationListSkeleton /></div>
        <div className="border border-[var(--border-subtle)] rounded-2xl flex"><EmptyState title="No chats yet" description="Start one to begin." actionLabel="New chat" onAction={() => toast('New chat')} /></div>
        <div className="border border-[var(--border-subtle)] rounded-2xl"><ErrorState message="Network request failed." onRetry={() => toast('Retrying')} /></div>
      </section>
    </main>
  );
}
