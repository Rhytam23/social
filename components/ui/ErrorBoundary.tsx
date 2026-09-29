'use client';

import React from 'react';
import { reportClientError } from '../../lib/logging/clientLogger';

interface Props {
  /** Changing this value (for example the open chat's id) clears a previous failure. */
  resetKey?: string;
  label: string;
  children: React.ReactNode;
}

interface State {
  failed: boolean;
  resetKey?: string;
}

/**
 * One broken message or panel must not blank the whole app. Shows a calm notice with a retry button, and
 * sends the technical detail to the admin error log (never to the screen).
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { failed: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey !== state.resetKey) return { failed: false, resetKey: props.resetKey };
    return null;
  }

  componentDidCatch(error: unknown): void {
    try {
      reportClientError(`ui: ${this.props.label}`, error);
    } catch {
      // logging must never make things worse
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center font-sans">
        <p className="text-sm text-[var(--text-secondary)] max-w-xs">Something went wrong showing this. Your messages are safe.</p>
        <button
          type="button"
          onClick={() => this.setState({ failed: false })}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent-primary)] text-[var(--accent-contrast)]"
        >
          Try again
        </button>
      </div>
    );
  }
}
