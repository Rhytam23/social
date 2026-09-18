import Link from 'next/link';
import { AuthLayout } from '../../../components/auth/AuthLayout';
import { IconCheck } from '../../../components/ui/icons';

export default function VerifyEmailPage() {
  return (
    <AuthLayout title="Check your inbox" subtitle="Confirm your email address to finish setting up your account.">
      <div className="flex flex-col gap-4 font-sans text-xs">
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <IconCheck className="w-3.5 h-3.5" />
          </div>
          <p className="text-slate-300 leading-relaxed">
            We sent a confirmation link to the email address you signed up with. Click it to activate your account, then come back and sign in.
          </p>
        </div>
        <Link
          href="/login"
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl text-center transition-all cursor-pointer"
        >
          Return to Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}
