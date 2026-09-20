import React from 'react';
import { UserItem } from '../../types/ui';
import type { LookupOutcome } from '../../lib/people/lookup';
import { Avatar } from '../ui/avatar';
import { Button } from '../ui/button';
import { UsernameLookup } from './UsernameLookup';

export interface PeopleDirectoryProps {
  /** People you already share a conversation with. Not a directory of everyone. */
  contacts: UserItem[];
  onLookup: (raw: string) => Promise<LookupOutcome>;
  onOpenProfile: (user: UserItem) => void;
  onStartDirectChat: (user: UserItem) => void;
  blockedIds?: string[];
}

export const PeopleDirectory: React.FC<PeopleDirectoryProps> = ({ contacts, onLookup, onOpenProfile, onStartDirectChat, blockedIds = [] }) => {
  return (
    <div className="flex-1 bg-[var(--canvas-bg)] flex flex-col h-full overflow-y-auto p-6 sm:p-8 gap-6 font-sans max-w-3xl mx-auto w-full [&>*]:shrink-0">
      <div className="flex flex-col gap-1 border-b border-[var(--border-subtle)] pb-5">
        <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Find people</h2>
        <p className="text-xs text-[var(--text-secondary)]">Enter someone&apos;s exact username to find them, view their profile or send a message.</p>
      </div>

      <UsernameLookup
        onLookup={onLookup}
        renderActions={(user, blocked) => (
          <>
            <Button variant="secondary" size="sm" onClick={() => onOpenProfile(user)}>Profile</Button>
            <Button variant="primary" size="sm" disabled={blocked} onClick={() => onStartDirectChat(user)}>Message</Button>
          </>
        )}
      />

      <section aria-label="Your contacts" className="flex flex-col gap-2">
        <h3 className="text-xs font-bold text-[var(--text-primary)]">Your contacts</h3>
        {contacts.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] py-2">People you chat with will appear here.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {contacts.map((u) => (
              <li key={u.id} className="panel p-3 flex items-center justify-between gap-3">
                <button type="button" onClick={() => onOpenProfile(u)} className="flex items-center gap-3 min-w-0 text-left">
                  <Avatar name={u.name} src={u.avatarUrl} size="md" presence={u.presence ?? 'offline'} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--text-primary)] truncate">{u.name}</span>
                    {u.username && <span className="block text-[11px] text-[var(--text-muted)] font-mono truncate">@{u.username}</span>}
                  </span>
                </button>
                <Button variant="secondary" size="sm" disabled={blockedIds.includes(u.id)} onClick={() => onStartDirectChat(u)}>
                  Message
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
