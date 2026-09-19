'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ConversationItem } from '../../types/ui';

const HOUR = 3600_000;
const OPTIONS: { key: string; label: string; level: 'all' | 'mentions' | 'none' | 'default'; ms?: number }[] = [
  { key: 'default', label: 'Follow my settings', level: 'default' },
  { key: 'all', label: 'Every message', level: 'all' },
  { key: 'mentions', label: 'Mentions only', level: 'mentions' },
  { key: '1h', label: 'Mute for 1 hour', level: 'all', ms: HOUR },
  { key: '8h', label: 'Mute for 8 hours', level: 'all', ms: 8 * HOUR },
  { key: '1w', label: 'Mute for 1 week', level: 'all', ms: 168 * HOUR },
  { key: 'none', label: 'Mute until I turn it on', level: 'none' },
];

function currentKey(c: ConversationItem): string {
  if (c.mutedUntil && c.mutedUntil > Date.now()) return 'timed';
  return c.notifyLevel ?? 'default';
}

/** Per-conversation notification menu (bell in the chat header). */
export const NotifyMenu: React.FC<{
  conversation: ConversationItem;
  onChange: (level: 'all' | 'mentions' | 'none' | 'default', muteMs?: number) => void;
}> = ({ conversation, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const key = currentKey(conversation);
  const quiet = key === 'timed' || key === 'none' || key === 'mentions';

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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Notification settings for this conversation"
        title="Notifications for this conversation"
        className={`p-2 rounded-xl transition-colors ${quiet ? 'text-amber-400' : 'text-slate-400'} hover:text-slate-100 hover:bg-slate-800`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          {quiet ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5.586 15H4l1.4-1.4A2 2 0 006 12.2V11a6 6 0 013.2-5.3M9 17h6m-6 0a3 3 0 006 0M3 3l18 18" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" />
          )}
        </svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-11 z-40 w-56 p-1.5 bg-[var(--surface-1)] border border-[var(--border-strong)] rounded-2xl shadow-[var(--shadow-pop)] animate-in zoom-in-95">
          {OPTIONS.map((o) => (
            <button
              key={o.key}
              role="menuitemradio"
              aria-checked={key === o.key}
              onClick={() => {
                onChange(o.level, o.ms);
                setOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
            >
              {o.label}
              {key === o.key && <span className="text-[var(--accent-text)]">✓</span>}
            </button>
          ))}
          {key === 'timed' && conversation.mutedUntil && (
            <p className="px-3 py-1.5 text-[10px] text-[var(--text-muted)]">Muted until {new Date(conversation.mutedUntil).toLocaleString()}</p>
          )}
        </div>
      )}
    </div>
  );
};
