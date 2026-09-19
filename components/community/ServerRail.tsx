import React from 'react';
import { CommunityItem } from '../../types/ui';
import { initialsOf } from '../ui/avatar';
import { IconLock, IconPlus } from '../ui/icons';

export interface ServerRailProps {
  /** Empty in demo mode, where communities are not available. */
  communities: CommunityItem[];
  activeCommunityId: string | null;
  /** Unread channel messages per community id. */
  unreadByCommunity: Record<string, number>;
  homeUnread: number;
  onSelectHome: () => void;
  onSelectCommunity: (id: string) => void;
  onAdd: () => void;
}

/**
 * Left rail on desktop, a scrolling strip on phones.
 * Lock = Chat (private, one-to-one conversations). Plus = Groups (create, join, invite).
 * Communities you belong to sit between the two.
 */
export const ServerRail: React.FC<ServerRailProps> = ({ communities, activeCommunityId, unreadByCommunity, homeUnread, onSelectHome, onSelectCommunity, onAdd }) => {
  const item = (active: boolean) =>
    `relative w-11 h-11 shrink-0 flex items-center justify-center text-xs font-bold transition-all duration-150 ${
      active
        ? 'rounded-2xl bg-[var(--accent-primary)] text-[var(--accent-contrast)]'
        : 'rounded-3xl bg-[var(--surface-2)] text-[var(--text-primary)] hover:rounded-2xl hover:bg-[var(--surface-hover)]'
    }`;

  const dot = (n: number) =>
    n > 0 ? (
      <span aria-label={`${n} unread`} className="absolute -bottom-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-[var(--danger-neutral)] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-[var(--canvas-bg)]">
        {n > 99 ? '99+' : n}
      </span>
    ) : null;

  return (
    <nav
      aria-label="Chat and groups"
      className="shrink-0 flex md:flex-col items-center gap-2 p-2 md:py-3 md:w-[68px] bg-[var(--canvas-bg)] border-b md:border-b-0 md:border-r border-[var(--border-subtle)] overflow-x-auto md:overflow-y-auto"
    >
      <button onClick={onSelectHome} aria-label="Chat: private conversations" aria-current={activeCommunityId === null ? 'page' : undefined} title="Chat: private conversations" className={item(activeCommunityId === null)}>
        <IconLock className="w-5 h-5" />
        {dot(homeUnread)}
      </button>
      <span className="hidden md:block -mt-1 text-[10px] font-semibold text-[var(--text-secondary)]" aria-hidden="true">Chat</span>
      <span className="hidden md:block w-8 h-px bg-[var(--border-subtle)]" role="separator" />
      {communities.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelectCommunity(c.id)}
          aria-label={c.name}
          aria-current={activeCommunityId === c.id ? 'page' : undefined}
          title={c.name}
          className={item(activeCommunityId === c.id)}
        >
          {initialsOf(c.name)}
          {dot(unreadByCommunity[c.id] ?? 0)}
        </button>
      ))}
      <button
        onClick={onAdd}
        aria-label="Groups: create a group, or join with an invite"
        title="Groups: create a group, or join with an invite"
        className="w-11 h-11 shrink-0 rounded-3xl border-2 border-dashed border-[var(--border-strong)] text-[var(--accent-text)] flex items-center justify-center hover:rounded-2xl hover:border-[var(--accent-primary)] transition-all"
      >
        <IconPlus className="w-5 h-5" />
      </button>
      <span className="hidden md:block -mt-1 text-[10px] font-semibold text-[var(--text-secondary)]" aria-hidden="true">Groups</span>
    </nav>
  );
};
