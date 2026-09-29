import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { boundedString, limitByIp, limitByUser, readJson, rejectCrossSite, serverError } from '@/lib/api/security';
import { SUPPORT_TOPICS, isSupportTopic } from '@/lib/support';

// Loose on purpose: real validation is the confirmation you get when someone answers. This only
// refuses obvious junk and anything that could break a header or a mailto link.
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

// Control characters (except tab and newline) are never legitimate in a support message.
const stripControls = (s: string) => Array.from(s).filter((ch) => ch === '\n' || ch === '\t' || ch.charCodeAt(0) >= 32).join('');

/**
 * POST /api/support  { name?, email, topic, message, website }
 *
 * The contact form and "Report a problem". Works without an account (people who cannot sign in need it
 * most). Signed-in requests use the account's own email and id, ignoring what the body says. `website` is a
 * honeypot field that real people never see: filled in means a bot, which gets a success reply and nothing
 * is stored. Admins read the requests in Admin, Support.
 */
export async function POST(request: NextRequest) {
  const cross = rejectCrossSite(request);
  if (cross) return cross;
  const limited = await limitByIp(request, 'support', { limit: 5, windowMs: 10 * 60 * 1000 });
  if (limited) return limited;

  const parsed = await readJson(request, 8 * 1024);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  if (typeof body.website === 'string' && body.website.length > 0) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const perUser = await limitByUser(user.id, 'support', { limit: 10, windowMs: 60 * 60 * 1000 });
    if (perUser) return perUser;
  }

  const topic = body.topic;
  const message = boundedString(typeof body.message === 'string' ? stripControls(body.message).trim() : null, 10, 2000);
  const name = typeof body.name === 'string' ? stripControls(body.name).trim().slice(0, 80) : '';
  const email = user?.email ?? (typeof body.email === 'string' ? body.email.trim() : '');
  if (!isSupportTopic(topic) || !message) {
    return NextResponse.json({ error: `Choose a topic (${SUPPORT_TOPICS.join(', ')}) and write a message of 10 to 2000 characters.` }, { status: 400 });
  }
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Enter an email address we can reply to.' }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return serverError('support.config', new Error('SUPABASE_SERVICE_ROLE_KEY is not set'), 503, 'Support requests are not available right now. Please email us instead.', user?.id);
  }

  const context = [request.headers.get('referer') ? `From: ${new URL(request.headers.get('referer') as string, 'http://x').pathname}` : '', `Browser: ${(request.headers.get('user-agent') ?? '').slice(0, 200)}`]
    .filter(Boolean)
    .join('\n');

  const untyped = createAdminClient() as unknown as {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>;
  };
  const { error } = await untyped.rpc('submit_support_request', {
    p_user_id: user?.id ?? null,
    p_name: name || null,
    p_email: email,
    p_topic: topic,
    p_message: message,
    p_context: context,
  });
  if (error) {
    if (error.message?.includes('too_many_requests')) {
      return NextResponse.json({ error: 'You have sent several messages today already. We will get back to you.' }, { status: 429 });
    }
    return serverError('support.submit', error, 500, 'Could not send your message. Please try again, or email us.', user?.id);
  }

  return NextResponse.json({ ok: true }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
