import React, { useEffect } from 'react';
import { Button } from './button';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footerAction?: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footerAction,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[var(--surface-1)] border border-[var(--border-strong)] p-6 shadow-2xl rounded-2xl flex flex-col gap-5 text-[var(--text-primary)] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)] font-sans">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close modal">
            ✕
          </Button>
        </div>

        <div className="text-sm font-sans">{children}</div>

        <div className="flex items-center justify-end gap-2.5 border-t border-[var(--border-subtle)] pt-4">
          <Button variant="tertiary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          {footerAction}
        </div>
      </div>
    </div>
  );
};
