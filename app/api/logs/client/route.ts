import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { limitByIp, limitByUser, readJson, rejectCrossSite, serverError } from '@/lib/api/security';
import { writeErrorLog } from '@/lib/logging/errorLog';

/**
 * Receives an error that happened in someone's browser and stores it in the admin error log.
 * Signed-in users only, rate limited, size limited. The text is untrusted: it is scrubbed and
 * length-capped before storage and rendered as plain text by the admin page. Never send message
 * content here; the browser only sends the error's own message and the top of its stack.
 */
export async function POST(request: NextRequest) {
  const cross = rejectCrossSite(request);
  if (cross) return cross;
  const limited = await limitByIp(request, 'log-client', { limit: 60, windowMs: 60 * 1000 });
  if (limited) return limited;

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  const userLimited = await limitByUser(user.id, 'log-client', { limit: 20, windowMs: 60 * 1000 });
  if (userLimited) return userLimited;

  const parsed = await readJson(request, 8 * 1024);
  if (!parsed.ok) return parsed.response;
  const { area, message, detail, level, path } = parsed.body;

  const str = (v: unknown, max: number) => (typeof v === 'string' && v.length > 0 && v.length <= max ? v : null);
  const safeArea = str(area, 120);
  const safeMessage = str(message, 2000);
  if (!safeArea || !safeMessage) {
    return NextResponse.json({ error: 'An area and a message are required.' }, { status: 400 });
  }
  if (level !== undefined && level !== 'error' && level !== 'warn') {
    return NextResponse.json({ error: 'level must be "error" or "warn".' }, { status: 400 });
  }
  if (detail !== undefined && detail !== null && (typeof detail !== 'string' || detail.length > 4000)) {
    return NextResponse.json({ error: 'detail is too long.' }, { status: 400 });
  }
  if (path !== undefined && path !== null && (typeof path !== 'string' || path.length > 300)) {
    return NextResponse.json({ error: 'path is too long.' }, { status: 400 });
  }

  try {
    await writeErrorLog({
      source: 'client',
      level: level === 'warn' ? 'warn' : 'error',
      area: safeArea,
      message: safeMessage,
      detail: typeof detail === 'string' ? detail : null,
      userId: user.id,
      path: typeof path === 'string' ? path : null,
      userAgent: request.headers.get('user-agent'),
    });
  } catch (err) {
    return serverError('logs.client', err, 500, 'Could not record the error.', user.id);
  }
  return NextResponse.json({ ok: true }, { status: 202 });
}
