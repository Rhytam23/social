'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CARDS, type CardSpec } from './sceneContent';
import { Avatar } from '../ui/avatar';
import { IconFile, IconLock } from '../ui/icons';

/**
 * The same objects as the WebGL scene, built from ordinary DOM and laid out
 * with CSS 3D. Shown while the scene loads, and instead of it for anyone who
 * prefers reduced motion, has no WebGL, or is on a weak device or connection.
 * Keep the look in step with paintCards.ts.
 */

function Chip({ children, tone = 'accent', lock }: { children: React.ReactNode; tone?: 'accent' | 'neutral'; lock?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 h-5 text-[10.5px] font-semibold ${
        tone === 'accent' ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)]' : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
      }`}
    >
      {lock && <IconLock className="w-2.5 h-2.5" />}
      {children}
    </span>
  );
}

function Face({ spec, back }: { spec: CardSpec; back?: boolean }) {
  switch (spec.kind) {
    case 'message':
      return (
        <div className="relative h-full px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Avatar name={spec.name ?? '?'} size="xs" className="[&>span]:!w-[26px] [&>span]:!h-[26px]" />
            <div className="leading-tight">
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">{spec.name}</p>
              <p className="text-[11px] text-[var(--text-muted)]">{spec.time}</p>
            </div>
            <IconLock className="ml-auto w-[11px] h-[11px] text-[var(--text-muted)]" />
          </div>
          <p className="mt-2.5 text-[14px] leading-[19px] text-[var(--text-primary)]">{spec.text}</p>
          {spec.reaction && (
            <span className="absolute right-3 bottom-2.5">
              <Chip tone="neutral">{spec.reaction}</Chip>
            </span>
          )}
        </div>
      );
    case 'profile':
      return (
        <div className="h-full flex flex-col items-center pt-6 px-5 text-center">
          <Avatar name={spec.name ?? '?'} size="lg" className="[&>span]:!w-[60px] [&>span]:!h-[60px] [&>span]:!text-lg" />
          <p className="mt-3 text-[16px] font-semibold text-[var(--text-primary)]">{spec.name}</p>
          <p className="text-[12px] font-mono text-[var(--text-muted)]">@{spec.handle}</p>
          <p className="mt-2 text-[12.5px] leading-[17px] text-[var(--text-secondary)]">{spec.text}</p>
          <span className="mt-auto mb-4">
            <Chip lock>{spec.tag}</Chip>
          </span>
        </div>
      );
    case 'channels':
      return (
        <div className="h-full">
          <div className="flex items-center gap-2.5 px-4 h-[54px] border-b border-[var(--border-subtle)]">
            <Avatar name={spec.name ?? '?'} size="xs" />
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">{spec.name}</p>
          </div>
          <p className="px-4 pt-3.5 text-[10px] font-semibold tracking-wider text-[var(--text-muted)]">CHANNELS</p>
          <ul className="px-2 pt-2">
            {(spec.lines ?? []).map((row, i) => {
              const [label, unread] = row.split('|');
              const isLock = label.startsWith('lock ');
              return (
                <li
                  key={row}
                  className={`h-8 mb-1.5 px-2 flex items-center gap-2 rounded-lg text-[13.5px] ${
                    i === 0 ? 'bg-[var(--surface-hover)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                  } ${unread ? 'font-semibold' : ''}`}
                >
                  {isLock ? <IconLock className="w-3 h-3" /> : <span className="text-[var(--text-muted)]">#</span>}
                  <span className="flex-1 truncate">{isLock ? label.slice(5) : label.slice(2)}</span>
                  {unread && (
                    <span className="min-w-[26px] h-[18px] rounded-full bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-[10.5px] font-bold flex items-center justify-center">
                      {unread}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      );
    case 'file':
      return (
        <div className="relative h-full flex items-center gap-3 px-4">
          <span className="w-[46px] h-[46px] rounded-[10px] bg-[var(--accent-subtle)] text-[var(--accent-text)] flex items-center justify-center">
            <IconFile className="w-5 h-5" />
          </span>
          <div className="leading-tight">
            <p className="text-[13px] font-semibold text-[var(--text-primary)]">{spec.name}</p>
            <p className="text-[11.5px] text-[var(--text-muted)]">{spec.text}</p>
          </div>
          <span className="absolute right-3 bottom-2.5">
            <Chip lock>{spec.tag}</Chip>
          </span>
        </div>
      );
    case 'call':
      return (
        <div className="h-full flex items-center gap-3 px-4">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--success)]" />
          <div className="leading-tight">
            <p className="text-[13px] font-semibold text-[var(--text-primary)]">{spec.name}</p>
            <p className="text-[11.5px] font-mono text-[var(--text-muted)]">{spec.text}</p>
          </div>
          <span className="ml-auto w-7 h-7 rounded-full bg-[var(--danger-neutral)] flex items-center justify-center">
            <span className="w-3.5 h-[3px] rounded bg-white" />
          </span>
        </div>
      );
    case 'envelope':
      return back ? (
        <div className="h-full px-4 py-3">
          <p className="flex items-center gap-2 text-[11px] font-medium text-[var(--accent-text)]">
            <IconLock className="w-3 h-3" /> What the server stores
          </p>
          <div className="mt-2 font-mono text-[13px] leading-[15px] text-[var(--accent-text)]/70">
            {(spec.lines ?? []).map((l) => (
              <p key={l}>{l}</p>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-full px-4 py-3">
          <p className="flex items-center gap-2 text-[11px] font-medium text-[var(--text-muted)]">
            <IconLock className="w-3 h-3 text-[var(--accent-text)]" /> {spec.name} · on your device
          </p>
          <p className="mt-3 text-[19px] leading-[25px] font-medium text-[var(--text-primary)]">{spec.text}</p>
        </div>
      );
    case 'post': {
      const isPrivate = spec.tag === 'Private';
      return (
        <div className="relative h-full px-4 py-3">
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-primary)]">
            {isPrivate ? <IconLock className="w-3 h-3 text-[var(--text-muted)]" /> : <span className="text-[var(--text-muted)]">#</span>}
            {spec.name?.replace('# ', '')}
            <span className="ml-auto">
              <Chip tone={isPrivate ? 'neutral' : 'accent'} lock={isPrivate}>
                {spec.tag}
              </Chip>
            </span>
          </div>
          <p className="mt-3 text-[13.5px] leading-[18px] text-[var(--text-secondary)]">{spec.text}</p>
        </div>
      );
    }
  }
}

const UNIT = 100;

function cardStyle(spec: CardSpec, chapter: number): React.CSSProperties {
  const pose = spec.poses[chapter];
  const [x, y, z] = pose.p;
  const [rx, ry, rz] = pose.r;
  return {
    width: spec.w * UNIT,
    height: spec.h * UNIT,
    marginLeft: -(spec.w * UNIT) / 2,
    marginTop: -(spec.h * UNIT) / 2,
    opacity: pose.o,
    visibility: pose.o < 0.02 ? 'hidden' : 'visible',
    transform: `translate3d(${x * UNIT}px, ${-y * UNIT}px, ${z * UNIT}px) rotateX(${-rx}rad) rotateY(${ry}rad) rotateZ(${-rz}rad) scale(${pose.s})`,
  };
}

/**
 * One chapter of the story as a still. The stage is a fixed 1040 x 620 px
 * canvas scaled to fit its container, so the composition matches the 3D one.
 */
export const SceneStage: React.FC<{ chapter: number; className?: string; parallax?: boolean }> = ({ chapter, className = '', parallax }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.6);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  // The story chapters are tighter clusters than the hero, so they are shown a little larger.
  const zoom = chapter === 0 ? 1 : 1.25;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const fit = () => setK(Math.min(1, el.clientWidth / 1040));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!parallax) return;
    const onMove = (e: PointerEvent) => setTilt({ x: (e.clientX / window.innerWidth - 0.5) * 2, y: (e.clientY / window.innerHeight - 0.5) * 2 });
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [parallax]);

  return (
    <div ref={wrapRef} data-theme="dark" className={`relative w-full ${className}`} style={{ height: 620 * k }} aria-hidden="true">
      <div
        className="absolute left-1/2 top-1/2"
        style={{ width: 1040, height: 620, transform: `translate(-50%, -50%) scale(${k * zoom})`, perspective: 920, perspectiveOrigin: '50% 45%' }}
      >
        <div
          className="absolute inset-0"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateY(${tilt.x * 5}deg) rotateX(${-tilt.y * 3}deg)`,
            transition: 'transform 300ms var(--ease-out)',
          }}
        >
          {CARDS.map((spec) => {
            const isSelf = !!spec.self;
            return (
              <div
                key={spec.id}
                className={`absolute left-1/2 top-1/2 rounded-[14px] border overflow-hidden ${
                  isSelf ? 'bg-[#0f202b] border-[rgba(75,163,211,0.38)]' : 'bg-[#14171c] border-white/10'
                } shadow-[0_18px_40px_rgba(0,0,0,0.45)]`}
                style={{ ...cardStyle(spec, chapter), transition: 'transform 600ms var(--ease-out), opacity 400ms' }}
              >
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />
                <Face spec={spec} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
