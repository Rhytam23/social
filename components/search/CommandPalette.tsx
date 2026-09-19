import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ConversationItem, MessageData, UserItem } from '../../types/ui';
import { IconSearch } from '../ui/icons';
import { Avatar } from '../ui/avatar';
import { Kbd } from '../ui/primitives';

export interface PaletteAction {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ConversationItem[];
  users: UserItem[];
  messagesMap: Record<string, MessageData[]>;
  actions: PaletteAction[];
  onSelectConversation: (convId: string, messageId?: string) => void;
  onSelectUser: (user: UserItem) => void;
}

type Row =
  | { kind: 'action'; key: string; label: string; hint?: string; run: () => void }
  | { kind: 'conversation'; key: string; conv: ConversationItem }
  | { kind: 'person'; key: string; user: UserItem }
  | { kind: 'message'; key: string; msg: MessageData; convTitle: string };

const MAX_PER_SECTION = 8;

/** Ctrl/Cmd+K quick switcher: actions, chats, people and messages loaded on this device. */
export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  conversations,
  users,
  messagesMap,
  actions,
  onSelectConversation,
  onSelectUser,
}) => {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      setQuery('');
      setActive(0);
    } else {
      returnFocus.current?.focus?.();
    }
  }, [isOpen]);

  const rows = useMemo<Row[]>(() => {
    const q = query.trim().toLowerCase();
    const out: Row[] = [];
    const acts = actions.filter((a) => !q || a.label.toLowerCase().includes(q));
    acts.slice(0, MAX_PER_SECTION).forEach((a) => out.push({ kind: 'action', key: `a-${a.id}`, label: a.label, hint: a.hint, run: a.run }));

    const convs = conversations.filter((c) => !q || c.title.toLowerCase().includes(q));
    convs.slice(0, MAX_PER_SECTION).forEach((c) => out.push({ kind: 'conversation', key: `c-${c.id}`, conv: c }));

    if (q) {
      users
        .filter((u) => u.name.toLowerCase().includes(q) || (u.username ?? '').toLowerCase().includes(q) || String(u.registrationId).includes(q))
        .slice(0, MAX_PER_SECTION)
        .forEach((u) => out.push({ kind: 'person', key: `u-${u.id}`, user: u }));

      let count = 0;
      for (const [convId, msgs] of Object.entries(messagesMap)) {
        const title = conversations.find((c) => c.id === convId)?.title ?? 'Conversation';
        for (const m of msgs) {
          if (count >= 20) break;
          if (!m.isDeletedLocally && m.content.toLowerCase().includes(q)) {
            out.push({ kind: 'message', key: `m-${m.id}`, msg: m, convTitle: title });
            count++;
          }
        }
      }
    }
    return out;
  }, [query, actions, conversations, users, messagesMap]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!isOpen) return null;

  const choose = (row: Row | undefined) => {
    if (!row) return;
    onClose();
    if (row.kind === 'action') row.run();
    else if (row.kind === 'conversation') onSelectConversation(row.conv.id);
    else if (row.kind === 'person') onSelectUser(row.user);
    else onSelectConversation(row.msg.conversationId, row.msg.id);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, rows.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(rows[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const sectionOf = (r: Row) =>
    r.kind === 'action' ? 'Actions' : r.kind === 'conversation' ? 'Conversations' : r.kind === 'person' ? 'People' : 'Messages on this device';

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 flex items-start justify-center p-4 sm:pt-20 font-sans animate-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Quick switcher"
        className="w-full max-w-xl floating overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95"
        onKeyDown={onKeyDown}
      >
        <div className="p-3.5 border-b border-[var(--border-subtle)] flex items-center gap-3">
          <IconSearch className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
          <input
            type="text"
            autoFocus
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={rows[active] ? `${listId}-${active}` : undefined}
            aria-label="Search"
            placeholder="Search chats, people, messages, or type an action…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm focus:outline-none"
          />
          <Kbd>Esc</Kbd>
        </div>

        <div id={listId} role="listbox" ref={listRef} className="flex-1 overflow-y-auto p-2 text-sm">
          {rows.length === 0 ? (
            <p className="py-12 text-center text-[var(--text-muted)] text-xs">
              Nothing matches &ldquo;{query}&rdquo;. Search covers messages already loaded on this device.
            </p>
          ) : (
            rows.map((row, i) => {
              const showHeader = i === 0 || sectionOf(rows[i - 1]) !== sectionOf(row);
              return (
                <React.Fragment key={row.key}>
                  {showHeader && (
                    <div className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]" role="presentation">
                      {sectionOf(row)}
                    </div>
                  )}
                  <div
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseMove={() => setActive(i)}
                    onClick={() => choose(row)}
                    className={`flex items-center gap-3 px-2.5 py-2 rounded-xl cursor-pointer ${
                      i === active ? 'bg-[var(--surface-2)]' : ''
                    }`}
                  >
                    {row.kind === 'action' && (
                      <>
                        <span className="w-7 h-7 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent-text)] flex items-center justify-center text-xs font-bold">›</span>
                        <span className="flex-1 text-[var(--text-primary)]">{row.label}</span>
                        {row.hint && <Kbd>{row.hint}</Kbd>}
                      </>
                    )}
                    {row.kind === 'conversation' && (
                      <>
                        <Avatar name={row.conv.title} size="sm" presence={row.conv.recipientUser?.presence} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[var(--text-primary)] truncate">{row.conv.title}</p>
                          <p className="text-[11px] text-[var(--text-muted)] truncate">{row.conv.lastMessage?.snippet || (row.conv.type === 'group' ? 'Group' : 'Direct message')}</p>
                        </div>
                      </>
                    )}
                    {row.kind === 'person' && (
                      <>
                        <Avatar name={row.user.name} src={row.user.avatarUrl} size="sm" presence={row.user.presence} />
                        <span className="flex-1 text-[var(--text-primary)] truncate">{row.user.name}</span>
                        <span className="text-[11px] font-mono text-[var(--text-muted)]">#{row.user.registrationId}</span>
                      </>
                    )}
                    {row.kind === 'message' && (
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {row.msg.senderName} · {row.convTitle} · {row.msg.timestamp}
                        </p>
                        <p className="text-[var(--text-primary)] line-clamp-2">{row.msg.content}</p>
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })
          )}
        </div>

        <div className="px-3.5 py-2 border-t border-[var(--border-subtle)] flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
          <span><Kbd>↑</Kbd> <Kbd>↓</Kbd> move</span>
          <span><Kbd>Enter</Kbd> open</span>
          <span className="ml-auto">Message search covers this device only</span>
        </div>
      </div>
    </div>
  );
};
