'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { IconArrowRight, IconLock } from '../ui/icons';
import { Button } from '../ui/button';
import { CHAPTERS, CHAPTER_COUNT } from './sceneContent';
import { chapterAt, shouldRender3D } from './sceneMath';
import { SceneStage } from './SceneCards';
import { readRenderSignals, usePrefersReducedMotion } from './signals';

// three.js is a separate chunk that only this page ever requests. The app itself never loads it.
const HeroScene = dynamic(() => import('./HeroScene'), { ssr: false });

export interface LandingPageProps {
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  /** Always show the still version (used by the development preview to check every chapter). */
  forceStill?: boolean;
}

type Mode = 'pending' | '3d' | 'still';

const FACTS = [
  {
    title: 'Encrypted on your device',
    body: 'Direct messages use X25519 key exchange with XSalsa20-Poly1305 (libsodium). Attachments use AES-256-GCM. The plaintext never leaves your device.',
  },
  {
    title: 'Keys that stay with you',
    body: 'Your private key lives in your browser. You can back it up with a passphrase (Argon2id) so a lost device does not mean lost history.',
  },
  {
    title: 'Groups that rotate',
    body: 'Each group and channel shares one key, sealed separately to every member. It changes when someone leaves, so they cannot read what comes next.',
  },
  {
    title: 'What the server can see',
    body: 'Who is in a conversation and when messages are sent. Not what they say. Search runs on your device, over messages already on it.',
  },
];

const FEATURES: Array<[string, string]> = [
  ['Direct messages', 'One-to-one chats with replies, reactions, read receipts and saved messages.'],
  ['Groups and roles', 'Owner, admin and member roles, admin-only posting, and keys that change when people leave.'],
  ['Threads', 'Reply in a thread without flooding the conversation.'],
  ['Communities', 'Public and private channels with invite links and roles.'],
  ['Calls', 'One-to-one voice and video, with encrypted signalling.'],
  ['Files and voice notes', 'Encrypted before they upload, up to 25 MB.'],
  ['Disappearing messages', 'Delete after 24 hours, 7 days or 90 days, per chat.'],
  ['Privacy controls', 'Block, report, PIN app lock, and switches for read receipts and typing.'],
  ['Your look', 'Dark, light, or follow your device. Notification rules per chat.'],
];

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth, forceStill }) => {
  const reduced = usePrefersReducedMotion();
  const [mode, setMode] = useState<Mode>('pending');
  const [sceneReady, setSceneReady] = useState(false);
  const [chapter, setChapter] = useState(0);
  const storyRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });

  // Decide once the browser is known. Until then (and on the server) the still version renders.
  useEffect(() => {
    const signals = readRenderSignals(reduced);
    const use3D = !forceStill && shouldRender3D(signals);
    if (process.env.NODE_ENV !== 'production') console.info('landing scene:', use3D ? '3D' : 'still version', signals);
    setMode(use3D ? '3d' : 'still');
  }, [reduced, forceStill]);

  const failScene = useCallback(() => setMode('still'), []);

  // Scroll position through the pinned story, and the pointer, feed the scene without re-rendering React.
  useEffect(() => {
    if (mode !== '3d') return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const el = storyRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const span = Math.max(1, rect.height - window.innerHeight);
      const p = Math.min(1, Math.max(0, -rect.top / span));
      progressRef.current = p;
      setChapter((c) => {
        const next = chapterAt(p);
        return c === next ? c : next;
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    const onPointer = (e: PointerEvent) => {
      pointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('pointermove', onPointer, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('pointermove', onPointer);
    };
  }, [mode]);

  const goToChapter = (i: number) => {
    const el = storyRef.current;
    if (!el) return;
    const span = el.offsetHeight - window.innerHeight;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + ((i + 0.5) / CHAPTER_COUNT) * span, behavior: reduced ? 'auto' : 'smooth' });
  };

  const cta = (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      <Button variant="primary" size="lg" onClick={() => onOpenAuth('signin')}>
        Enter app
        <IconArrowRight className="w-4 h-4" />
      </Button>
      <Button variant="tertiary" size="lg" onClick={() => onOpenAuth('signup')}>
        Create account
      </Button>
    </div>
  );

  const copy = (i: number, withCta: boolean, asHeading: 'h1' | 'h2') => {
    const c = CHAPTERS[i];
    const Heading = asHeading;
    return (
      <>
        <p className="eyebrow !text-[var(--accent-text)] flex items-center gap-2">
          <span className="w-5 h-px bg-[var(--accent-line)]" aria-hidden="true" />
          {c.eyebrow}
        </p>
        <Heading className="mt-4 text-[clamp(2.25rem,5.2vw,4rem)] font-semibold tracking-[-0.03em] leading-[1.04] text-[var(--text-primary)]">
          {c.title}
        </Heading>
        <p className="mt-5 text-[15px] sm:text-base leading-relaxed text-[var(--text-secondary)] max-w-[32rem]">{c.body}</p>
        {withCta && cta}
      </>
    );
  };

  return (
    <div data-theme="dark" className="grain relative min-h-screen bg-[var(--canvas-bg)] text-[var(--text-primary)] font-sans overflow-x-clip">
      {/* Soft top light and a vignette: depth without glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(60rem 34rem at 62% -8%, rgba(124,195,232,0.10), transparent 60%), radial-gradient(90rem 50rem at 50% 120%, rgba(0,0,0,0.6), transparent 60%)',
        }}
      />

      <header className="fixed top-0 inset-x-0 z-50 h-14 border-b border-[var(--border-subtle)] bg-[var(--canvas-bg)]/75 backdrop-blur-md">
        <div className="max-w-7xl mx-auto h-full px-5 sm:px-8 flex items-center justify-between gap-4">
          <a href="#main" className="flex items-center gap-2.5" aria-label="Private Chat, top of page">
            <span className="w-8 h-8 rounded-lg bg-[var(--surface-2)] border border-[var(--border-strong)] text-[var(--accent-text)] flex items-center justify-center shadow-[var(--edge-light)]">
              <IconLock className="w-4 h-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight">Private Chat</span>
          </a>
          <nav aria-label="Page" className="hidden md:flex items-center gap-7 text-[13px] text-[var(--text-secondary)]">
            <a href="#security" className="hover:text-[var(--text-primary)] transition-colors">Security</a>
            <a href="#features" className="hover:text-[var(--text-primary)] transition-colors">Features</a>
            <Link href="/privacy" className="hover:text-[var(--text-primary)] transition-colors">Privacy</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenAuth('signin')}>Sign in</Button>
            <Button variant="primary" size="sm" onClick={() => onOpenAuth('signin')}>
              Enter app
              <IconArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="relative z-10 focus:outline-none">
        {mode === '3d' ? (
          <div ref={storyRef} style={{ height: `${CHAPTER_COUNT * 100}svh` }} className="relative">
            <div className="sticky top-0 h-[100svh] overflow-hidden">
              {/* The still composition is the poster until the scene is ready, then it fades out. */}
              <div className={`absolute inset-0 flex items-center transition-opacity duration-700 ${sceneReady ? 'opacity-0' : 'opacity-100'}`} aria-hidden="true">
                <div className="w-full md:pl-[40%]">
                  <SceneStage chapter={0} />
                </div>
              </div>
              <HeroScene progressRef={progressRef} pointerRef={pointerRef} onReady={() => setSceneReady(true)} onError={failScene} />

              {/* Legibility scrims behind the words: left on wide screens, bottom on phones */}
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none md:bg-[linear-gradient(90deg,var(--canvas-bg)_0%,rgba(10,11,13,0.82)_28%,transparent_58%)] bg-[linear-gradient(0deg,var(--canvas-bg)_0%,rgba(10,11,13,0.9)_34%,transparent_62%)]"
              />

              <div className="relative h-full max-w-7xl mx-auto px-5 sm:px-8 flex items-end md:items-center pb-14 md:pb-0">
                <div className="relative w-full md:w-[min(36rem,44%)]" style={{ minHeight: 320 }}>
                  {CHAPTERS.map((c, i) => (
                    <div
                      key={c.id}
                      aria-hidden="true"
                      className={`absolute left-0 right-0 bottom-0 md:bottom-auto md:top-1/2 transition-all duration-500 ease-out ${
                        chapter === i ? 'opacity-100 translate-y-0 md:-translate-y-1/2' : `opacity-0 pointer-events-none ${i < chapter ? '-translate-y-4 md:-translate-y-[60%]' : 'translate-y-4 md:-translate-y-[40%]'}`
                      }`}
                    >
                      {copy(i, i === 0 || i === CHAPTER_COUNT - 1, 'h2')}
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress */}
              <nav aria-label="Story chapters" className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 flex-col gap-3">
                {CHAPTERS.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => goToChapter(i)}
                    aria-label={`${c.eyebrow}`}
                    aria-current={chapter === i ? 'step' : undefined}
                    className="group p-1.5 -m-1.5"
                  >
                    <span
                      className={`block w-1 rounded-full transition-all duration-300 ${
                        chapter === i ? 'h-7 bg-[var(--accent-primary)]' : 'h-3 bg-[var(--border-strong)] group-hover:bg-[var(--text-muted)]'
                      }`}
                    />
                  </button>
                ))}
              </nav>

              {chapter === 0 && (
                <div aria-hidden="true" className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-[11px] text-[var(--text-muted)]">
                  Scroll
                  <span className="anim-float block w-px h-8 bg-gradient-to-b from-[var(--text-muted)] to-transparent" />
                </div>
              )}
            </div>
            {/* Every chapter, for screen readers and search engines */}
            <div className="sr-only">
              <h1>{CHAPTERS[0].title}</h1>
              {CHAPTERS.map((c) => (
                <section key={c.id}>
                  <h2>{c.title}</h2>
                  <p>{c.body}</p>
                </section>
              ))}
            </div>
          </div>
        ) : (
          <div className="pt-14">
            <section className="max-w-7xl mx-auto px-5 sm:px-8 pt-12 md:pt-16 pb-6 grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-6 md:gap-4 items-center md:min-h-[calc(100svh-3.5rem)]">
              <div>{copy(0, true, 'h1')}</div>
              <SceneStage chapter={0} parallax={!reduced} />
            </section>
            {CHAPTERS.slice(1, CHAPTER_COUNT - 1).map((c, n) => {
              const i = n + 1;
              return (
                <section key={c.id} className="max-w-7xl mx-auto px-5 sm:px-8 py-14 md:py-20 grid md:grid-cols-2 gap-8 md:gap-6 items-center">
                  <div className={i % 2 === 0 ? 'md:order-2' : ''}>{copy(i, false, 'h2')}</div>
                  <SceneStage chapter={i} className={i % 2 === 0 ? 'md:order-1' : ''} />
                </section>
              );
            })}
          </div>
        )}

        {/* Security */}
        <section id="security" className="max-w-7xl mx-auto px-5 sm:px-8 py-24 md:py-32 grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 lg:gap-20 border-t border-[var(--border-subtle)]">
          <div>
            <p className="eyebrow !text-[var(--accent-text)]">Under the hood</p>
            <h2 className="mt-4 text-[clamp(1.75rem,3.4vw,2.75rem)] font-semibold tracking-[-0.025em] leading-[1.08]">
              Built so the server does not have to be trusted.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-[var(--text-secondary)] max-w-md">
              The encryption happens in your browser, before anything is sent. A few honest limits are listed below, because you should know them.
            </p>
          </div>
          <div>
            <ol className="divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
              {FACTS.map((f, i) => (
                <li key={f.title} className="py-6 grid grid-cols-[2.5rem_1fr] gap-4">
                  <span className="font-mono text-xs text-[var(--text-muted)] pt-1">0{i + 1}</span>
                  <div>
                    <h3 className="text-base font-semibold">{f.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">{f.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-[13px] leading-relaxed text-[var(--text-muted)]">
              Limits: there is no forward secrecy yet, and each account has one device. Messages already on a device are readable by whoever holds it.
            </p>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="max-w-7xl mx-auto px-5 sm:px-8 py-24 md:py-32 border-t border-[var(--border-subtle)]">
          <p className="eyebrow !text-[var(--accent-text)]">What is in it</p>
          <h2 className="mt-4 text-[clamp(1.75rem,3.4vw,2.75rem)] font-semibold tracking-[-0.025em] leading-[1.08] max-w-2xl">
            Everything you need to talk, and nothing you did not ask for.
          </h2>
          <dl className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 border-t border-l border-[var(--border-subtle)]">
            {FEATURES.map(([name, text]) => (
              <div key={name} className="p-6 border-r border-b border-[var(--border-subtle)] hover:bg-[var(--surface-1)] transition-colors">
                <dt className="text-sm font-semibold">{name}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">{text}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Closing */}
        <section className="max-w-7xl mx-auto px-5 sm:px-8 py-24 md:py-32 border-t border-[var(--border-subtle)] flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h2 className="text-[clamp(2rem,4.6vw,3.5rem)] font-semibold tracking-[-0.03em] leading-[1.05]">Your conversations, kept yours.</h2>
            <p className="mt-4 text-[15px] text-[var(--text-secondary)] max-w-md">No ads, and nothing that reads your messages.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" size="lg" onClick={() => onOpenAuth('signin')}>
              Enter app
              <IconArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="tertiary" size="lg" onClick={() => onOpenAuth('signup')}>
              Create account
            </Button>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[12px] text-[var(--text-muted)]">
          <p>Private Chat. Messages and people shown on this page are illustrative.</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-[var(--text-primary)] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--text-primary)] transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
