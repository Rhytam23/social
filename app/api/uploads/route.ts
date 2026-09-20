import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { isUuid, limitByIp, limitByUser, rejectCrossSite, sanitizeFileName, serverError } from '@/lib/api/security';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
// Multipart framing adds a little to the file itself.
const MAX_REQUEST_BYTES = MAX_FILE_SIZE_BYTES + 64 * 1024;

export async function POST(request: NextRequest) {
  const cross = rejectCrossSite(request);
  if (cross) return cross;
  const limited = await limitByIp(request, 'upload', { limit: 40, windowMs: 60 * 1000 });
  if (limited) return limited;

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  const userLimited = await limitByUser(user.id, 'upload', { limit: 20, windowMs: 60 * 1000 });
  if (userLimited) return userLimited;

  // Refuse oversized bodies before reading them into memory.
  const declared = Number(request.headers.get('content-length') || '0');
  if (declared > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: 'File size exceeds the maximum limit of 25MB.' }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid upload.' }, { status: 400 });
  }
  const file = formData.get('file');
  const conversationId = formData.get('conversationId');

  if (!(file instanceof Blob) || !isUuid(conversationId)) {
    return NextResponse.json({ error: 'A "file" and a valid "conversationId" are required.' }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: 'Files must be between 1 byte and 25MB.' }, { status: 413 });
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

  const rawName = (file as File).name || 'file';
  const safeFileName = sanitizeFileName(rawName);
  // A random component: paths cannot be guessed or overwritten.
  const storagePath = `${conversationId.toLowerCase()}/${crypto.randomUUID()}_${safeFileName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('encrypted_attachments')
    .upload(storagePath, await file.arrayBuffer(), {
      contentType: 'application/octet-stream', // always stored as an opaque encrypted payload, never as a renderable type
      upsert: false,
    });
  if (uploadError || !uploadData) return serverError('uploads.store', uploadError);

  return NextResponse.json(
    { path: uploadData.path, fileName: safeFileName, fileSize: file.size, uploadedAt: new Date().toISOString() },
    { status: 201 }
  );
}
