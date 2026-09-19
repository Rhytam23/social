import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Landing route for Supabase email links (signup confirmation and password
 * recovery). Supports both link styles: `?code=` (PKCE, the default
 * {{ .ConfirmationURL }} email template) and `?token_hash=&type=` (custom
 * {{ .TokenHash }} template). Failures redirect to /login?error=<reason>.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const rawNext = searchParams.get('next') || '/';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/';

  // OAuth sign-ins (Google) pass provider=<name> in redirectTo so failures can
  // be reported as sign-in problems rather than email-confirmation problems.
  const isOAuth = searchParams.has('provider');
  const failure = isOAuth ? 'oauth_failed' : 'confirmation_failed';

  const linkError = searchParams.get('error');
  const linkErrorCode = searchParams.get('error_code');
  if (linkError || linkErrorCode) {
    let reason = failure;
    if (linkErrorCode === 'otp_expired') reason = 'link_expired';
    else if (isOAuth && linkError === 'access_denied') reason = 'oauth_cancelled';
    return NextResponse.redirect(`${origin}/login?error=${reason}`);
  }

  if (code || (token_hash && type)) {
    const supabase = await createServerClient();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ type: type as EmailOtpType, token_hash: token_hash as string });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=${failure}`);
}
