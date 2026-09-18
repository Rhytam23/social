import React, { useState, useEffect } from 'react';
import { ConversationItem, MessageData, UserItem } from '../../types/ui';
import { IconSearch, IconUsers, IconX } from '../ui/icons';

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ConversationItem[];
  users: UserItem[];
  messagesMap: Record<string, MessageData[]>;
  onSelectConversation: (convId: string) => void;
  onSelectUser: (user: UserItem) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  conversations,
  users,
  messagesMap,
  onSelectConversation,
  onSelectUser,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const matchedPeople = q
    ? users.filter((u) => u.name.toLowerCase().includes(q) || u.registrationId.toString().includes(q))
    : [];

  const matchedConversations = q
    ? conversations.filter((c) => c.title.toLowerCase().includes(q))
    : [];

  const matchedMessages: { msg: MessageData; convTitle: string }[] = [];
  if (q) {
    Object.entries(messagesMap).forEach(([convId, msgs]) => {
      const conv = conversations.find((c) => c.id === convId);
      const title = conv ? conv.title : 'Conversation';
      msgs.forEach((m) => {
        if (m.content.toLowerCase().includes(q)) {
          matchedMessages.push({ msg: m, convTitle: title });
        }
      });
    });
  }

  const hasResults =
    matchedPeople.length > 0 || matchedConversations.length > 0 || matchedMessages.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-start justify-center p-4 sm:pt-20 font-sans">
      <div className="w-full max-w-xl bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Header */}
        <div className="p-3.5 border-b border-slate-800 flex items-center gap-3">
          <IconSearch className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search people, conversations, groups, or messages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <IconX className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs text-slate-400 hover:text-white rounded-lg bg-slate-800 border border-slate-700"
          >
            Esc
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-xs">
          {!q ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-2">
              <IconSearch className="w-8 h-8 text-slate-600" />
              <span>Type to search people, conversations, groups, or messages...</span>
            </div>
          ) : !hasResults ? (
            <div className="py-12 text-center text-slate-500">
              No matching results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <>
              {/* People Section */}
              {matchedPeople.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                    People ({matchedPeople.length})
                  </span>
                  <div className="flex flex-col gap-1">
                    {matchedPeople.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSelectUser(u);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800 text-left flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-bold shrink-0">
                            {u.name[0]}
                          </div>
                          <span className="font-semibold text-slate-100">{u.name}</span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-400">
                          #{u.registrationId}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversations Section */}
              {matchedConversations.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                    Conversations ({matchedConversations.length})
                  </span>
                  <div className="flex flex-col gap-1">
                    {matchedConversations.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          onSelectConversation(c.id);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800 text-left flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold shrink-0">
                            {c.type === 'group' ? <IconUsers className="w-3.5 h-3.5" /> : c.title[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-100">{c.title}</span>
                            <span className="text-[10px] text-slate-400 truncate">
                              {c.lastMessage?.snippet || 'Active session'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-medium">Open</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages Section */}
              {matchedMessages.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                    Messages ({matchedMessages.length})
                  </span>
                  <div className="flex flex-col gap-1">
                    {matchedMessages.map(({ msg, convTitle }) => (
                      <button
                        key={msg.id}
                        onClick={() => {
                          onSelectConversation(msg.conversationId);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800 text-left flex flex-col gap-1 transition-colors"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-300">{msg.senderName}</span>
                          <span className="text-slate-500 font-mono">{convTitle} • {msg.timestamp}</span>
                        </div>
                        <p className="text-slate-200 line-clamp-2 leading-relaxed">{msg.content}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
