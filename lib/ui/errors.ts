/**
 * Who sees how much of an error.
 *
 * People using the app get a short, friendly message. Only platform admins also get the technical
 * detail (database messages, migration hints, exception text), because that detail can reveal how
 * the system is built and means nothing to most people.
 *
 * This is a display rule, not an access control: the server already returns generic errors
 * (lib/api/security.ts), but calls the browser makes straight to Supabase carry the database's own
 * message, which a determined person can still read in their browser's network tab. Real
 * protection lives in the database rules ([Security](docs/SECURITY.md)); this keeps the interface
 * from showing internals to people who cannot act on them.
 */

export const GENERIC_ERROR = 'Something went wrong. Please try again in a moment.';

/** An error whose message was written for the person using the app. It is shown to everyone. */
export class UserMessageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserMessageError';
  }
}

let viewerIsAdmin = false;

/** Set once the signed-in profile is known (true for platform admins); reset on sign-out. */
export function setErrorViewer(isAdmin: boolean): void {
  viewerIsAdmin = isAdmin;
}

type ErrorReporter = (err: unknown, friendly: string) => void;
let reporter: ErrorReporter | null = null;

/** Registers where handled errors are sent for the admin error log (set once signed in, cleared on sign-out). */
export function setErrorReporter(fn: ErrorReporter | null): void {
  reporter = fn;
}

export function canSeeErrorDetail(): boolean {
  return viewerIsAdmin;
}

/** Pulls the technical text out of whatever was thrown (Error, Supabase error object, string). */
export function errorDetail(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return '';
}

const MAX_DETAIL = 300;

/**
 * The message to show for a failure. Everyone gets `friendly`; admins also get the technical detail
 * after it. A `UserMessageError` is already written for people and is shown as is.
 */
export function userError(err: unknown, friendly: string = GENERIC_ERROR): string {
  if (err instanceof UserMessageError) return err.message;
  // Every handled error passes through here, so this is the one place they reach the admin error log.
  try {
    reporter?.(err, friendly);
  } catch {
    // reporting must never break the interface
  }
  if (!viewerIsAdmin) return friendly;
  const detail = errorDetail(err).trim().slice(0, MAX_DETAIL);
  return detail && detail !== friendly ? `${friendly} [Admin detail: ${detail}]` : friendly;
}

/** Short technical reason for an inline note (for example why a message could not be decrypted). */
export function adminDetail(err: unknown, fallback: string): string {
  if (!viewerIsAdmin) return fallback;
  return errorDetail(err).trim().slice(0, MAX_DETAIL) || fallback;
}

/** A fixed technical note (such as "needs migration 015") that only admins should read. */
export function technicalNote(detail: string, generic: string): string {
  return viewerIsAdmin ? `${generic} [Admin detail: ${detail}]` : generic;
}
