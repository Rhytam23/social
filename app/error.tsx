'use client';

import { useEffect } from 'react';
import { reportClientError } from '../lib/logging/clientLogger';

/**
 * Shown when a screen crashes while rendering. It used to render nothing (a blank page). People get a
 * plain message and a way to recover; the crash is sent to the admin error log for the admins.
 */
export default function Error(props: { error: Error & { digest?: string }; reset: () => void }) {
  const { error, reset } = props;

  useEffect(() => {
    reportClientError('react.render', error);
  }, [error]);

  return (
    <div role="alert" className="min-h-screen w-full bg-[var(--canvas-bg)] flex items-center justify-center p-6 font-sans">
      <div className="max-w-sm w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl p-6 flex flex-col gap-3 text-center">
        <h1 className="text-base font-semibold text-[var(--text-primary)]">Something went wrong</h1>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          This screen could not be shown. Try again, and if it keeps happening please tell an administrator.
        </p>
        <button
          type="button"
          onClick={reset}
          className="pressable inline-flex items-center justify-center h-9 px-4 rounded-lg text-sm font-semibold bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:bg-[var(--accent-primary-hover)]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
