import { NextRequest, NextResponse, after } from 'next/server';
import { checkRateLimit, type RateLimitOptions } from '../rate-limit/rateLimiter';
import { writeErrorLog } from '../logging/errorLog';

/**
 * Shared request hardening for API routes: who is calling, is the request
 * from our own site, is the body sane, and how to fail without leaking internals.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID_RE.test(v);

/** An ISO-8601 date-time, used for pagination cursors. */
export const isIsoDate = (v: unknown): v is string =>
  typeof v === 'string' && v.length <= 40 && /^\d{4}-\d{2}-\d{2}T[\d:.]+(Z|[+-]\d{2}:?\d{2})$/.test(v) && !Number.isNaN(Date.parse(v));

/**
 * The caller's address, for rate limiting only. A client can put anything in
 * the first X-Forwarded-For entry, so prefer headers a trusted proxy sets and
 * otherwise take the LAST entry (the one our own proxy appended).
 */
export function clientIp(request: Pick<NextRequest, 'headers'>): string {
  const h = request.headers;
  const raw =
    h.get('x-vercel-forwarded-for') ||
    h.get('x-real-ip') ||
    (h.get('x-forwarded-for') || '').split(',').map((s) => s.trim()).filter(Boolean).pop() ||
    '';
  // Anything that is not shaped like an address shares one bucket instead of minting a fresh one per request.
  return /^[0-9a-fA-F:.]{2,45}$/.test(raw) ? raw : 'unknown';
}

const tooManyRequests = () => NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429, headers: { 'Retry-After': '60' } });

/** Rate limits per IP before authentication. Returns a 429 response when exceeded, otherwise null. */
export async function limitByIp(request: NextRequest, bucket: string, options: RateLimitOptions): Promise<NextResponse | null> {
  const r = await checkRateLimit(`${bucket}:ip:${clientIp(request)}`, options);
  return r.success ? null : tooManyRequests();
}

/** Rate limits per signed-in user, so one account cannot spam from many addresses. */
export async function limitByUser(userId: string, bucket: string, options: RateLimitOptions): Promise<NextResponse | null> {
  const r = await checkRateLimit(`${bucket}:user:${userId}`, options);
  return r.success ? null : tooManyRequests();
}

/**
 * Cross-site request forgery guard for methods that change data. Browsers send
 * Origin on cross-site POST/PATCH/DELETE; if it is present it must be this site.
 * (Cookies are also SameSite=Lax; this is a second layer.)
 */
export function rejectCrossSite(request: NextRequest): NextResponse | null {
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') return null;
  const origin = request.headers.get('origin');
  if (!origin) return null;
  let originHost = '';
  try {
    originHost = new URL(origin).host;
  } catch {
    return NextResponse.json({ error: 'Invalid origin.' }, { status: 403 });
  }
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host;
  if (originHost !== host) return NextResponse.json({ error: 'Cross-site requests are not allowed.' }, { status: 403 });
  return null;
}

export type JsonBody = Record<string, unknown>;

/** Reads a small JSON object body. Rejects other types and oversized bodies. */
export async function readJson(request: NextRequest, maxBytes = 64 * 1024): Promise<{ ok: true; body: JsonBody } | { ok: false; response: NextResponse }> {
  const bad = (status: number, error: string) => ({ ok: false as const, response: NextResponse.json({ error }, { status }) });
  const declared = Number(request.headers.get('content-length') || '0');
  if (declared > maxBytes) return bad(413, 'Request body is too large.');
  let text: string;
  try {
    text = await request.text();
  } catch {
    return bad(400, 'Invalid request.');
  }
  if (text.length > maxBytes) return bad(413, 'Request body is too large.');
  try {
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return bad(400, 'Expected a JSON object.');
    return { ok: true, body: parsed as JsonBody };
  } catch {
    return bad(400, 'Invalid JSON.');
  }
}

/**
 * Logs the real error on the server and returns a generic message: database and stack details are never sent
 * to clients. The error is also written to the admin error log (Admin > Errors) after the response is sent,
 * so admins can see it without access to the hosting or database dashboards.
 */
export function serverError(context: string, err: unknown, status = 500, publicMessage = 'Something went wrong. Please try again.', userId?: string): NextResponse {
  const text = err instanceof Error ? err.message : String(err ?? '');
  console.error(`[api] ${context}:`, text);
  const write = () => writeErrorLog({ source: 'server', area: context, message: text || 'Unknown error', detail: err instanceof Error ? err.stack?.split(String.fromCharCode(10)).slice(0, 6).join(String.fromCharCode(10)) : null, userId });
  try {
    after(write);
  } catch {
    // Not inside a request (for example a unit test): write without waiting.
    void write();
  }
  return NextResponse.json({ error: publicMessage }, { status });
}

/** A string within length bounds, or null. */
export function boundedString(v: unknown, min: number, max: number): string | null {
  return typeof v === 'string' && v.length >= min && v.length <= max ? v : null;
}

/** An array of distinct UUID strings within a size limit, or null. */
export function uuidList(v: unknown, max: number): string[] | null {
  if (!Array.isArray(v) || v.length > max) return null;
  if (!v.every(isUuid)) return null;
  return Array.from(new Set(v.map((s) => s.toLowerCase())));
}
