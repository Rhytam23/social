import React, { useState } from 'react';
import { ViewCategory, ConversationItem } from '../../types/ui';
import {
  IconArchive,
  IconMoreVertical,
  IconMute,
  IconPin,
  IconPlus,
  IconSearch,
  IconShield,
} from '../ui/icons';

export interface NavDeckProps {
  currentUserName: string;
  currentUserRegistrationId: number;
  userRole: 'admin' | 'member';
  activeCategory: ViewCategory;
  onSelectCategory: (cat: ViewCategory) => void;
  conversations: ConversationItem[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewMessage: () => void;
  onInviteMember: () => void;
  unreadTotal: number;
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
  currentUserRegistrationId,
  userRole,
  activeCategory,
  onSelectCategory,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewMessage,
  onInviteMember,
  unreadTotal,
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
    { key: 'groups', label: 'Groups' },
    { key: 'people', label: 'People' },
    { key: 'settings', label: 'Security' },
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
    <nav className="w-full md:w-80 lg:w-96 bg-[var(--surface-1)] border-r border-[var(--border-subtle)] flex flex-col shrink-0 h-full font-sans">
      {/* 1. Left Sidebar Header (WhatsApp Web Usability) */}
      <div className="h-16 px-4 bg-slate-950/40 border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center text-xs shrink-0 ring-2 ring-slate-800">
            {getInitials(currentUserName)}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-100 leading-tight">{currentUserName}</span>
            <span className="text-[10px] font-mono text-slate-400">#{currentUserRegistrationId}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onNewMessage}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            title="Start new conversation"
          >
            <IconPlus className="w-4 h-4" />
          </button>
          {userRole === 'admin' && (
            <button
              onClick={onInviteMember}
              className="py-1 px-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg text-[11px] font-semibold"
            >
              Invite
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

      {/* 3. Search Bar */}
      <div className="p-3 border-b border-[var(--border-subtle)]">
        <div className="relative flex items-center">
          <IconSearch className="w-4 h-4 text-slate-400 absolute left-3" />
          <input
            type="text"
            placeholder="Search or start new chat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-slate-700"
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
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5">
        {sortedConversations.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            {showArchived
              ? 'No archived conversations.'
              : searchQuery
              ? `No chats match "${searchQuery}"`
              : 'No active conversations.'}
          </div>
        ) : (
          sortedConversations.map((conv) => {
            const isActive = conv.id === activeConversationId && !showArchived;
            return (
              <div key={conv.id} className="relative group/item">
                <button
                  onClick={() => onSelectConversation(conv.id)}
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
                  <div className="relative shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                        conv.type === 'group'
                          ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                          : 'bg-slate-700/80 border-slate-600/50 text-slate-100'
                      }`}
                    >
                      {getInitials(conv.title)}
                    </div>
                    {conv.type === 'direct' && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
                    )}
                  </div>

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
                      {conv.unreadCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
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
                  <div className="absolute right-2 top-9 z-30 bg-slate-900 border border-slate-700 rounded-xl p-1.5 shadow-2xl flex flex-col text-xs min-w-[160px] font-sans">
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

      {/* Security Footer Note */}
      <div className="p-3 border-t border-[var(--border-subtle)] bg-slate-950/30 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
        <IconShield className="w-3.5 h-3.5 text-emerald-400" />
        <span>End-to-end encrypted</span>
      </div>
    </nav>
  );
};
