'use client';

import React, { useEffect, useRef, useState } from 'react';

const DAY = 86400;
const OPTIONS: { label: string; seconds: number | null }[] = [
  { label: 'Off', seconds: null },
  { label: '24 hours', seconds: DAY },
  { label: '7 days', seconds: 7 * DAY },
  { label: '90 days', seconds: 90 * DAY },
];

function disappearLabel(seconds?: number): string {
  if (!seconds) return 'Off';
  const match = OPTIONS.find((o) => o.seconds === seconds);
  if (match) return match.label;
  return seconds >= DAY ? `${Math.round(seconds / DAY)} days` : `${Math.round(seconds / 3600)} hours`;
}

/** Header menu to choose how long new messages in a conversation last. */
export const DisappearMenu: React.FC<{ current?: number; onChange: (seconds: number | null) => void }> = ({ current, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const on = !!current;

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
        aria-label={`Disappearing messages: ${disappearLabel(current)}`}
        title={`Disappearing messages: ${disappearLabel(current)}`}
        className={`p-2 rounded-xl transition-colors hover:bg-slate-800 ${on ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-100'}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-11 z-40 w-60 p-1.5 floating animate-in zoom-in-95">
          <p className="px-3 py-1.5 text-[10px] text-[var(--text-muted)] leading-relaxed">
            New messages are deleted for everyone after this time. Messages already sent are not changed.
          </p>
          {OPTIONS.map((o) => (
            <button
              key={o.label}
              role="menuitemradio"
              aria-checked={(current ?? null) === o.seconds}
              onClick={() => {
                onChange(o.seconds);
                setOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
            >
              {o.label}
              {(current ?? null) === o.seconds && <span className="text-[var(--accent-text)]">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
