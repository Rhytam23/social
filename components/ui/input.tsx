import React, { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-[var(--text-secondary)]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full bg-[var(--surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)] px-3.5 py-2.5 text-sm rounded-lg placeholder:[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] focus:ring-1 focus:ring-slate-400/30 transition-all ${
          error ? 'border-[var(--danger-neutral)]' : ''
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-[var(--danger-neutral)] font-medium">{error}</span>}
      {helperText && !error && <span className="text-xs text-[var(--text-muted)]">{helperText}</span>}
    </div>
  );
};

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  className = '',
  id,
  rows = 3,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-[var(--text-secondary)]">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        className={`w-full bg-[var(--surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)] p-3 text-sm rounded-lg placeholder:[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] focus:ring-1 focus:ring-slate-400/30 transition-all resize-none ${
          error ? 'border-[var(--danger-neutral)]' : ''
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-[var(--danger-neutral)] font-medium">{error}</span>}
    </div>
  );
};
