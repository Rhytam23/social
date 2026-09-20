import React, { useState } from 'react';
import { ViewCategory, ConversationItem } from '../../types/ui';
import {
  IconArchive,
  IconMoreVertical,
  IconMute,
  IconPin,
  IconPlus,
  IconSearch,
} from '../ui/icons';
import { Avatar } from '../ui/avatar';
import { StatusMenu } from './StatusMenu';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { GroupInvites } from '../groups/GroupInvites';
import type { GroupInviteItem } from '../../lib/groups/invites';
import { CountBadge, ConversationListSkeleton } from '../ui/primitives';

export interface NavDeckProps {
  currentUserName: string;
  userRole: 'admin' | 'member';
  activeCategory: ViewCategory;
  onSelectCategory: (cat: ViewCategory) => void;
  conversations: ConversationItem[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  /** Start a direct chat (Chats). */
  onNewMessage: () => void;
  /** Create or join a group (Groups). */
  onNewGroup?: () => void;
  /** Group invitations waiting for an answer, and how to answer one. */
  groupInvites?: GroupInviteItem[];
  onRespondGroupInvite?: (inviteId: string, accept: boolean) => void;
  /** Unread in direct chats. */
  unreadTotal: number;
  /** Unread in groups. */
  groupUnreadTotal?: number;
  isLoading?: boolean;
  onStatusChanged?: () => void;
  onGlobalSearchTrigger?: () => void;

  // Conversation Actions
  onPinConversation?: (convId: string) => void;
  onMuteConversation?: (convId: string) => void;
  onArchiveConversation?: (convId: string) => void;
  onMarkUnreadConversation?: (convId: string) => void;
  onClearHistoryConversation?: (convId: string) => void;
  onDeleteConversationLocally?: (convId: string) => void;
}

export const NavDeck: React.FC<NavDeckProps> = ({
  currentUserName,
  userRole,
  activeCategory,
  onSelectCategory,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewMessage,
  onNewGroup,
  groupInvites = [],
  onRespondGroupInvite,
  unreadTotal,
  groupUnreadTotal = 0,
  isLoading,
  onStatusChanged,
  onGlobalSearchTrigger,
  onPinConversation,
  onMuteConversation,
  onArchiveConversation,
  onMarkUnreadConversation,
  onClearHistoryConversation,
  onDeleteConversationLocally,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [activeMenuConvId, setActiveMenuConvId] = useState<string | null>(null);

  const categories: { key: ViewCategory; label: string; badge?: number }[] = [
    { key: 'chats', label: 'Chats', badge: unreadTotal },
    { key: 'groups', label: 'Groups', badge: groupUnreadTotal },
    { key: 'saved', label: 'Saved' },
    { key: 'people', label: 'People' },
    ...(userRole === 'admin' ? [{ key: 'admin' as ViewCategory, label: 'Admin' }] : []),
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const filteredConversations = conversations.filter((c) => {
    if (showArchived) return c.isArchived;
    if (c.isArchived) return false;
    // Chats are private one-to-one conversations; groups have their own tab.
    if (activeCategory === 'groups' ? c.type !== 'group' : c.type === 'group') return false;
    if (!searchQuery.trim()) return true;
    return (
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage?.snippet.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Sort pinned conversations to top
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  const archivedCount = conversations.filter((c) => c.isArchived).length;

  return (
    <nav aria-label="Conversations" className="w-full md:w-80 lg:w-96 bg-[var(--surface-1)] border-r border-[var(--border-subtle)] flex flex-col shrink-0 h-full font-sans">
      {/* 1. Left Sidebar Header (WhatsApp Web Usability) */}
      <div className="h-16 px-4 bg-slate-950/40 border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <StatusMenu name={currentUserName} onChanged={onStatusChanged} />
          <span className="text-sm font-semibold text-[var(--text-primary)] leading-tight truncate">{currentUserName}</span>
        </div>

        <div className="flex items-center gap-1">
          <NotificationCenter onOpenConversation={onSelectConversation} />
          {activeCategory === 'groups' && onNewGroup ? (
            <button
              onClick={onNewGroup}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              title="Create or join a group"
              aria-label="Create or join a group"
            >
              <IconPlus className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onNewMessage}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              title="Start a new chat"
              aria-label="Start a new chat"
            >
              <IconPlus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Category Chips / Filter Bar */}
      <div className="p-2.5 border-b border-[var(--border-subtle)] flex items-center gap-1 bg-slate-950/20 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => {
              onSelectCategory(cat.key);
              if (showArchived) setShowArchived(false);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeCategory === cat.key && !showArchived
                ? 'bg-slate-800 text-slate-100 border border-slate-700/80 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span>{cat.label}</span>
            {cat.badge && cat.badge > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950">
                {cat.badge}
              </span>
            ) : null}
          </button>
        ))}

        {archivedCount > 0 && (
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              showArchived
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <IconArchive className="w-3.5 h-3.5" />
            <span>Archived ({archivedCount})</span>
          </button>
        )}
      </div>

      {onRespondGroupInvite && <GroupInvites invites={groupInvites} onRespond={onRespondGroupInvite} />}

      {/* 3. Search Bar */}
      <div className="p-3 border-b border-[var(--border-subtle)]">
        <div className="relative flex items-center">
          <IconSearch className="w-4 h-4 text-slate-400 absolute left-3" />
          <input
            type="text"
            placeholder={activeCategory === 'groups' ? 'Search your groups...' : 'Search your chats...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="field pl-9 pr-8"
          />
          {onGlobalSearchTrigger && (
            <button
              onClick={onGlobalSearchTrigger}
              className="absolute right-2.5 font-mono text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 hover:text-white"
              title="Global search (Ctrl+K)"
            >
              Ctrl+K
            </button>
          )}
        </div>
      </div>

      {/* 4. Conversation List Feed */}
      <div className="stagger flex-1 overflow-y-auto p-2 flex flex-col gap-0.5">
        {isLoading && sortedConversations.length === 0 ? (
          <ConversationListSkeleton />
        ) : sortedConversations.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            {showArchived
              ? 'No archived conversations.'
              : searchQuery
              ? `No chats match "${searchQuery}"`
              : activeCategory === 'groups'
              ? 'No groups yet. Use + to create one or join with an invite.'
              : 'No chats yet. Use + to message someone by their username.'}
          </div>
        ) : (
          sortedConversations.map((conv, idx) => {
            const isActive = conv.id === activeConversationId && !showArchived;
            return (
              <div key={conv.id} className="relative group/item" style={{ ['--i' as string]: Math.min(idx, 8) }}>
                <button
                  onClick={() => onSelectConversation(conv.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full p-3 text-left rounded-2xl transition-all flex items-center gap-3 relative ${
                    isActive
                      ? 'bg-slate-800/90 text-white border border-slate-700/80 shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800/40 hover:text-white border border-transparent'
                  }`}
                >
                  {/* Active Indicator Bar */}
                  {isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-400 rounded-r-full" />
                  )}

                  {/* Avatar */}
                  {conv.type === 'group' ? (
                    <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-xs font-bold border bg-amber-500/15 border-amber-500/30 text-amber-400">
                      {getInitials(conv.title)}
                    </div>
                  ) : (
                    <Avatar name={conv.title} size="md" presence={conv.recipientUser?.presence ?? 'offline'} />
                  )}

                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold text-xs text-slate-100 truncate">
                          {conv.title}
                        </span>
                        {conv.isPinned && <IconPin className="w-3 h-3 text-amber-400 shrink-0" />}
                        {conv.isMuted && <IconMute className="w-3 h-3 text-slate-500 shrink-0" />}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 font-sans">
                        {conv.lastMessage?.timestamp || ''}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-400 truncate leading-tight">
                        {conv.draftText ? (
                          <span className="text-amber-400 font-medium">Draft: {conv.draftText}</span>
                        ) : (
                          conv.lastMessage?.snippet || 'No messages yet'
                        )}
                      </p>
                      <CountBadge count={conv.unreadCount} />
                    </div>
                  </div>
                </button>

                {/* Context Menu Trigger */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuConvId(activeMenuConvId === conv.id ? null : conv.id);
                  }}
                  className="absolute right-2 top-3.5 hidden group-hover/item:flex p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/80 z-20"
                  title="Conversation options"
                >
                  <IconMoreVertical className="w-3.5 h-3.5" />
                </button>

                {/* Context Menu Dropdown */}
                {activeMenuConvId === conv.id && (
                  <div className="absolute right-2 top-9 z-30 floating p-1.5 flex flex-col text-xs min-w-[160px] font-sans">
                    <button
                      onClick={() => {
                        onPinConversation?.(conv.id);
                        setActiveMenuConvId(null);
                      }}
                      className="p-2 text-left hover:bg-slate-800 rounded-lg text-slate-200 flex items-center justify-between"
                    >
                      <span>{conv.isPinned ? 'Unpin chat' : 'Pin chat'}</span>
                      <IconPin className="w-3.5 h-3.5 text-amber-400" />
                    </button>

                    <button
                      onClick={() => {
                        onMuteConversation?.(conv.id);
                        setActiveMenuConvId(null);
                      }}
                      className="p-2 text-left hover:bg-slate-800 rounded-lg text-slate-200 flex items-center justify-between"
                    >
                      <span>{conv.isMuted ? 'Unmute' : 'Mute'}</span>
                      <IconMute className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    <button
                      onClick={() => {
                        onArchiveConversation?.(conv.id);
                        setActiveMenuConvId(null);
                      }}
                      className="p-2 text-left hover:bg-slate-800 rounded-lg text-slate-200 flex items-center justify-between"
                    >
                      <span>{conv.isArchived ? 'Unarchive' : 'Archive'}</span>
                      <IconArchive className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    <button
                      onClick={() => {
                        onMarkUnreadConversation?.(conv.id);
                        setActiveMenuConvId(null);
                      }}
                      className="p-2 text-left hover:bg-slate-800 rounded-lg text-slate-200"
                    >
                      {conv.unreadCount > 0 ? 'Mark as read' : 'Mark as unread'}
                    </button>

                    <button
                      onClick={() => {
                        onClearHistoryConversation?.(conv.id);
                        setActiveMenuConvId(null);
                      }}
                      className="p-2 text-left hover:bg-slate-800 rounded-lg text-slate-300"
                    >
                      Clear local history
                    </button>

                    <button
                      onClick={() => {
                        onDeleteConversationLocally?.(conv.id);
                        setActiveMenuConvId(null);
                      }}
                      className="p-2 text-left hover:bg-slate-800 rounded-lg text-rose-400 font-medium"
                    >
                      Delete conversation
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </nav>
  );
};
