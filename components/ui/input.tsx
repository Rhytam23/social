import React, { InputHTMLAttributes, useId } from 'react';

interface FieldProps {
  label?: string;
  error?: string;
  helperText?: string;
}

const Wrapper: React.FC<FieldProps & { htmlFor: string; children: React.ReactNode }> = ({ label, error, helperText, htmlFor, children }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && (
      <label htmlFor={htmlFor} className="text-xs font-medium text-[var(--text-secondary)]">
        {label}
      </label>
    )}
    {children}
    {error && (
      <span role="alert" className="text-xs text-[var(--danger-neutral)]">
        {error}
      </span>
    )}
    {helperText && !error && <span className="text-xs text-[var(--text-muted)]">{helperText}</span>}
  </div>
);

export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldProps {}

export const Input: React.FC<InputProps> = ({ label, error, helperText, className = '', id, ...props }) => {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <Wrapper label={label} error={error} helperText={helperText} htmlFor={inputId}>
      <input id={inputId} aria-invalid={error ? true : undefined} className={`field ${className}`} {...props} />
    </Wrapper>
  );
};
