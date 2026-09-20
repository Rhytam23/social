import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isUuid, limitByIp, limitByUser, readJson, rejectCrossSite, serverError } from '@/lib/api/security';
import { isUploadKind, maxUploadBytes, uploadLimitMessage } from '@/lib/limits';

const BUCKET = 'encrypted_attachments';

/**
 * POST /api/uploads/complete  { path, kind }
 *
 * Called after the browser has uploaded to a signed address. Checks that the object is really there, that
 * it belongs to the caller, and that its real size is within the limit for its kind. An oversized object is
 * deleted, so a client that lied about the size in /sign gains nothing and stores nothing.
 */
export async function POST(request: NextRequest) {
  const cross = rejectCrossSite(request);
  if (cross) return cross;
  const limited = await limitByIp(request, 'upload-complete', { limit: 120, windowMs: 60 * 1000 });
  if (limited) return limited;

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  const perUser = await limitByUser(user.id, 'upload-complete', { limit: 120, windowMs: 60 * 60 * 1000 });
  if (perUser) return perUser;

  const parsed = await readJson(request, 2 * 1024);
  if (!parsed.ok) return parsed.response;
  const { path, kind } = parsed.body;
  if (typeof path !== 'string' || !isUploadKind(kind)) {
    return NextResponse.json({ error: 'A path and a kind are required.' }, { status: 400 });
  }

  // The path is one we issued: <conversation>/<your user id>_<random>. Nothing else is accepted.
  const [conversationId, objectName, ...extra] = path.split('/');
  const [ownerId, randomPart] = (objectName ?? '').split('_');
  if (extra.length > 0 || !isUuid(conversationId) || ownerId?.toLowerCase() !== user.id.toLowerCase() || !isUuid(randomPart)) {
    return NextResponse.json({ error: 'Invalid upload path.' }, { status: 400 });
  }

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
  const { data: found, error: listError } = await admin.storage.from(BUCKET).list(conversationId, { limit: 5, search: objectName });
  if (listError) return serverError('uploads.complete.list', listError, 500, undefined, user.id);
  const object = (found ?? []).find((o) => o.name === objectName);
  if (!object) return NextResponse.json({ error: 'The upload was not found. Please try again.' }, { status: 404 });

  const size = Number((object.metadata as { size?: number } | null)?.size ?? 0);
  if (size < 1 || size > maxUploadBytes(kind)) {
    await admin.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ error: uploadLimitMessage(kind, size) }, { status: 413 });
  }

  return NextResponse.json({ path, size }, { headers: { 'Cache-Control': 'no-store' } });
}
