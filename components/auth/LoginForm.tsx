'use client';

import React, { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { createClient } from '../../lib/supabase/client';
import { getChatStore } from '../../lib/store/chatStore';

export interface LoginFormProps {
  onLoginSuccess?: (email: string) => void;
  onNavigateInvite?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, onNavigateInvite }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isSupabaseConfigured =
    typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (isSupabaseConfigured) {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setErrorMsg(error.message);
          setIsSubmitting(false);
          return;
        }
      } else {
        // Local mode login verification
        const store = getChatStore();
        const users = store.getState().allUsers;
        const matched = users.find(
          (u) => u.name.toLowerCase().includes(email.split('@')[0].toLowerCase())
        );
        if (matched) {
          store.switchDemoUser(matched.id);
        } else {
          store.registerUser(email.split('@')[0]);
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
      title="Sign In to Private Chat"
      subtitle="Enter your verified credentials to unlock your local E2EE session keys."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 font-sans text-xs">
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl">
            ✕ {errorMsg}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-slate-300 font-semibold">Email Address</label>
          <input
            type="email"
            placeholder="alice@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-700"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-slate-300 font-semibold">Password</label>
            <button
              type="button"
              onClick={() => alert('Contact your organization admin to reset your credentials.')}
              className="text-[11px] text-slate-400 hover:text-slate-200"
            >
              Forgot password?
            </button>
          </div>
          <input
            type="password"
            placeholder="Enter password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-700"
          />
        </div>

        <button
          type="submit"
          disabled={!email || !password || isSubmitting}
          className="w-full py-3 px-4 bg-slate-100 hover:bg-white text-slate-950 font-semibold rounded-xl text-xs transition-all shadow-xs disabled:opacity-50 mt-2 cursor-pointer"
        >
          {isSubmitting ? 'Unlocking Key Store...' : 'Sign In & Unlock Keys'}
        </button>

        {/* Demo Fast Login Personas */}
        {!isSupabaseConfigured && (
          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-emerald-400">
              Demo Mode Quick Sign-In:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('usr-alice', 'alice@privatechat.internal')}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-left text-slate-200 text-xs transition-colors"
              >
                <div className="font-semibold text-white">Alice Vance</div>
                <div className="text-[10px] text-slate-400">Admin (Reg #84920)</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('usr-bob', 'bob@privatechat.internal')}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-left text-slate-200 text-xs transition-colors"
              >
                <div className="font-semibold text-white">Bob Miller</div>
                <div className="text-[10px] text-slate-400">Member (Reg #10482)</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('usr-carol', 'carol@privatechat.internal')}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-left text-slate-200 text-xs transition-colors"
              >
                <div className="font-semibold text-white">Carol Danvers</div>
                <div className="text-[10px] text-slate-400">Member (Reg #30291)</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('usr-david', 'david@privatechat.internal')}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-left text-slate-200 text-xs transition-colors"
              >
                <div className="font-semibold text-white">David Wright</div>
                <div className="text-[10px] text-slate-400">Member (Reg #90218)</div>
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
    </AuthLayout>
  );
};
