'use client';

import React from 'react';
import Link from 'next/link';
import { IconLock, IconShield } from '../../components/ui/icons';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[var(--canvas-bg)] text-slate-100 font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[var(--canvas-bg)]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-white font-bold text-sm">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <IconLock className="w-4 h-4" />
            </div>
            <span>Private Chat</span>
          </Link>
          <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 flex flex-col gap-8 text-xs leading-relaxed text-slate-300">
        <div className="flex flex-col gap-2 border-b border-slate-800 pb-6">
          <div className="inline-flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
            <IconShield className="w-3.5 h-3.5" />
            <span>Encrypted Messaging Agreement</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Terms of Service</h1>
          <span className="text-slate-500 text-[11px]">Last Updated: September 18, 2026</span>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-slate-100">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Private Chat web application, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-slate-100">2. Description of Service</h2>
          <p>
            Private Chat provides an end-to-end encrypted messaging service designed for direct communications, group collaborations, voice messaging, and secure file exchange.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-slate-100">3. User Responsibility & Cryptographic Keys</h2>
          <p>
            Because Private Chat operates with zero-knowledge encryption, your cryptographic identity and session keys are held locally in your browser. You are solely responsible for maintaining the security of your device and any exported passphrase backups.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-slate-100">4. Prohibited Conduct</h2>
          <p>
            You agree not to use Private Chat to:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5 text-slate-400">
            <li>Engage in illegal activities or transmit unauthorized malicious code.</li>
            <li>Attempt to disrupt, overwhelm, or reverse-engineer the underlying service infrastructure.</li>
            <li>Impersonate another individual or misrepresent your affiliation.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-slate-100">5. Disclaimer of Warranties</h2>
          <p>
            The service is provided on an &quot;as-is&quot; and &quot;as-available&quot; basis without warranties of any kind, whether express or implied.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-[11px] text-slate-600 bg-[var(--canvas-bg)]">
        Private Chat V1 • Genuine Client-Side Privacy
      </footer>
    </div>
  );
}
