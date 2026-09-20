'use client';

import React from 'react';
import { dismissToast, useToasts } from '../../lib/ui/toastStore';
import { IconX } from './icons';

const KIND_STYLES = {
  info: 'border-[var(--border-strong)]',
  success: 'border-emerald-500/40',
  error: 'border-[var(--danger-neutral)]/50',
} as const;

/** Mounted once in the root layout. Announces to screen readers via role="status". */
export const ToastHost: React.FC = () => {
  const toasts = useToasts();
  return (
    <div
      className="fixed z-[90] bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-96 flex flex-col gap-2 pointer-events-none safe-bottom"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.kind === 'error' ? 'alert' : 'status'}
          className={`pointer-events-auto anim-slide-up flex items-start gap-3 rounded-xl border bg-[var(--surface-1)] px-4 py-3 shadow-[var(--shadow-pop)] text-sm text-[var(--text-primary)] ${KIND_STYLES[t.kind]}`}
        >
          <span className="flex-1 break-words">{t.message}</span>
          {t.actionLabel && t.onAction && (
            <button
              onClick={() => {
                t.onAction?.();
                dismissToast(t.id);
              }}
              className="text-xs font-semibold text-[var(--accent-text)] hover:underline"
            >
              {t.actionLabel}
            </button>
          )}
          <button
            onClick={() => dismissToast(t.id)}
            aria-label="Dismiss notification"
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] leading-none"
          >
            <IconX className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
