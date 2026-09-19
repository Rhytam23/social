'use client';

import React, { useRef, useState } from 'react';
import type { UserItem } from '../../types/ui';
import type { LookupOutcome } from '../../lib/people/lookup';
import { parseUsernameQuery } from '../../lib/people/username';
import { Avatar } from '../ui/avatar';
import { Button } from '../ui/button';
import { IconSearch } from '../ui/icons';

export interface UsernameLookupProps {
  /** Resolves an exact username. Provided by the store so demo and connected mode both work. */
  onLookup: (raw: string) => Promise<LookupOutcome>;
  /** Buttons shown on a found person. `blocked` is true for people you blocked. */
  renderActions: (user: UserItem, blocked: boolean) => React.ReactNode;
  autoFocus?: boolean;
}

type ViewState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'result'; outcome: LookupOutcome; searched: string };

/**
 * Search box for finding a person by exact username. Nothing is searched while
 * typing: the person has to enter the full username and press Search.
 */
export const UsernameLookup: React.FC<UsernameLookupProps> = ({ onLookup, renderActions, autoFocus }) => {
  const [value, setValue] = useState('');
  const [view, setView] = useState<ViewState>({ kind: 'idle' });
  // Ignore an answer that arrives after a newer search was started.
  const latest = useRef(0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseUsernameQuery(value);
    if (!parsed.ok) {
      setView({ kind: 'result', outcome: { status: 'invalid', message: parsed.error }, searched: value });
      return;
    }
    const ticket = ++latest.current;
    setView({ kind: 'loading' });
    const outcome = await onLookup(parsed.value);
    if (ticket === latest.current) setView({ kind: 'result', outcome, searched: parsed.value });
  };

  const loading = view.kind === 'loading';

  return (
    <div className="flex flex-col gap-3 font-sans">
      <form onSubmit={submit} className="flex items-stretch gap-2" role="search" aria-label="Find a person by username">
        <div className="relative flex-1">
          <IconSearch className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            inputMode="text"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            data-autofocus={autoFocus ? '' : undefined}
            aria-label="Username"
            placeholder="Enter an exact username, e.g. @alex_m"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (view.kind === 'result') setView({ kind: 'idle' });
            }}
            className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-emerald-500/60"
          />
        </div>
        <Button type="submit" variant="primary" size="sm" loading={loading} disabled={loading || value.trim() === ''}>
          Search
        </Button>
      </form>

      <div aria-live="polite" className="min-h-6">
        {view.kind === 'idle' && (
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            People can only be found by their exact username. Names, emails and phone numbers are not searchable.
          </p>
        )}
        {view.kind === 'loading' && <p className="text-xs text-[var(--text-secondary)]">Searching…</p>}
        {view.kind === 'result' && view.outcome.status === 'invalid' && (
          <p role="alert" className="text-xs text-[var(--danger-neutral)]">{view.outcome.message}</p>
        )}
        {view.kind === 'result' && view.outcome.status === 'error' && (
          <p role="alert" className="text-xs text-[var(--danger-neutral)]">{view.outcome.message}</p>
        )}
        {view.kind === 'result' && view.outcome.status === 'none' && (
          <p className="text-xs text-[var(--text-secondary)]">
            No one has the username <span className="font-mono">@{view.searched}</span>. Check the spelling and ask them for their exact username.
          </p>
        )}
        {view.kind === 'result' && view.outcome.status === 'found' && (
          <div className="p-3 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar name={view.outcome.user.name} src={view.outcome.user.avatarUrl} size="md" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-[var(--text-primary)] truncate">{view.outcome.user.name}</p>
                <p className="text-[11px] text-[var(--text-muted)] font-mono truncate">@{view.outcome.user.username}</p>
                {view.outcome.blocked && <p className="text-[11px] text-[var(--warning)]">You blocked this person.</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">{renderActions(view.outcome.user, view.outcome.blocked)}</div>
          </div>
        )}
      </div>
    </div>
  );
};
