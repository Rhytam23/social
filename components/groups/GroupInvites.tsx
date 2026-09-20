'use client';

import React from 'react';
import type { GroupInviteItem } from '../../lib/groups/invites';
import { Button } from '../ui/button';

export interface GroupInvitesProps {
  invites: GroupInviteItem[];
  onRespond: (inviteId: string, accept: boolean) => void;
}

/**
 * Invitations to groups from people you have not talked to. Nothing happens until you accept: until then the
 * group cannot see you and you cannot see it. Shown at the top of the conversation list.
 */
export const GroupInvites: React.FC<GroupInvitesProps> = ({ invites, onRespond }) => {
  if (invites.length === 0) return null;
  return (
    <section aria-label="Group invitations" className="mx-2.5 mt-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3 flex flex-col gap-2">
      <h2 className="text-xs font-semibold text-[var(--text-primary)]">
        {invites.length === 1 ? '1 group invitation' : `${invites.length} group invitations`}
      </h2>
      <ul className="flex flex-col gap-2">
        {invites.map((invite) => (
          <li key={invite.id} className="flex flex-col gap-1.5">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              <span className="font-medium text-[var(--text-primary)]">{invite.inviterName}</span>
              {invite.inviterUsername ? <span className="font-mono text-[var(--text-muted)]"> @{invite.inviterUsername}</span> : null} invited you to{' '}
              <span className="font-medium text-[var(--text-primary)]">{invite.groupName}</span>.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="primary" onClick={() => onRespond(invite.id, true)}>Join</Button>
              <Button size="sm" variant="ghost" onClick={() => onRespond(invite.id, false)}>Decline</Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
