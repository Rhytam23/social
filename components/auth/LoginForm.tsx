'use client';

import React, { useEffect, useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { createClient } from '../../lib/supabase/client';
import { getChatStore } from '../../lib/store/chatStore';
import { isSupabaseConfigured as checkSupabaseConfigured } from '../../lib/supabase/env';
import { IconCheck, IconLock } from '../ui/icons';

import Link from 'next/link';

export interface LoginFormProps {
  initialTab?: 'signin' | 'signup';
  onLoginSuccess?: (email: string) => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_SECONDS = 60;

const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'letter', label: 'At least one letter', test: (p: string) => /[A-Za-z]/.test(p) },
  { id: 'number', label: 'At least one number', test: (p: string) => /\d/.test(p) },
];

type Field = 'displayName' | 'email' | 'password' | 'confirmPassword';

const INPUT_CLASS =
  'w-full bg-slate-950/70 border p-2.5 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-700';

export const LoginForm: React.FC<LoginFormProps> = ({
  initialTab = 'signin',
  onLoginSuccess,
}) => {
  const [tab, setTab] = useState<'signin' | 'signup'>(initialTab);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAlreadyRegistered, setShowAlreadyRegistered] = useState(false);

  // Set once Supabase has (or should have) sent a confirmation email.
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingReason, setPendingReason] = useState<'signup' | 'unconfirmed'>('signup');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendResult, setResendResult] = useState<{ ok: boolean; text: string } | null>(null);

  const isSupabaseConfigured = checkSupabaseConfigured();

  // Surface failures from the /auth/confirm redirect (?error=...).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get('error');
    // Provider/Supabase explanation passed by /auth/confirm; shown as plain text only.
    const detail = params.get('detail')?.replace(/\s+/g, ' ').trim().slice(0, 160);
    const withDetail = (message: string) => (detail ? `${message} (Reason: ${detail})` : message);
    if (reason === 'link_expired') {
      setErrorMsg('That confirmation link has expired. Sign in with your email and password to get a new one.');
    } else if (reason === 'confirmation_failed') {
      setErrorMsg(
        withDetail(
          "We couldn't complete email confirmation from that link. If you already used it, your email may be confirmed - try signing in."
        )
      );
    } else if (reason === 'oauth_cancelled') {
      setErrorMsg('Google sign-in was cancelled. Please try again.');
    } else if (reason === 'oauth_failed') {
      setErrorMsg(withDetail("We couldn't complete Google sign-in. Please try again, or use your email and password."));
    }
  }, []);

  // Coming back to this page from Google via the browser's back button
  // restores it from cache with the loading state still set.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setIsGoogleLoading(false);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  const isSignup = tab === 'signup';

  const fieldErrors: Partial<Record<Field, string>> = {};
  if (isSignup && !displayName.trim()) fieldErrors.displayName = 'Please enter your display name.';
  if (!email.trim()) fieldErrors.email = 'Please enter your email address.';
  else if (!EMAIL_RE.test(email.trim())) fieldErrors.email = 'Enter a valid email address.';
  if (!password) fieldErrors.password = isSignup ? 'Please choose a password.' : 'Please enter your password.';
  else if (isSignup && PASSWORD_RULES.some((r) => !r.test(password))) {
    fieldErrors.password = 'Password does not meet the requirements below.';
  }
  if (isSignup) {
    if (!confirmPassword) fieldErrors.confirmPassword = 'Please confirm your password.';
    else if (confirmPassword !== password) fieldErrors.confirmPassword = 'Passwords do not match.';
  }

  const shownError = (f: Field) => (touched[f] ? fieldErrors[f] : undefined);
  const touch = (f: Field) => setTouched((t) => ({ ...t, [f]: true }));

  const inputClass = (f: Field) =>
    `${INPUT_CLASS} ${shownError(f) ? 'border-rose-500/60' : 'border-slate-800'}`;

  const resetFeedback = () => {
    setErrorMsg(null);
    setShowAlreadyRegistered(false);
  };

  const switchTab = (next: 'signin' | 'signup') => {
    setTab(next);
    setTouched({});
    setConfirmPassword('');
    resetFeedback();
  };

  const emailRedirectTo = () =>
    typeof window !== 'undefined' ? `${window.location.origin}/auth/confirm?next=/` : undefined;

  const showConfirmationPending = (address: string, reason: 'signup' | 'unconfirmed') => {
    setPendingEmail(address);
    setPendingReason(reason);
    setResendResult(null);
    setResendCooldown(reason === 'signup' ? RESEND_COOLDOWN_SECONDS : 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ displayName: true, email: true, password: true, confirmPassword: true });
    if (Object.keys(fieldErrors).length > 0) return;

    setIsSubmitting(true);
    resetFeedback();
    const normalizedEmail = email.trim();

    try {
      if (isSupabaseConfigured) {
        const supabase = createClient();

        if (isSignup) {
          const { data, error } = await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              emailRedirectTo: emailRedirectTo(),
              data: {
                display_name: displayName.trim(),
                username: normalizedEmail.split('@')[0],
                phone: phoneNumber.trim() || undefined,
              },
            },
          });

          if (error) {
            if (error.code === 'user_already_exists') {
              setShowAlreadyRegistered(true);
            } else if (error.code === 'weak_password') {
              setErrorMsg(`Password is too weak: ${error.message}`);
            } else if (error.code === 'over_email_send_rate_limit') {
              setErrorMsg('Too many emails have been sent recently. Please wait a few minutes and try again.');
            } else {
              setErrorMsg(error.message);
            }
            setIsSubmitting(false);
            return;
          }

          // Supabase hides whether an address is already registered by
          // returning a user with no identities instead of an error.
          if (data.user && data.user.identities && data.user.identities.length === 0) {
            setShowAlreadyRegistered(true);
            setIsSubmitting(false);
            return;
          }

          if (data.session) {
            // The Supabase project has "Confirm email" turned off.
            setIsSubmitting(false);
            if (onLoginSuccess) onLoginSuccess(normalizedEmail);
            return;
          }

          showConfirmationPending(normalizedEmail, 'signup');
          setIsSubmitting(false);
          return;
        } else {
          const { error } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });

          if (error) {
            if (error.code === 'email_not_confirmed') {
              showConfirmationPending(normalizedEmail, 'unconfirmed');
            } else if (error.code === 'invalid_credentials') {
              setErrorMsg('Invalid email or password. Please check your details.');
            } else {
              setErrorMsg(error.message);
            }
            setIsSubmitting(false);
            return;
          }
        }
      } else {
        // Local mode fallback
        const store = getChatStore();
        const users = store.getState().allUsers;
        const matched = users.find(
          (u) => u.name.toLowerCase().includes(normalizedEmail.split('@')[0].toLowerCase())
        );
        if (matched) {
          store.switchDemoUser(matched.id);
        } else {
          store.registerUser(displayName || normalizedEmail.split('@')[0]);
        }
      }

      setIsSubmitting(false);
      if (onLoginSuccess) onLoginSuccess(normalizedEmail);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed. Please check your credentials.';
      setErrorMsg(message);
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!pendingEmail || isResending || resendCooldown > 0) return;
    setIsResending(true);
    setResendResult(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingEmail,
        options: { emailRedirectTo: emailRedirectTo() },
      });
      if (error) {
        setResendResult({
          ok: false,
          text:
            error.code === 'over_email_send_rate_limit'
              ? 'Too many emails sent recently. Please wait a minute before trying again.'
              : error.message,
        });
      } else {
        setResendResult({ ok: true, text: `Confirmation email sent to ${pendingEmail}.` });
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
      }
    } catch (err: unknown) {
      setResendResult({
        ok: false,
        text: err instanceof Error ? err.message : 'Could not resend the confirmation email.',
      });
    }
    setIsResending(false);
  };

  const handleGoogleSignIn = async () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);
    resetFeedback();
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/confirm?next=/&provider=google`,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) {
        setErrorMsg(error.message);
        setIsGoogleLoading(false);
      }
      // On success the browser is already navigating to Google.
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not start Google sign-in.');
      setIsGoogleLoading(false);
    }
  };

  const handleQuickDemoLogin = (userId: string, userEmail: string) => {
    const store = getChatStore();
    store.switchDemoUser(userId);
    if (onLoginSuccess) onLoginSuccess(userEmail);
  };

  if (pendingEmail) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="One more step: confirm your email address to activate your account."
      >
        <div className="flex flex-col gap-4 font-sans text-xs" data-testid="check-email-panel">
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <IconCheck className="w-3.5 h-3.5" />
            </div>
            <p className="text-slate-300 leading-relaxed">
              {pendingReason === 'signup'
                ? 'We sent a confirmation link to '
                : "You haven't confirmed your email address yet. Use the button below to send a new confirmation link to "}
              <span className="font-semibold text-slate-100 break-all">{pendingEmail}</span>
              {pendingReason === 'signup'
                ? '. Open it to activate your account, then sign in. Check your spam folder if it does not arrive.'
                : ', open it, then sign in.'}
            </p>
          </div>

          {resendResult && (
            <div
              role="status"
              className={`p-3 rounded-xl leading-relaxed border ${
                resendResult.ok
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {resendResult.text}
            </div>
          )}

          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || resendCooldown > 0}
            className="w-full py-2.5 bg-slate-100 hover:bg-white text-slate-950 font-semibold text-xs rounded-xl transition-all disabled:opacity-50 cursor-pointer"
          >
            {isResending
              ? 'Sending...'
              : resendCooldown > 0
              ? `Resend confirmation email (${resendCooldown}s)`
              : 'Resend confirmation email'}
          </button>

          <button
            type="button"
            onClick={() => {
              setPendingEmail(null);
              setPassword('');
              switchTab('signin');
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-all cursor-pointer"
          >
            Return to sign in
          </button>

          {pendingReason === 'signup' && (
            <button
              type="button"
              onClick={() => {
                setPendingEmail(null);
                setPassword('');
                switchTab('signup');
              }}
              className="text-[11px] text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Wrong email? Start over
            </button>
          )}
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={tab === 'signin' ? 'Sign In to Private Chat' : 'Create Your Account'}
      subtitle={
        tab === 'signin'
          ? 'Enter your credentials to unlock your end-to-end encrypted messaging keys.'
          : 'Create a private cryptographic identity to begin messaging.'
      }
    >
      <div className="flex flex-col gap-4 font-sans text-xs">
        {/* Sign In vs Sign Up Tabs */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => switchTab('signin')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              tab === 'signin'
                ? 'bg-slate-800 text-slate-100 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchTab('signup')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              tab === 'signup'
                ? 'bg-slate-800 text-slate-100 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {isSupabaseConfigured && (
          <>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isSubmitting}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-xl text-xs transition-all shadow-xs disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2.5"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
                <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.51 5.51 0 0 1-2.39 3.62v3h3.87c2.27-2.09 3.57-5.17 3.57-8.81z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.94-2.92l-3.87-3c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24z" />
                <path fill="#FBBC05" d="M5.27 14.27A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.55.37-2.27V6.64H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.36l4-3.09z" />
                <path fill="#EA4335" d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.64l4 3.09C6.22 6.88 8.87 4.77 12 4.77z" />
              </svg>
              <span>{isGoogleLoading ? 'Redirecting to Google...' : 'Continue with Google'}</span>
            </button>

            <div className="flex items-center gap-3 text-[11px] text-slate-500" role="separator">
              <span className="flex-1 h-px bg-slate-800" />
              <span>or use email</span>
              <span className="flex-1 h-px bg-slate-800" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3.5">
          {errorMsg && (
            <div role="alert" className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl leading-relaxed">
              ✕ {errorMsg}
            </div>
          )}

          {showAlreadyRegistered && (
            <div role="alert" className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl leading-relaxed">
              An account with this email already exists.{' '}
              <button
                type="button"
                onClick={() => switchTab('signin')}
                className="underline font-semibold hover:text-amber-200 cursor-pointer"
              >
                Sign in instead
              </button>
              . If you never confirmed it, sign in and we can resend the confirmation email.
            </div>
          )}

          {isSignup && (
            <div className="flex flex-col gap-1">
              <label htmlFor="auth-display-name" className="text-slate-300 font-semibold">Display Name</label>
              <input
                id="auth-display-name"
                type="text"
                placeholder="e.g. Alex Morgan"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onBlur={() => touch('displayName')}
                aria-invalid={!!shownError('displayName')}
                className={inputClass('displayName')}
              />
              {shownError('displayName') && <p className="text-[11px] text-rose-400">{shownError('displayName')}</p>}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="auth-email" className="text-slate-300 font-semibold">Email Address</label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => touch('email')}
              aria-invalid={!!shownError('email')}
              className={inputClass('email')}
            />
            {shownError('email') && <p className="text-[11px] text-rose-400">{shownError('email')}</p>}
          </div>

          {isSignup && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="auth-phone" className="text-slate-300 font-semibold">Phone Number</label>
                <span className="text-[10px] text-slate-500">(Optional for discovery)</span>
              </div>
              <input
                id="auth-phone"
                type="tel"
                placeholder="+1 555-0199"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className={`${INPUT_CLASS} border-slate-800`}
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label htmlFor="auth-password" className="text-slate-300 font-semibold">Password</label>
              {tab === 'signin' && (
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <input
              id="auth-password"
              type="password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              placeholder={isSignup ? 'Create a password...' : 'Enter password...'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => touch('password')}
              aria-invalid={!!shownError('password')}
              className={inputClass('password')}
            />
            {shownError('password') && <p className="text-[11px] text-rose-400">{shownError('password')}</p>}
            {isSignup && (
              <ul className="mt-1 flex flex-col gap-0.5" aria-label="Password requirements">
                {PASSWORD_RULES.map((rule) => {
                  const met = rule.test(password);
                  return (
                    <li
                      key={rule.id}
                      className={`text-[11px] flex items-center gap-1.5 ${met ? 'text-emerald-400' : 'text-slate-500'}`}
                    >
                      <span aria-hidden="true">{met ? '✓' : '○'}</span>
                      <span>{rule.label}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {isSignup && (
            <div className="flex flex-col gap-1">
              <label htmlFor="auth-confirm-password" className="text-slate-300 font-semibold">Confirm Password</label>
              <input
                id="auth-confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your password..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => touch('confirmPassword')}
                aria-invalid={!!shownError('confirmPassword')}
                className={inputClass('confirmPassword')}
              />
              {shownError('confirmPassword') && (
                <p className="text-[11px] text-rose-400">{shownError('confirmPassword')}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-white text-slate-950 font-semibold rounded-xl text-xs transition-all shadow-xs disabled:opacity-50 mt-2 cursor-pointer flex items-center justify-center gap-2"
          >
            <IconLock className="w-3.5 h-3.5" />
            <span>
              {isSubmitting
                ? tab === 'signup'
                  ? 'Creating Cryptographic Identity...'
                  : 'Unlocking Key Store...'
                : tab === 'signup'
                ? 'Create Account & Generate Keys'
                : 'Sign In & Unlock Keys'}
            </span>
          </button>

          {/* Demo Mode Personas - Only shown when Supabase URL is placeholder */}
          {!isSupabaseConfigured && (
            <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-emerald-400">
                Development Mode Quick Sign-In:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('usr-alice', 'alice@privatechat.internal')}
                  className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-left text-slate-200 text-xs transition-colors"
                >
                  <div className="font-semibold text-white">Alice Vance</div>
                  <div className="text-[10px] text-slate-400">Admin</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('usr-bob', 'bob@privatechat.internal')}
                  className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-left text-slate-200 text-xs transition-colors"
                >
                  <div className="font-semibold text-white">Bob Miller</div>
                  <div className="text-[10px] text-slate-400">Member</div>
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </AuthLayout>
  );
};
