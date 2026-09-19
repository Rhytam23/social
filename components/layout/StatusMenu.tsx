'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Avatar, PRESENCE_COLOR } from '../ui/avatar';
import { updatePreferences, usePreferences, type StatusChoice } from '../../lib/prefs/preferences';

const OPTIONS: { value: StatusChoice; label: string; hint: string; color: string }[] = [
  { value: 'auto', label: 'Active', hint: 'Away after 5 minutes idle', color: PRESENCE_COLOR.online },
  { value: 'dnd', label: 'Do not disturb', hint: 'Mutes notifications', color: PRESENCE_COLOR.dnd },
  { value: 'away', label: 'Away', hint: 'Show as away', color: PRESENCE_COLOR.away },
  { value: 'meeting', label: 'In a meeting', hint: 'Mutes notifications', color: PRESENCE_COLOR.meeting },
  { value: 'invisible', label: 'Appear offline', hint: 'Others see you as offline', color: PRESENCE_COLOR.offline },
];

/** Avatar button that opens the status picker (Active, Do not disturb, Away, In a meeting, Offline). */
export const StatusMenu: React.FC<{ name: string; avatarUrl?: string; onChanged?: () => void }> = ({ name, avatarUrl, onChanged }) => {
  const [open, setOpen] = useState(false);
  const prefs = usePreferences();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent) {
        if (e.key === 'Escape') setOpen(false);
      } else if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const current = OPTIONS.find((o) => o.value === prefs.status.choice) ?? OPTIONS[0];

  const choose = (value: StatusChoice) => {
    updatePreferences((d) => ({ ...d, status: { ...d.status, choice: value } }));
    setOpen(false);
    onChanged?.();
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Your status: ${current.label}. Change status`}
        className="relative rounded-full"
      >
        <Avatar name={name} src={avatarUrl} size="sm" />
        <span
          aria-hidden="true"
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-[var(--surface-1)]"
          style={{ background: current.color }}
        />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Set your status"
          className="absolute left-0 top-11 z-40 w-64 p-1.5 bg-[var(--surface-1)] border border-[var(--border-strong)] rounded-2xl shadow-[var(--shadow-pop)] animate-in zoom-in-95"
        >
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              role="menuitemradio"
              aria-checked={o.value === current.value}
              onClick={() => choose(o.value)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-[var(--surface-2)]"
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: o.color }} />
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-semibold text-[var(--text-primary)]">{o.label}</span>
                <span className="block text-[10px] text-[var(--text-muted)]">{o.hint}</span>
              </span>
              {o.value === current.value && <span className="text-[var(--accent-text)] text-xs">✓</span>}
            </button>
          ))}
          <div className="border-t border-[var(--border-subtle)] mt-1 pt-2 px-2 pb-1">
            <label htmlFor="status-text" className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
              Status message
            </label>
            <input
              id="status-text"
              type="text"
              maxLength={60}
              value={prefs.status.text}
              placeholder="What are you up to?"
              onChange={(e) => updatePreferences((d) => ({ ...d, status: { ...d.status, text: e.target.value } }))}
              onBlur={() => onChanged?.()}
              className="mt-1 w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/60"
            />
          </div>
        </div>
      )}
    </div>
  );
};
