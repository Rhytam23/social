import React from 'react';
import { CommunityItem, ConversationItem } from '../../types/ui';
import { CountBadge } from '../ui/primitives';
import { IconLock, IconPlus } from '../ui/icons';
import { isGroupManager } from '../../lib/groups/roles';

export interface CommunitySidebarProps {
  community: CommunityItem;
  channels: ConversationItem[];
  activeConversationId: string;
  onSelectChannel: (id: string) => void;
  onOpenSettings: () => void;
  onCreateChannel: () => void;
}

/** Channel list for the selected community. */
export const CommunitySidebar: React.FC<CommunitySidebarProps> = ({ community, channels, activeConversationId, onSelectChannel, onOpenSettings, onCreateChannel }) => {
  const publicChannels = channels.filter((c) => !c.isPrivateChannel);
  const privateChannels = channels.filter((c) => c.isPrivateChannel);

  const row = (c: ConversationItem) => {
    const active = c.id === activeConversationId;
    return (
      <li key={c.id}>
        <button
          onClick={() => onSelectChannel(c.id)}
          aria-current={active ? 'page' : undefined}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-sm transition-colors ${
            active ? 'bg-[var(--surface-2)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]/60 hover:text-[var(--text-primary)]'
          } ${c.unreadCount > 0 && !active ? 'font-semibold text-[var(--text-primary)]' : ''}`}
        >
          <span className="text-[var(--text-muted)] w-4 text-center shrink-0" aria-hidden="true">
            {c.isPrivateChannel ? <IconLock className="w-3.5 h-3.5" /> : '#'}
          </span>
          <span className="flex-1 truncate">{c.title}</span>
          {c.isPrivateChannel && <span className="sr-only">private channel</span>}
          <CountBadge count={c.unreadCount} />
        </button>
      </li>
    );
  };

  return (
    <nav aria-label={`${community.name} channels`} className="w-full md:w-64 lg:w-72 bg-[var(--surface-1)] border-r border-[var(--border-subtle)] flex flex-col shrink-0 h-full font-sans">
      <button
        onClick={onOpenSettings}
        className="h-14 px-4 flex items-center justify-between border-b border-[var(--border-subtle)] hover:bg-[var(--surface-2)]/60 text-left shrink-0"
        aria-label={`${community.name} settings and members`}
      >
        <span className="min-w-0">
          <span className="block text-sm font-bold text-[var(--text-primary)] truncate">{community.name}</span>
          <span className="block text-[10px] text-[var(--text-muted)]">Members and invites</span>
        </span>
        <span aria-hidden="true" className="text-[var(--text-muted)]">⌄</span>
      </button>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex items-center justify-between px-3 pt-2 pb-1">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Channels</h2>
          {isGroupManager(community.role) && (
            <button onClick={onCreateChannel} aria-label="Add channel" title="Add channel" className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]">
              <IconPlus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {publicChannels.length === 0 && <p className="px-3 py-2 text-xs text-[var(--text-muted)]">No channels yet.</p>}
        <ul className="flex flex-col gap-0.5">{publicChannels.map(row)}</ul>

        {privateChannels.length > 0 && (
          <>
            <h2 className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Private channels</h2>
            <ul className="flex flex-col gap-0.5">{privateChannels.map(row)}</ul>
          </>
        )}
      </div>
    </nav>
  );
};
