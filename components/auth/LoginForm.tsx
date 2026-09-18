'use client';

import React, { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { createClient } from '../../lib/supabase/client';
import { getChatStore } from '../../lib/store/chatStore';
import { IconCheck, IconLock } from '../ui/icons';

import Link from 'next/link';

export interface LoginFormProps {
  initialTab?: 'signin' | 'signup';
  onLoginSuccess?: (email: string) => void;
  onNavigateInvite?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  initialTab = 'signin',
  onLoginSuccess,
  onNavigateInvite,
}) => {
  const [tab, setTab] = useState<'signin' | 'signup'>(initialTab);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isSupabaseConfigured =
    typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (tab === 'signup' && !displayName.trim()) {
      setErrorMsg('Please enter your display name.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isSupabaseConfigured) {
        const supabase = createClient();

        if (tab === 'signup') {
          // Real Supabase User Registration
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                display_name: displayName.trim(),
                username: email.split('@')[0],
                phone: phoneNumber.trim() || undefined,
              },
            },
          });

          if (error) {
            setErrorMsg(error.message);
            setIsSubmitting(false);
            return;
          }

          if (data.session) {
            // Automatically signed in
            setIsSubmitting(false);
            if (onLoginSuccess) onLoginSuccess(email);
            return;
          } else {
            // Email confirmation required by Supabase project settings
            setSuccessMsg('Account created successfully! Please check your email inbox to confirm your registration.');
            setIsSubmitting(false);
            return;
          }
        } else {
          // Real Supabase User Login
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            if (error.message.toLowerCase().includes('invalid login credentials')) {
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
          (u) => u.name.toLowerCase().includes(email.split('@')[0].toLowerCase())
        );
        if (matched) {
          store.switchDemoUser(matched.id);
        } else {
          store.registerUser(displayName || email.split('@')[0]);
        }
      }

      setIsSubmitting(false);
      if (onLoginSuccess) onLoginSuccess(email);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed. Please check your credentials.';
      setErrorMsg(message);
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = (userId: string, userEmail: string) => {
    const store = getChatStore();
    store.switchDemoUser(userId);
    if (onLoginSuccess) onLoginSuccess(userEmail);
  };

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
            onClick={() => {
              setTab('signin');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
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
            onClick={() => {
              setTab('signup');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              tab === 'signup'
                ? 'bg-slate-800 text-slate-100 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl leading-relaxed">
              ✕ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center gap-2 leading-relaxed">
              <IconCheck className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {tab === 'signup' && (
            <div className="flex flex-col gap-1">
              <label className="text-slate-300 font-semibold">Display Name</label>
              <input
                type="text"
                placeholder="e.g. Alex Morgan"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-700"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-slate-300 font-semibold">Email Address</label>
            <input
              type="email"
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-700"
            />
          </div>

          {tab === 'signup' && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-semibold">Phone Number</label>
                <span className="text-[10px] text-slate-500">(Optional for discovery)</span>
              </div>
              <input
                type="tel"
                placeholder="+1 555-0199"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-700"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold">Password</label>
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
              type="password"
              placeholder={tab === 'signup' ? 'Min 8 characters...' : 'Enter password...'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-700"
            />
          </div>

          <button
            type="submit"
            disabled={!email || !password || isSubmitting}
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

          {onNavigateInvite && (
            <div className="pt-3 text-center text-slate-400 border-t border-slate-800/80">
              Have an invitation token?{' '}
              <button
                type="button"
                onClick={onNavigateInvite}
                className="text-slate-200 hover:underline font-semibold"
              >
                Redeem token
              </button>
            </div>
          )}
        </form>
      </div>
    </AuthLayout>
  );
};
