import React, { useEffect, useId, useRef } from 'react';
import { Button } from './button';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footerAction?: React.ReactNode;
  /** Hide the default Cancel button (for dialogs with their own actions). */
  hideCancel?: boolean;
}

const FOCUSABLE = 'a[href],button:not([disabled]),textarea,input:not([disabled]),select,[tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal: labelled, traps Tab, closes on Escape / backdrop click,
 * moves focus in on open and back to the trigger on close. On phones it
 * slides up as a bottom sheet.
 */
export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children, footerAction, hideCancel }) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const firstNode = nodes[0];
      const lastNode = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === firstNode) {
        e.preventDefault();
        lastNode.focus();
      } else if (!e.shiftKey && document.activeElement === lastNode) {
        e.preventDefault();
        firstNode.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      returnFocusRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 animate-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto floating p-6 !rounded-b-none sm:!rounded-b-[var(--radius-card)] flex flex-col gap-5 text-[var(--text-primary)] animate-in slide-in-from-bottom sm:zoom-in-95 safe-bottom outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
          <h2 id={titleId} className="text-base font-semibold text-[var(--text-primary)] font-sans">
            {title}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close dialog">
            ✕
          </Button>
        </div>

        <div className="text-sm font-sans">{children}</div>

        {(footerAction || !hideCancel) && (
          <div className="flex items-center justify-end gap-2.5 border-t border-[var(--border-subtle)] pt-4">
            {!hideCancel && (
              <Button variant="tertiary" size="sm" onClick={onClose}>
                Cancel
              </Button>
            )}
            {footerAction}
          </div>
        )}
      </div>
    </div>
  );
};
