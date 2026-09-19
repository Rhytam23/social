import React from 'react';
import { IconLock, IconShield } from '../ui/icons';

export interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  currentStep?: number;
  totalSteps?: number;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  currentStep,
  totalSteps,
}) => {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shadow-lg">
            <IconLock className="w-6 h-6" />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Private Chat</h1>
            </div>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Multi-Step Indicator */}
        {currentStep && totalSteps && (
          <div className="flex items-center justify-center gap-1.5 py-1">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx + 1 === currentStep
                    ? 'w-6 bg-emerald-400'
                    : idx + 1 < currentStep
                    ? 'w-3 bg-slate-700'
                    : 'w-3 bg-slate-800'
                }`}
              />
            ))}
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col gap-5">
          <div className="border-b border-slate-800/80 pb-4">
            <h2 className="text-base font-bold text-slate-100">{title}</h2>
          </div>
          {children}
        </div>

        {/* Security Footer Note */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-sans">
          <IconShield className="w-3.5 h-3.5 text-emerald-400/80" />
          <span>Client-side End-to-End Encryption • Zero Plaintext Server Access</span>
        </div>
      </div>
    </div>
  );
};
