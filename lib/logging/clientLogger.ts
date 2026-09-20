/**
 * Sends browser errors to the admin error log (POST /api/logs/client).
 *
 * Only the error's own message and the top of its stack are sent, never message content, keys or
 * tokens (and the server scrubs again). It is throttled so a broken screen cannot flood the server:
 * at most 10 reports a minute, and the same error is sent at most once a minute.
 */

const MAX_PER_MINUTE = 10;
const DEDUPE_MS = 60_000;

export interface ClientLoggerDeps {
  send: (body: Record<string, unknown>) => void;
  now: () => number;
  path: () => string;
}

const realDeps = (): ClientLoggerDeps => ({
  send: (body) => {
    try {
      void fetch('/api/logs/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // logging must never break the app
    }
  },
  now: () => Date.now(),
  path: () => (typeof location !== 'undefined' ? location.pathname : ''),
});

export class ClientLogger {
  private sentAt: number[] = [];
  private recent = new Map<string, number>();

  constructor(private deps: ClientLoggerDeps = realDeps()) {}

  report(area: string, err: unknown, level: 'error' | 'warn' = 'error'): boolean {
    const message = messageOf(err);
    if (!message) return false;
    const now = this.deps.now();

    const key = `${area}|${message.slice(0, 200)}`;
    const last = this.recent.get(key);
    if (last !== undefined && now - last < DEDUPE_MS) return false;

    this.sentAt = this.sentAt.filter((t) => now - t < 60_000);
    if (this.sentAt.length >= MAX_PER_MINUTE) return false;

    this.sentAt.push(now);
    this.recent.set(key, now);
    if (this.recent.size > 200) this.recent.clear();

    this.deps.send({
      area: area.slice(0, 120),
      message: message.slice(0, 2000),
      detail: stackTop(err),
      level,
      path: this.deps.path(),
    });
    return true;
  }
}

function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') return (err as { message: string }).message;
  return '';
}

function stackTop(err: unknown): string | null {
  if (err instanceof Error && err.stack) return err.stack.split(String.fromCharCode(10)).slice(0, 6).join(String.fromCharCode(10)).slice(0, 4000);
  return null;
}

let logger: ClientLogger | null = null;
let stopListeners: (() => void) | null = null;

/** Reports a handled or unhandled error from anywhere in the browser code. Safe to call before start(). */
export function reportClientError(area: string, err: unknown, level: 'error' | 'warn' = 'error'): void {
  logger?.report(area, err, level);
}

/** Starts reporting (once signed in) and catches errors nobody handled. */
export function startClientLogging(): void {
  if (typeof window === 'undefined' || logger) return;
  logger = new ClientLogger();
  const onError = (e: ErrorEvent) => logger?.report('browser.uncaught', e.error ?? e.message);
  const onRejection = (e: PromiseRejectionEvent) => logger?.report('browser.unhandledrejection', e.reason);
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);
  stopListeners = () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
  };
}

/** Stops reporting (on sign-out). */
export function stopClientLogging(): void {
  stopListeners?.();
  stopListeners = null;
  logger = null;
}
