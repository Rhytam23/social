import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isUuid, limitByIp, limitByUser, readJson, rejectCrossSite, serverError } from '@/lib/api/security';
import { MB, UPLOAD_LIMITS, isUploadKind, maxUploadBytes, uploadLimitMessage } from '@/lib/limits';

/**
 * POST /api/uploads/sign  { conversationId, kind: 'image' | 'video' | 'file', size }
 *
 * Decides whether this person may upload this file now, and if so hands back a one-file signed upload
 * address. The browser then sends the (already encrypted) bytes straight to Storage, so the file never
 * passes through this server (serverless functions cannot take bodies over 4.5 MB). Clients cannot upload
 * to the attachments bucket any other way (migration 021 removes the direct upload policy), so every
 * limit here is enforced, not advisory. Files are encrypted, so the kind is what the client says it is;
 * the deployment-wide ceiling (bucket limit) is what bounds a dishonest client.
 */
export async function POST(request: NextRequest) {
  const cross = rejectCrossSite(request);
  if (cross) return cross;
  const limited = await limitByIp(request, 'upload-sign', { limit: 60, windowMs: 60 * 1000 });
  if (limited) return limited;

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  // Two windows: a burst of starts, and steady use over an hour. (The server cannot see how many
  // uploads are still running, so this is what keeps "many at once" bounded.)
  const burst = await limitByUser(user.id, 'upload-sign-minute', { limit: UPLOAD_LIMITS.perMinute, windowMs: 60 * 1000 });
  if (burst) return burst;
  const hourly = await limitByUser(user.id, 'upload-sign-hour', { limit: UPLOAD_LIMITS.perHour, windowMs: 60 * 60 * 1000 });
  if (hourly) return hourly;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return serverError('uploads.sign.config', new Error('SUPABASE_SERVICE_ROLE_KEY is not set'), 503, 'Uploads are not available right now.', user.id);
  }

  const parsed = await readJson(request, 2 * 1024);
  if (!parsed.ok) return parsed.response;
  const { conversationId, kind, size } = parsed.body;
  if (!isUuid(conversationId) || !isUploadKind(kind) || typeof size !== 'number' || !Number.isInteger(size) || size < 1) {
    return NextResponse.json({ error: 'A conversationId, a kind (image, video or file) and a size in bytes are required.' }, { status: 400 });
  }
  if (size > maxUploadBytes(kind)) {
    return NextResponse.json({ error: uploadLimitMessage(kind, size) }, { status: 413 });
  }

  // IDOR protection: the caller must be an active member of the conversation.
  const { data: membership } = await supabase
    .from('conversation_members')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .is('left_at', null)
    .maybeSingle();
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden. You are not a member of this conversation.' }, { status: 403 });
  }

  const admin = createAdminClient();

  // Daily quota. The function comes with migration 021; until then the rate limits above still apply.
  const untyped = admin as unknown as {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: number | string | null; error: { message?: string } | null }>;
  };
  const used = await untyped.rpc('uploaded_bytes_last_day', { p_user: user.id });
  if (!used.error && used.data !== null && Number(used.data) + size > UPLOAD_LIMITS.dailyMb * MB) {
    return NextResponse.json({ error: `You have reached the daily upload limit of ${UPLOAD_LIMITS.dailyMb} MB. Try again tomorrow.` }, { status: 429 });
  }

  // The name is opaque: the real file name lives inside the encrypted message, never here.
  const path = `${conversationId.toLowerCase()}/${user.id}_${crypto.randomUUID()}`;
  const { data, error } = await admin.storage.from('encrypted_attachments').createSignedUploadUrl(path);
  if (error || !data) return serverError('uploads.sign', error, 500, 'Could not start the upload. Please try again.', user.id);

  return NextResponse.json({ path: data.path, token: data.token }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
