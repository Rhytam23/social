'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { createClient } from '../../lib/supabase/client';
import { saveOwnProfile, validateUsername } from '../../lib/profile/profileClient';
import { userError } from '../../lib/ui/errors';

export interface UsernameStepProps {
  userId: string;
  /** The generated name the account has now (shown as the starting suggestion). */
  suggested?: string;
  onDone: (username: string) => void;
}

type Check = { state: 'idle' } | { state: 'checking' } | { state: 'ok' } | { state: 'bad'; message: string; suggestions: string[] };

const inputClass =
  'w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] p-2.5 pl-7 rounded-xl text-[var(--text-primary)] text-sm focus:outline-none focus:border-emerald-500/60 transition-all';

/**
 * Shown once after sign-in until the person has picked a username (like Instagram). It cannot be dismissed:
 * a username is how other people find them. Availability is checked live; the database enforces uniqueness
 * regardless of case (migration 030), so a race between two people picking the same name is still safe.
 */
export const UsernameStep: React.FC<UsernameStepProps> = ({ userId, suggested, onDone }) => {
  const [value, setValue] = useState(suggested && !/^user_[0-9a-f]{6}$/.test(suggested) ? suggested : '');
  const [check, setCheck] = useState<Check>({ state: 'idle' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0);

  const name = value.trim().replace(/^@/, '').toLowerCase();

  useEffect(() => {
    if (!name) {
      setCheck({ state: 'idle' });
      return;
    }
    const formatError = validateUsername(name);
    if (formatError) {
      setCheck({ state: 'bad', message: formatError, suggestions: [] });
      return;
    }
    setCheck({ state: 'checking' });
    const ticket = ++latest.current;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/username-available?u=${encodeURIComponent(name)}`, { cache: 'no-store' });
        if (ticket !== latest.current) return;
        if (res.status === 429) {
          setCheck({ state: 'bad', message: 'Too many checks. Wait a moment and try again.', suggestions: [] });
          return;
        }
        if (!res.ok) {
          // The check is only a convenience: the database has the final say when saving.
          setCheck({ state: 'idle' });
          return;
        }
        const body = (await res.json()) as { available: boolean; suggestions?: string[] };
        setCheck(body.available ? { state: 'ok' } : { state: 'bad', message: 'That username is taken.', suggestions: body.suggestions ?? [] });
      } catch {
        if (ticket === latest.current) setCheck({ state: 'idle' });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [name]);

  const save = async () => {
    if (saving || check.state === 'bad' || validateUsername(name)) return;
    setSaving(true);
    setError(null);
    try {
      await saveOwnProfile(createClient(), userId, { username: name });
      onDone(name);
    } catch (err) {
      setError(userError(err, 'Could not save your username. Please try again.'));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="username-title">
      <form
        className="w-full max-w-sm rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 flex flex-col gap-3 font-sans text-xs text-[var(--text-secondary)]"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <h2 id="username-title" className="text-base font-bold text-[var(--text-primary)]">
          Choose your username
        </h2>
        <p className="leading-relaxed">This is how people find you. Use 3 to 30 letters, numbers, dots or underscores. You can change it later, once every 14 days.</p>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm" aria-hidden="true">
            @
          </span>
          <input
            data-autofocus
            autoFocus
            type="text"
            inputMode="text"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={31}
            aria-label="Username"
            aria-invalid={check.state === 'bad'}
            aria-describedby="username-status"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="yourname"
            className={inputClass}
          />
        </div>

        <p id="username-status" role="status" className="min-h-[1.25rem] text-[11px]">
          {check.state === 'checking' && <span className="text-[var(--text-muted)]">Checking…</span>}
          {check.state === 'ok' && <span className="text-emerald-400">@{name} is available.</span>}
          {check.state === 'bad' && <span className="text-[var(--danger-neutral)]">{check.message}</span>}
        </p>

        {check.state === 'bad' && check.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {check.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setValue(s)}
                className="px-2.5 py-1 rounded-full border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
              >
                @{s}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div role="alert" className="p-3 bg-[var(--danger-subtle)] border border-[var(--danger-neutral)]/30 text-[var(--danger-neutral)] rounded-xl text-[11px]">
            {error}
          </div>
        )}

        <Button type="submit" disabled={saving || check.state === 'bad' || check.state === 'checking' || !!validateUsername(name)}>
          {saving ? 'Saving…' : 'Continue'}
        </Button>
      </form>
    </div>
  );
};
