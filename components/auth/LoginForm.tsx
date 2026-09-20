'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { createClient } from '../../lib/supabase/client';
import { isSupabaseConfigured as checkSupabaseConfigured } from '../../lib/supabase/env';
import { IconCheck, IconLock, IconX } from '../ui/icons';
import { Button } from '../ui/button';
import { TurnstileWidget, type TurnstileHandle } from './TurnstileWidget';
import { captchaEnabled } from '../../lib/captcha';

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

const INPUT_CLASS = 'field';

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
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<TurnstileHandle>(null);
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
  const needsCaptcha = isSupabaseConfigured && captchaEnabled();

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
    `${INPUT_CLASS} ${shownError(f) ? '!border-[var(--danger-neutral)]' : ''}`;

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
    if (needsCaptcha && !captchaToken) {
      setErrorMsg('Please complete the security check first.');
      return;
    }

    setIsSubmitting(true);
    resetFeedback();
    const normalizedEmail = email.trim();
    // A check token works once: use it now and ask for a fresh one for any next attempt.
    const token = captchaToken ?? undefined;
    if (needsCaptcha) {
      setCaptchaToken(null);
      captchaRef.current?.reset();
    }

    try {
      if (isSupabaseConfigured) {
        const supabase = createClient();

        if (isSignup) {
          const { data, error } = await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              captchaToken: token,
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
            options: { captchaToken: token },
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
        // Local mode fallback (development only). The store is loaded on demand so real sign-in never pays for it.
        const { getChatStore } = await import('../../lib/store/chatStore');
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

  const handleQuickDemoLogin = async (userId: string, userEmail: string) => {
    const { getChatStore } = await import('../../lib/store/chatStore');
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

          <Button
            type="button"
            variant="primary"
            fullWidth
            onClick={handleResend}
            disabled={isResending || resendCooldown > 0}
          >
            {isResending
              ? 'Sending...'
              : resendCooldown > 0
              ? `Resend confirmation email (${resendCooldown}s)`
              : 'Resend confirmation email'}
          </Button>

          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={() => {
              setPendingEmail(null);
              setPassword('');
              switchTab('signin');
            }}
          >
            Return to sign in
          </Button>

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
      title={tab === 'signin' ? 'Sign In to Nook' : 'Create Your Account'}
      subtitle={
        tab === 'signin'
          ? 'Enter your credentials to unlock your end-to-end encrypted messaging keys.'
          : 'Create a private cryptographic identity to begin messaging.'
      }
    >
      <div className="flex flex-col gap-4 font-sans text-xs">
        {/* Sign In vs Sign Up Tabs */}
        <div role="tablist" aria-label="Sign in or create an account" className="flex gap-1 bg-[var(--surface-2)] p-1 rounded-lg border border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => switchTab('signin')}
            className={`pressable flex-1 h-8 px-3 rounded-md text-xs font-semibold ${
              tab === 'signin'
                ? 'bg-[var(--surface-hover)] text-[var(--text-primary)] shadow-[var(--edge-light),var(--shadow-1)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchTab('signup')}
            className={`pressable flex-1 h-8 px-3 rounded-md text-xs font-semibold ${
              tab === 'signup'
                ? 'bg-[var(--surface-hover)] text-[var(--text-primary)] shadow-[var(--edge-light),var(--shadow-1)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Create Account
          </button>
        </div>

        {isSupabaseConfigured && (
          <>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              fullWidth
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isSubmitting}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
                <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.51 5.51 0 0 1-2.39 3.62v3h3.87c2.27-2.09 3.57-5.17 3.57-8.81z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.94-2.92l-3.87-3c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24z" />
                <path fill="#FBBC05" d="M5.27 14.27A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.55.37-2.27V6.64H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.36l4-3.09z" />
                <path fill="#EA4335" d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.64l4 3.09C6.22 6.88 8.87 4.77 12 4.77z" />
              </svg>
              <span>{isGoogleLoading ? 'Redirecting to Google...' : 'Continue with Google'}</span>
            </Button>

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
              <span className="inline-flex items-start gap-2"><IconX className="w-3.5 h-3.5 mt-0.5 shrink-0" />{errorMsg}</span>
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
                <span className="text-[10px] text-slate-500">(Optional, kept private)</span>
              </div>
              <input
                id="auth-phone"
                type="tel"
                placeholder="+1 555-0199"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className={INPUT_CLASS}
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
                      <span aria-hidden="true" className="w-3.5 h-3.5 inline-flex items-center justify-center">{met ? <IconCheck className="w-3 h-3" /> : <span className="w-1.5 h-1.5 rounded-full border border-current" />}</span>
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

          {needsCaptcha && <TurnstileWidget ref={captchaRef} onToken={setCaptchaToken} onUnavailable={() => setErrorMsg('The security check could not be loaded. Check your connection and reload the page.')} />}

          <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting} disabled={needsCaptcha && !captchaToken} className="mt-2">
            <IconLock className="w-3.5 h-3.5" />
            <span>
              {isSubmitting
                ? tab === 'signup'
                  ? 'Creating your account'
                  : 'Signing in'
                : tab === 'signup'
                ? 'Create account'
                : 'Sign in'}
            </span>
          </Button>

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
                  className="pressable p-2 bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] rounded-lg text-left text-xs"
                >
                  <div className="font-semibold text-white">Alice Vance</div>
                  <div className="text-[10px] text-slate-400">Admin</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('usr-bob', 'bob@privatechat.internal')}
                  className="pressable p-2 bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] rounded-lg text-left text-xs"
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
