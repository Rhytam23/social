import React, { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  /** Shows a spinner and disables the button while an action runs. */
  loading?: boolean;
}

/** The one button. Every clickable action in the product is a variant of this. */
export const VARIANT_STYLES = {
  primary:
    'bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.22),var(--shadow-1)] hover:bg-[var(--accent-primary-hover)]',
  secondary:
    'bg-[var(--surface-2)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-[var(--edge-light)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)]',
  tertiary:
    'bg-transparent text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)]',
  danger:
    'bg-[var(--danger-subtle)] text-[var(--danger-neutral)] border border-[var(--danger-neutral)]/25 hover:bg-[var(--danger-neutral)] hover:text-white',
  ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]',
} as const;

export const SIZE_STYLES = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2.5',
} as const;

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  fullWidth = false,
  loading = false,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => (
  <button
    type={type}
    className={`pressable inline-flex items-center justify-center whitespace-nowrap font-medium rounded-lg select-none disabled:opacity-40 disabled:cursor-not-allowed ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    {...props}
  >
    {loading && (
      <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden="true" />
    )}
    {children}
  </button>
);

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: icon-only buttons need an accessible name. */
  label: string;
  size?: 'sm' | 'md';
  active?: boolean;
}

/** Square icon-only button (toolbars, headers). Shows its label as a tooltip. */
export const IconButton: React.FC<IconButtonProps> = ({ label, size = 'md', active, className = '', type = 'button', children, ...props }) => (
  <button
    type={type}
    aria-label={label}
    title={label}
    className={`pressable inline-flex items-center justify-center rounded-lg disabled:opacity-40 disabled:cursor-not-allowed ${
      size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'
    } ${
      active
        ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)]'
        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]'
    } ${className}`}
    {...props}
  >
    {children}
  </button>
);
