import { createAdminClient } from '../supabase/admin';
import { isSupabaseConfigured } from '../supabase/env';
import { normalizeForFingerprint, scrubPath, scrubText } from './scrub';

/**
 * Server-side writer for the admin error log (table `error_logs`, migration 019).
 *
 * Uses the service-role client because clients cannot write to the log. It must never throw or
 * log through `serverError` (that would loop): a failure to log is a console warning only.
 */

export interface ErrorLogEntry {
  source: 'server' | 'client';
  level?: 'error' | 'warn';
  /** Where it happened, for example `api.messages.send` or `store.sendMessage`. */
  area: string;
  message: string;
  /** Optional technical detail, such as the first lines of a stack. */
  detail?: string | null;
  userId?: string | null;
  path?: string | null;
  userAgent?: string | null;
}

/** Two entries with the same fingerprint are the same problem and share one row. */
export async function fingerprintOf(source: string, area: string, message: string): Promise<string> {
  // Web Crypto (not node:crypto) so this module also loads in the Edge runtime that middleware uses.
  const bytes = new TextEncoder().encode(`${source}|${area}|${normalizeForFingerprint(message)}`);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function writeErrorLog(entry: ErrorLogEntry): Promise<void> {
  try {
    if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
    const area = scrubText(entry.area, 120) || 'unknown';
    const message = scrubText(entry.message, 500);
    const admin = createAdminClient();
    const { error } = await admin.rpc('log_error' as never, {
      p_source: entry.source,
      p_level: entry.level ?? 'error',
      p_area: area,
      p_message: message,
      p_detail: entry.detail ? scrubText(entry.detail, 2000) : null,
      p_fingerprint: await fingerprintOf(entry.source, area, message),
      p_user_id: entry.userId ?? null,
      p_path: entry.path ? scrubPath(entry.path) : null,
      p_user_agent: entry.userAgent ? scrubText(entry.userAgent, 200) : null,
      p_release: (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 12) || null,
    } as never);
    if (error) console.warn('[error-log] could not store an error entry:', error.message);
  } catch (e) {
    console.warn('[error-log] could not store an error entry:', e instanceof Error ? e.message : e);
  }
}

/** Writes an entry to the admin activity log (`admin_audit_log`). Never throws. */
export async function writeAdminAction(actorId: string, action: string, targetType: string, targetId: string, detail?: string): Promise<void> {
  try {
    if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
    const admin = createAdminClient();
    const { error } = await admin.rpc('log_admin_action' as never, {
      p_actor: actorId,
      p_action: action,
      p_target_type: targetType,
      p_target_id: targetId,
      p_detail: detail ? scrubText(detail, 500) : null,
    } as never);
    if (error) console.warn('[error-log] could not store an admin action:', error.message);
  } catch (e) {
    console.warn('[error-log] could not store an admin action:', e instanceof Error ? e.message : e);
  }
}
