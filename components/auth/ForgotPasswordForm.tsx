'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AuthLayout } from './AuthLayout';
import { createClient } from '../../lib/supabase/client';
import { IconCheck } from '../ui/icons';

export const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const supabase = createClient();
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/confirm?next=/reset-password`
          : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg(
          'If an account exists with this email, a secure password reset link has been sent. Please check your inbox.'
        );
      }
    } catch {
      setErrorMsg('Unable to process password reset request. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your account email to receive a secure recovery link."
    >
      {successMsg ? (
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <IconCheck className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-emerald-300">Recovery Link Dispatched</span>
              <p className="text-slate-300 leading-relaxed">{successMsg}</p>
            </div>
          </div>

          <Link
            href="/login"
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl text-center transition-all cursor-pointer"
          >
            Return to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-sans text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-300">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-emerald-500/60 p-3 rounded-xl text-slate-100 text-xs focus:outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/10 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-1"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Send Recovery Link</span>
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[11px] mt-2">
            <span>Remembered your password?</span>
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold">
              Sign in
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};
