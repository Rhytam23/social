'use client';

import React, { useEffect, useRef, useState } from 'react';
import { clearNotifications, markAllNotificationsRead, useNotificationCenter } from '../../lib/notifications/notifier';
import { CountBadge } from '../ui/primitives';

function ago(at: number): string {
  const s = Math.max(1, Math.round((Date.now() - at) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  return `${Math.floor(s / 3600)} h ago`;
}

/** Bell with a list of recent @mentions and keyword hits. The list lives in memory only. */
export const NotificationCenter: React.FC<{ onOpenConversation: (id: string) => void }> = ({ onOpenConversation }) => {
  const items = useNotificationCenter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = items.filter((i) => !i.read).length;

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
        onClick={() => {
          setOpen((o) => !o);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        className="relative p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5">
            <CountBadge count={unread} mention />
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-11 z-40 w-80 max-h-96 overflow-y-auto floating animate-in zoom-in-95"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
            <span className="text-xs font-bold text-[var(--text-primary)]">Mentions and keywords</span>
            <span className="flex gap-3 text-[11px]">
              <button onClick={markAllNotificationsRead} className="text-[var(--accent-text)] hover:underline">Mark read</button>
              <button onClick={clearNotifications} className="text-[var(--text-muted)] hover:underline">Clear</button>
            </span>
          </div>
          {items.length === 0 ? (
            <p className="p-6 text-center text-xs text-[var(--text-muted)]">
              Nothing yet. When someone mentions you with @ or writes one of your keywords, it shows up here.
            </p>
          ) : (
            <ul>
              {items.map((i) => (
                <li key={i.id}>
                  <button
                    onClick={() => {
                      onOpenConversation(i.conversationId);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--surface-2)] ${i.read ? 'opacity-70' : ''}`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--text-primary)] truncate">{i.title}</span>
                      <span className="text-[10px] text-[var(--text-muted)] shrink-0">{ago(i.at)}</span>
                    </span>
                    <span className="block text-[11px] text-[var(--text-secondary)] line-clamp-2">{i.body}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
