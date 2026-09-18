import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit/rateLimiter';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

function sanitizeFileName(fileName: string): string {
  // Remove directory traversal patterns and non-alphanumeric/safe characters
  return fileName
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\.\.+/g, '.')
    .trim()
    .slice(0, 200);
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const rateLimit = await checkRateLimit(`upload:${ip}`, { limit: 20, windowMs: 60 * 1000 });

  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Upload rate limit exceeded.' }, { status: 429 });
  }

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const conversationId = formData.get('conversationId') as string | null;

    if (!file || !conversationId) {
      return NextResponse.json(
        { error: 'Both "file" and "conversationId" fields are required.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File size exceeds the maximum limit of 25MB (received ${(file.size / (1024 * 1024)).toFixed(1)}MB).` },
        { status: 413 }
      );
    }

    // IDOR Protection: Verify caller is an active member of the conversation
    const { data: membership } = await supabase
      .from('conversation_members')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .is('left_at', null)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden. You are not a member of this conversation.' },
        { status: 403 }
      );
    }

    const safeFileName = sanitizeFileName(file.name);
    const storagePath = `${conversationId}/${Date.now()}_${safeFileName}`;
    const fileBuffer = await file.arrayBuffer();

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('encrypted_attachments')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/octet-stream', // Always stored as encrypted binary payload
        upsert: false,
      });

    if (uploadError || !uploadData) {
      return NextResponse.json(
        { error: uploadError?.message || 'Failed to upload attachment to storage.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        path: uploadData.path,
        fileName: safeFileName,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload processing error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
