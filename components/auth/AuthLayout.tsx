import React from 'react';
import { IconLock, IconShield } from '../ui/icons';

export interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  currentStep?: number;
  totalSteps?: number;
}

/** The frame for every sign-in, sign-up and password screen. */
export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle, currentStep, totalSteps }) => {
  return (
    <div
      className="grain relative min-h-screen bg-[var(--canvas-bg)] text-[var(--text-primary)] flex flex-col items-center justify-center p-4 sm:p-6 font-sans"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{ background: 'radial-gradient(48rem 26rem at 50% -6%, rgba(124,195,232,0.09), transparent 62%)' }}
      />

      <div className="relative z-10 w-full max-w-md flex flex-col gap-6 anim-slide-up">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[var(--surface-2)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--accent-text)] shadow-[var(--edge-light),var(--shadow-2)]">
            <IconLock className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold tracking-tight">Private Chat</h1>
            <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto leading-relaxed">{subtitle}</p>
          </div>
        </div>

        {currentStep && totalSteps && (
          <div className="flex items-center justify-center gap-1.5 py-1" role="img" aria-label={`Step ${currentStep} of ${totalSteps}`}>
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx + 1 === currentStep ? 'w-6 bg-[var(--accent-primary)]' : idx + 1 < currentStep ? 'w-3 bg-[var(--accent-line)]' : 'w-3 bg-[var(--surface-hover)]'
                }`}
              />
            ))}
          </div>
        )}

        <div className="floating p-6 flex flex-col gap-5">
          <div className="border-b border-[var(--border-subtle)] pb-4">
            <h2 className="text-base font-semibold">{title}</h2>
          </div>
          {children}
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--text-muted)]">
          <IconShield className="w-3.5 h-3.5 text-[var(--accent-text)]" />
          <span>Encrypted on your device. The server only holds ciphertext.</span>
        </div>
      </div>
    </div>
  );
};
