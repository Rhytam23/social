'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { CallState } from '../../lib/calls/CallManager';
import { Avatar } from '../ui/avatar';
import { IconCheck, IconLock, IconMic, IconPhone, IconX } from '../ui/icons';

export interface CallOverlayProps {
  state: CallState;
  onAccept: () => void;
  onDecline: () => void;
  onHangup: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
}

function useStream(ref: React.RefObject<HTMLMediaElement | null>, stream: MediaStream | null) {
  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) ref.current.srcObject = stream;
  }, [ref, stream]);
}

function formatElapsed(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

const roundBtn = 'w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-colors';

/** Incoming ring, outgoing ring, and the in-call screen (full screen on phones, floating card on desktop). */
export const CallOverlay: React.FC<CallOverlayProps> = ({ state, onAccept, onDecline, onHangup, onToggleMute, onToggleCamera }) => {
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const remoteAudio = useRef<HTMLAudioElement>(null);
  const localVideo = useRef<HTMLVideoElement>(null);
  const [now, setNow] = useState(Date.now());

  useStream(remoteVideo, state.video ? state.remoteStream : null);
  useStream(remoteAudio, state.video ? null : state.remoteStream);
  useStream(localVideo, state.video ? state.localStream : null);

  useEffect(() => {
    if (state.phase !== 'connected') return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [state.phase]);

  if (state.phase === 'idle') return null;

  const kind = state.video ? 'video' : 'voice';
  const status =
    state.phase === 'incoming'
      ? `Incoming ${kind} call`
      : state.phase === 'outgoing'
      ? 'Calling…'
      : state.link === 'reconnecting'
      ? 'Reconnecting…'
      : state.phase === 'connecting'
      ? 'Connecting…'
      : state.startedAt
      ? formatElapsed(now - state.startedAt)
      : 'Connected';

  return (
    <div
      data-theme="dark"
      role="dialog"
      aria-modal="true"
      aria-label={`${status} with ${state.peerName}`}
      className="fixed z-[80] inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-[26rem] md:h-[34rem] md:rounded-3xl overflow-hidden bg-[#0b1220] text-white shadow-[var(--shadow-pop)] flex flex-col font-sans animate-in slide-in-from-bottom"
    >
      {state.video && state.phase !== 'incoming' && (
        <video ref={remoteVideo} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover bg-black" aria-label={`${state.peerName}'s video`} />
      )}
      <audio ref={remoteAudio} autoPlay />

      <div className={`relative z-10 flex-1 flex flex-col items-center px-6 pt-12 gap-3 text-center ${state.video && state.phase === 'connected' ? 'bg-gradient-to-b from-black/50 to-transparent' : ''}`}>
        {(!state.video || state.phase !== 'connected') && (
          <div className={`rounded-full ${state.phase === 'incoming' || state.phase === 'outgoing' ? 'anim-ring' : ''}`}>
            <Avatar name={state.peerName || '?'} size="xl" />
          </div>
        )}
        <h2 className="text-xl font-bold">{state.peerName}</h2>
        <p role="status" className="text-sm text-white/80">{status}</p>

        <p className="flex items-center gap-1.5 text-[11px] text-white/70">
          <IconLock className="w-3 h-3" />
          {state.verified ? 'End-to-end encrypted, contact verified' : 'End-to-end encrypted, contact not verified yet'}
        </p>
        {!state.relayAvailable && state.phase !== 'incoming' && state.link !== 'connected' && (
          <p className="text-[10px] text-white/50 max-w-xs">No relay server is set up, so this call may not connect on some strict networks.</p>
        )}
      </div>

      {state.video && state.localStream && state.phase !== 'incoming' && (
        <video
          ref={localVideo}
          autoPlay
          playsInline
          muted
          aria-label="Your camera"
          className={`absolute z-20 top-4 right-4 w-24 h-32 md:w-28 md:h-36 rounded-xl object-cover border border-white/20 bg-black ${state.cameraOff ? 'opacity-30' : ''}`}
        />
      )}

      <div className="relative z-10 p-6 pb-8 flex items-center justify-center gap-5 bg-black/50">
        {state.phase === 'incoming' ? (
          <>
            <button onClick={onDecline} aria-label="Decline call" className={`${roundBtn} bg-rose-600 hover:bg-rose-500 w-14 h-14`}>
              <IconX className="w-6 h-6" />
            </button>
            <button onClick={onAccept} aria-label="Accept call" className={`${roundBtn} bg-emerald-500 hover:bg-emerald-400 w-14 h-14 text-black`}>
              <IconCheck className="w-6 h-6" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onToggleMute}
              aria-pressed={state.muted}
              aria-label={state.muted ? 'Unmute microphone' : 'Mute microphone'}
              className={`${roundBtn} ${state.muted ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)]' : 'bg-white/15 hover:bg-white/25'}`}
            >
              <IconMic className="w-5 h-5" />
            </button>
            {state.video && (
              <button
                onClick={onToggleCamera}
                aria-pressed={state.cameraOff}
                aria-label={state.cameraOff ? 'Turn camera on' : 'Turn camera off'}
                className={`${roundBtn} ${state.cameraOff ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)]' : 'bg-white/15 hover:bg-white/25'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.5-2.5v9L15 14m-9 4h7a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            )}
            <button onClick={onHangup} aria-label="End call" className={`${roundBtn} bg-rose-600 hover:bg-rose-500 w-14 h-14`}>
              <IconPhone className="w-6 h-6 rotate-[135deg]" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
