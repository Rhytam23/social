'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { UserItem } from '../../types/ui';
import type { LookupOutcome } from '../../lib/people/lookup';
import { parseUsernameQuery } from '../../lib/people/username';
import { Avatar } from '../ui/avatar';
import { IconSearch } from '../ui/icons';

export interface UsernameLookupProps {
  /** Finds people whose username starts with the text. Provided by the store so demo and connected mode both work. */
  onLookup: (raw: string) => Promise<LookupOutcome>;
  /** Buttons shown on a found person. `blocked` is true for people you blocked. */
  renderActions: (user: UserItem, blocked: boolean) => React.ReactNode;
  autoFocus?: boolean;
}

type ViewState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'result'; outcome: LookupOutcome; searched: string };

/** Wait for a pause in typing before asking the server, so a search is one request and not one per letter. */
const TYPING_PAUSE_MS = 350;

/**
 * Search box for finding people by the start of their username: type "ars" and everyone whose username
 * begins with "ars" appears. Names, emails and phone numbers are not searchable, and nothing is searched
 * until at least 3 characters are typed.
 */
export const UsernameLookup: React.FC<UsernameLookupProps> = ({ onLookup, renderActions, autoFocus }) => {
  const [value, setValue] = useState('');
  const [view, setView] = useState<ViewState>({ kind: 'idle' });
  // Ignore an answer that arrives after a newer search was started.
  const latest = useRef(0);
  // Callers pass a new function on every render and a search updates the store, so depending on it would loop.
  const lookupRef = useRef(onLookup);
  lookupRef.current = onLookup;

  useEffect(() => {
    const parsed = parseUsernameQuery(value);
    const ticket = ++latest.current;
    if (!parsed.ok) {
      setView({ kind: 'idle' });
      return;
    }
    const timer = setTimeout(async () => {
      setView({ kind: 'loading' });
      const outcome = await lookupRef.current(parsed.value);
      if (ticket === latest.current) setView({ kind: 'result', outcome, searched: parsed.value });
    }, TYPING_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [value]);

  const typed = value.trim().replace(/^@/, '');
  const tooShort = typed.length > 0 && typed.length < 3;
  const invalid = typed.length >= 3 ? parseUsernameQuery(value) : null;

  return (
    <div className="flex flex-col gap-3 font-sans">
      <div className="relative" role="search" aria-label="Find people by username">
        <IconSearch className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          inputMode="text"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          data-autofocus={autoFocus ? '' : undefined}
          aria-label="Username"
          placeholder="Start typing a username, e.g. @ars"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-emerald-500/60"
        />
      </div>

      <div aria-live="polite" className="min-h-6">
        {typed === '' && (
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            Type at least 3 letters of a username. Names, emails and phone numbers are not searchable.
          </p>
        )}
        {tooShort && <p className="text-[11px] text-[var(--text-muted)]">Keep typing: 3 characters or more.</p>}
        {invalid && !invalid.ok && <p className="text-xs text-[var(--danger-neutral)]">{invalid.error}</p>}
        {view.kind === 'loading' && <p className="text-xs text-[var(--text-secondary)]">Searching…</p>}
        {view.kind === 'result' && view.outcome.status === 'error' && (
          <p role="alert" className="text-xs text-[var(--danger-neutral)]">{view.outcome.message}</p>
        )}
        {view.kind === 'result' && view.outcome.status === 'invalid' && (
          <p role="alert" className="text-xs text-[var(--danger-neutral)]">{view.outcome.message}</p>
        )}
        {view.kind === 'result' && view.outcome.status === 'none' && (
          <p className="text-xs text-[var(--text-secondary)]">
            No usernames start with <span className="font-mono">@{view.searched}</span>.
          </p>
        )}
        {view.kind === 'result' && view.outcome.status === 'found' && (
          <ul className="flex flex-col gap-2">
            {view.outcome.matches.map(({ user, blocked }) => (
              <li key={user.id} className="panel p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={user.name} src={user.avatarUrl} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--text-primary)] truncate">{user.name}</p>
                    <p className="text-[11px] text-[var(--text-muted)] font-mono truncate">@{user.username}</p>
                    {blocked && <p className="text-[11px] text-[var(--warning)]">You blocked this person.</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">{renderActions(user, blocked)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
