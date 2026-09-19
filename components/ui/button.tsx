import React, { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  /** Shows a spinner and disables the button while an action runs. */
  loading?: boolean;
}

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
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm select-none';

  const variantStyles = {
    primary:
      'bg-[var(--accent-primary)] text-[var(--accent-contrast)] font-semibold hover:bg-[var(--accent-primary-hover)] active:scale-[0.98] shadow-sm',
    secondary:
      'bg-[var(--surface-2)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)] active:scale-[0.98]',
    tertiary:
      'bg-transparent text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)]',
    danger:
      'bg-[var(--danger-subtle)] text-[var(--danger-neutral)] border border-[var(--danger-neutral)]/20 hover:bg-[var(--danger-neutral)] hover:text-white',
    ghost:
      'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <span
          className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
};
