'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ConversationItem } from '../../types/ui';
import { IconCheck, IconMoreVertical, IconSearch, IconShield } from '../ui/icons';

const HOUR = 3600_000;
const DAY = 86400;

type NotifyLevel = 'all' | 'mentions' | 'none' | 'default';

const NOTIFY_OPTIONS: { key: string; label: string; level: NotifyLevel; ms?: number }[] = [
  { key: 'default', label: 'Follow my settings', level: 'default' },
  { key: 'all', label: 'Every message', level: 'all' },
  { key: 'mentions', label: 'Mentions only', level: 'mentions' },
  { key: '1h', label: 'Mute for 1 hour', level: 'all', ms: HOUR },
  { key: '8h', label: 'Mute for 8 hours', level: 'all', ms: 8 * HOUR },
  { key: '1w', label: 'Mute for 1 week', level: 'all', ms: 168 * HOUR },
  { key: 'none', label: 'Mute until I turn it on', level: 'none' },
];

const DISAPPEAR_OPTIONS: { label: string; seconds: number | null }[] = [
  { label: 'Off', seconds: null },
  { label: '24 hours', seconds: DAY },
  { label: '7 days', seconds: 7 * DAY },
  { label: '90 days', seconds: 90 * DAY },
];

function currentNotifyKey(c: ConversationItem): string {
  if (c.mutedUntil && c.mutedUntil > Date.now()) return 'timed';
  return c.notifyLevel ?? 'default';
}

const ITEM = 'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-xs text-[var(--text-primary)] hover:bg-[var(--surface-2)]';
const HEADING = 'px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]';

/**
 * The one "more" menu in the chat header: search, security details, notifications and disappearing
 * messages. It replaces four separate icon buttons so the header stays quiet.
 */
export const ChatHeaderMenu: React.FC<{
  conversation: ConversationItem;
  searchOpen: boolean;
  onToggleSearch: () => void;
  onOpenSecurity?: () => void;
  onSetNotify?: (level: NotifyLevel, muteMs?: number) => void;
  onSetDisappear?: (seconds: number | null) => void;
}> = ({ conversation, searchOpen, onToggleSearch, onOpenSecurity, onSetNotify, onSetDisappear }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const notifyKey = currentNotifyKey(conversation);
  const quiet = notifyKey === 'timed' || notifyKey === 'none' || notifyKey === 'mentions';
  const disappearing = !!conversation.disappearAfter;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const tick = <IconCheck className="w-3.5 h-3.5 text-[var(--accent-text)] shrink-0" />;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Conversation options"
        title="Conversation options"
        className={`p-2 rounded-lg transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] ${quiet || disappearing || searchOpen ? 'text-[var(--accent-text)]' : 'text-[var(--text-secondary)]'}`}
      >
        <IconMoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-11 z-40 w-64 max-h-[70vh] overflow-y-auto p-1.5 floating animate-in zoom-in-95">
          <button
            role="menuitem"
            className={ITEM}
            onClick={() => {
              onToggleSearch();
              setOpen(false);
            }}
          >
            <span className="flex items-center gap-2">
              <IconSearch className="w-3.5 h-3.5" />
              Search in conversation
            </span>
            {searchOpen && tick}
          </button>
          {onOpenSecurity && (
            <button
              role="menuitem"
              className={ITEM}
              onClick={() => {
                onOpenSecurity();
                setOpen(false);
              }}
            >
              <span className="flex items-center gap-2">
                <IconShield className="w-3.5 h-3.5" />
                Security details
              </span>
            </button>
          )}

          {onSetNotify && (
            <>
              <p className={HEADING}>Notifications</p>
              {NOTIFY_OPTIONS.map((o) => (
                <button
                  key={o.key}
                  role="menuitemradio"
                  aria-checked={notifyKey === o.key}
                  className={ITEM}
                  onClick={() => {
                    onSetNotify(o.level, o.ms);
                    setOpen(false);
                  }}
                >
                  {o.label}
                  {notifyKey === o.key && tick}
                </button>
              ))}
              {notifyKey === 'timed' && conversation.mutedUntil && (
                <p className="px-3 py-1 text-[10px] text-[var(--text-muted)]">Muted until {new Date(conversation.mutedUntil).toLocaleString()}</p>
              )}
            </>
          )}

          {onSetDisappear && (
            <>
              <p className={HEADING}>Disappearing messages</p>
              {DISAPPEAR_OPTIONS.map((o) => {
                const selected = (conversation.disappearAfter ?? null) === o.seconds;
                return (
                  <button
                    key={o.label}
                    role="menuitemradio"
                    aria-checked={selected}
                    className={ITEM}
                    onClick={() => {
                      onSetDisappear(o.seconds);
                      setOpen(false);
                    }}
                  >
                    {o.label}
                    {selected && tick}
                  </button>
                );
              })}
              <p className="px-3 py-1 text-[10px] leading-relaxed text-[var(--text-muted)]">New messages are deleted for everyone after this time. Messages already sent are not changed.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};
