import React, { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm select-none';

  const variantStyles = {
    primary:
      'bg-[var(--text-primary)] text-[var(--accent-contrast)] font-semibold hover:bg-white active:scale-[0.98] shadow-sm',
    secondary:
      'bg-[var(--surface-2)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)] active:scale-[0.98]',
    tertiary:
      'bg-transparent text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)] hover:border-[var(--border-strong)]',
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

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
