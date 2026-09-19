'use client';

import React from 'react';
import { Dialog } from '../ui/dialog';
import { Button } from '../ui/button';
import { Avatar } from '../ui/avatar';
import { UserItem } from '../../types/ui';
import type { LookupOutcome } from '../../lib/people/lookup';
import { UsernameLookup } from '../people/UsernameLookup';

export interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** People you already know. New people are found by exact username only. */
  contacts: UserItem[];
  currentUserId: string;
  onLookup: (raw: string) => Promise<LookupOutcome>;
  onStartDirectChat: (user: UserItem) => void;
  blockedIds?: string[];
}

/** Starts a direct (one-to-one) conversation. Groups are created from the Groups "+" instead. */
export const NewConversationModal: React.FC<NewConversationModalProps> = ({
  isOpen,
  onClose,
  contacts,
  currentUserId,
  onLookup,
  onStartDirectChat,
  blockedIds = [],
}) => {
  const start = (u: UserItem) => {
    onStartDirectChat(u);
    onClose();
  };
  const people = contacts.filter((u) => u.id !== currentUserId);

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="New chat">
      <div className="flex flex-col gap-4 font-sans">
        <UsernameLookup
          autoFocus
          onLookup={onLookup}
          renderActions={(user, blocked) => (
            <Button variant="primary" size="sm" disabled={blocked} onClick={() => start(user)}>
              Message
            </Button>
          )}
        />

        {people.length > 0 && (
          <div className="flex flex-col gap-1">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Your contacts</h3>
            <ul className="flex flex-col gap-1 max-h-52 overflow-y-auto pr-1">
              {people.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    disabled={blockedIds.includes(u.id)}
                    onClick={() => start(u)}
                    className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-[var(--surface-2)] disabled:opacity-50"
                  >
                    <Avatar name={u.name} src={u.avatarUrl} size="sm" />
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-[var(--text-primary)] truncate">{u.name}</span>
                      {u.username && <span className="block text-[11px] text-[var(--text-muted)] font-mono truncate">@{u.username}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Dialog>
  );
};
