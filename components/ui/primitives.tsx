import React from 'react';
import { Button } from './button';

/* ---------- Badge ---------- */
const BADGE_TONES = {
  neutral: 'bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border-subtle)]',
  accent: 'bg-[var(--accent-subtle)] text-[var(--accent-text)] border-emerald-500/30',
  danger: 'bg-[var(--danger-subtle)] text-[var(--danger-neutral)] border-[var(--danger-neutral)]/30',
  warning: 'bg-amber-500/10 text-[var(--warning)] border-amber-500/30',
} as const;

export const Badge: React.FC<{ tone?: keyof typeof BADGE_TONES; children: React.ReactNode; className?: string }> = ({
  tone = 'neutral',
  children,
  className = '',
}) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wide ${BADGE_TONES[tone]} ${className}`}>
    {children}
  </span>
);

/** Unread / mention count chip. Renders nothing for 0. */
export const CountBadge: React.FC<{ count: number; mention?: boolean }> = ({ count, mention }) =>
  count > 0 ? (
    <span
      className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
        mention ? 'bg-[var(--danger-neutral)] text-white' : 'bg-[var(--accent-primary)] text-[var(--accent-contrast)]'
      }`}
      aria-label={`${count} unread`}
    >
      {count > 99 ? '99+' : count}
    </span>
  ) : null;

/* ---------- Switch ---------- */
export const Switch: React.FC<{
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}> = ({ checked, onChange, label, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative w-10 h-6 rounded-full transition-colors duration-150 shrink-0 disabled:opacity-40 ${
      checked ? 'bg-[var(--accent-primary)]' : 'bg-[var(--surface-hover)]'
    }`}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-150 ${
        checked ? 'translate-x-4' : ''
      }`}
    />
  </button>
);

/** A labelled settings row with a description and a control on the right. */
export const SettingRow: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({
  title,
  description,
  children,
}) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b border-[var(--border-subtle)] last:border-0">
    <div className="min-w-0">
      <p className="text-sm font-medium text-[var(--text-primary)]">{title}</p>
      {description && <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{description}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

/* ---------- Skeleton / states ---------- */
export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => (
  <div className={`skeleton ${className}`} aria-hidden="true" />
);

export const ConversationListSkeleton: React.FC = () => (
  <div className="flex flex-col gap-1 p-2" role="status" aria-label="Loading conversations">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-2 py-3">
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </div>
    ))}
  </div>
);

export const MessageListSkeleton: React.FC = () => (
  <div className="flex flex-col gap-4 p-6" role="status" aria-label="Loading messages">
    {[60, 40, 70, 30].map((w, i) => (
      <div key={i} className={`flex ${i % 2 ? 'justify-end' : ''}`}>
        <div className="skeleton h-10 rounded-2xl" style={{ width: `${w}%` }} />
      </div>
    ))}
  </div>
);

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ icon, title, description, actionLabel, onAction }) => (
  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-3">
    {icon && (
      <div className="w-14 h-14 rounded-2xl bg-[var(--accent-subtle)] border border-emerald-500/25 flex items-center justify-center text-[var(--accent-text)]">
        {icon}
      </div>
    )}
    <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
    {description && <p className="text-xs text-[var(--text-secondary)] max-w-xs leading-relaxed">{description}</p>}
    {actionLabel && onAction && (
      <Button variant="primary" size="sm" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </div>
);

export const ErrorState: React.FC<{ title?: string; message: string; onRetry?: () => void }> = ({
  title = 'Something went wrong',
  message,
  onRetry,
}) => (
  <div role="alert" className="flex flex-col items-center justify-center text-center p-8 gap-3">
    <div className="w-12 h-12 rounded-2xl bg-[var(--danger-subtle)] border border-[var(--danger-neutral)]/30 flex items-center justify-center text-[var(--danger-neutral)] font-bold">
      !
    </div>
    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
    <p className="text-xs text-[var(--text-secondary)] max-w-sm break-words">{message}</p>
    {onRetry && (
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Try again
      </Button>
    )}
  </div>
);

export const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="px-1.5 py-0.5 rounded-md bg-[var(--surface-2)] border border-[var(--border-strong)] text-[10px] font-mono text-[var(--text-secondary)]">
    {children}
  </kbd>
);

/** Three bouncing dots, used for typing indicators. */
export const TypingDots: React.FC = () => (
  <span className="inline-flex items-center gap-1" aria-hidden="true">
    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
  </span>
);
