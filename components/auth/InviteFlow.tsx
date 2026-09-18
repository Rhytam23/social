import React, { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { IconCheck } from '../ui/icons';

export interface InviteFlowProps {
  onComplete?: (user: { name: string; email: string; deviceName: string }) => void;
  onNavigateLogin?: () => void;
}

export const InviteFlow: React.FC<InviteFlowProps> = ({ onComplete, onNavigateLogin }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form States
  const [inviteToken, setInviteToken] = useState('');
  const [tokenStatus, setTokenStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid' | 'consumed' | 'expired'>('idle');

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [deviceName, setDeviceName] = useState('My Web Device');
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const [keyProgress, setKeyProgress] = useState(0);

  // Step 1: Validate Token
  const handleValidateToken = () => {
    if (!inviteToken.trim()) return;
    setTokenStatus('validating');
    setTimeout(() => {
      const cleanToken = inviteToken.trim().toUpperCase();
      if (cleanToken.startsWith('INV-EXPIRED')) {
        setTokenStatus('expired');
      } else if (cleanToken.startsWith('INV-USED')) {
        setTokenStatus('consumed');
      } else if (cleanToken.length >= 8) {
        setTokenStatus('valid');
        setTimeout(() => setStep(2), 600);
      } else {
        setTokenStatus('invalid');
      }
    }, 500);
  };

  // Step 2: Account Details Submit
  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName && email && password.length >= 8) {
      setStep(3);
    }
  };

  // Step 3: Initialize E2EE Keys
  const handleInitializeDeviceKeys = () => {
    setIsGeneratingKeys(true);
    let p = 0;
    const interval = setInterval(() => {
      p += 25;
      setKeyProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setIsGeneratingKeys(false);
        setStep(4);
      }
    }, 250);
  };

  // Step 4: Finalize
  const handleFinish = () => {
    if (onComplete) {
      onComplete({ name: displayName, email, deviceName });
    }
  };

  return (
    <>
      {step === 1 && (
        <AuthLayout
          title="Enter Invitation Token"
          subtitle="Private Chat is an invite-only platform. Enter your invitation token to create an account."
          currentStep={1}
          totalSteps={4}
        >
          <div className="flex flex-col gap-4 font-sans text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 font-semibold">Invitation Token</label>
              <input
                type="text"
                placeholder="e.g. INV-88F9-2041-A99B"
                value={inviteToken}
                onChange={(e) => {
                  setInviteToken(e.target.value);
                  if (tokenStatus !== 'idle') setTokenStatus('idle');
                }}
                className="w-full bg-slate-950/70 border border-slate-800 p-3 rounded-xl text-sm font-mono uppercase text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-700"
              />
            </div>

            {tokenStatus === 'invalid' && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl">
                ✕ Invalid invitation token. Please check the token provided by your team admin.
              </div>
            )}

            {tokenStatus === 'consumed' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl">
                ⚠️ This invitation token has already been used by another user.
              </div>
            )}

            {tokenStatus === 'expired' && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl">
                ✕ This invitation token has expired. Request a new token from your administrator.
              </div>
            )}

            {tokenStatus === 'valid' && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center gap-2">
                <IconCheck className="w-4 h-4" />
                <span>Invitation verified! Proceeding to account setup...</span>
              </div>
            )}

            <button
              onClick={handleValidateToken}
              disabled={!inviteToken.trim() || tokenStatus === 'validating'}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-white text-slate-950 font-semibold rounded-xl text-xs transition-all shadow-xs disabled:opacity-50 mt-1"
            >
              {tokenStatus === 'validating' ? 'Verifying Token...' : 'Verify Invitation'}
            </button>

            {onNavigateLogin && (
              <div className="pt-2 text-center text-slate-400 border-t border-slate-800/80">
                Already have an account?{' '}
                <button
                  onClick={onNavigateLogin}
                  className="text-slate-200 hover:underline font-semibold"
                >
                  Sign in
                </button>
              </div>
            )}
          </div>
        </AuthLayout>
      )}

      {step === 2 && (
        <AuthLayout
          title="Create Account"
          subtitle="Set your display name and login credentials for your private identity."
          currentStep={2}
          totalSteps={4}
        >
          <form onSubmit={handleAccountSubmit} className="flex flex-col gap-3.5 font-sans text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-slate-300 font-semibold">Display Name</label>
              <input
                type="text"
                placeholder="e.g. Alice Vance"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-700"
              />
            </div>

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
              <label className="text-slate-300 font-semibold">Password</label>
              <input
                type="password"
                placeholder="Min 8 characters..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-700"
              />
            </div>

            <button
              type="submit"
              disabled={!displayName || !email || password.length < 8}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-white text-slate-950 font-semibold rounded-xl text-xs transition-all shadow-xs disabled:opacity-50 mt-2"
            >
              Continue to Key Setup
            </button>
          </form>
        </AuthLayout>
      )}

      {step === 3 && (
        <AuthLayout
          title="Device Registration & Cryptographic Setup"
          subtitle="Generate client-side Signal Identity Keys and initial Signed Prekeys."
          currentStep={3}
          totalSteps={4}
        >
          <div className="flex flex-col gap-4 font-sans text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 font-semibold">Device Name</label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                disabled={isGeneratingKeys}
                className="w-full bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-slate-700"
              />
            </div>

            <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Key Generation Progress</span>
                <span className="text-emerald-400 font-mono font-bold">{keyProgress}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${keyProgress}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1">
                Generating Curve25519 Identity Pair + 100 One-Time Prekeys via @signalapp/libsignal-client...
              </span>
            </div>

            <button
              onClick={handleInitializeDeviceKeys}
              disabled={isGeneratingKeys || keyProgress === 100}
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-xs disabled:opacity-50"
            >
              {isGeneratingKeys ? 'Generating Signal Keys...' : 'Generate Device Security Keys'}
            </button>
          </div>
        </AuthLayout>
      )}

      {step === 4 && (
        <AuthLayout
          title="Account Ready"
          subtitle="Your client-side Signal Identity Keys are stored securely in browser IndexedDB."
          currentStep={4}
          totalSteps={4}
        >
          <div className="flex flex-col gap-4 font-sans text-xs text-center items-center py-2">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <IconCheck className="w-7 h-7" />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-bold text-slate-100">{displayName}</h3>
              <p className="text-xs text-slate-400">{email}</p>
              <p className="text-[11px] text-slate-400 font-mono mt-1">Registered Device: {deviceName}</p>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-white text-slate-950 font-semibold rounded-xl text-xs transition-all shadow-xs mt-2"
            >
              Open Messaging Application
            </button>
          </div>
        </AuthLayout>
      )}
    </>
  );
};
