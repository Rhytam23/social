import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import type { MessagingCrypto } from '../messaging/messagingCrypto';
import type { CallOutcome, MessageEnvelope } from '../messaging/envelope';

export type CallPhase = 'idle' | 'outgoing' | 'incoming' | 'connecting' | 'connected';

export interface CallState {
  phase: CallPhase;
  callId: string | null;
  peerId: string | null;
  peerName: string;
  conversationId: string | null;
  video: boolean;
  muted: boolean;
  cameraOff: boolean;
  startedAt: number | null;
  /** 'reconnecting' while the network path is being re-established. */
  link: 'idle' | 'connecting' | 'connected' | 'reconnecting';
  error: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  /** True when a TURN relay is configured (calls work behind strict firewalls). */
  relayAvailable: boolean;
  /** True when you have verified this contact's safety number. */
  verified: boolean;
}

export interface CallHooks {
  /** Looks up a contact we have a direct conversation with. */
  getPeer(userId: string): { name: string; conversationId: string; verified: boolean } | null;
  /** Called by the caller's side when a call ends, so it can be written into the chat as a call entry. */
  logCall(conversationId: string, callId: string, outcome: CallOutcome, video: boolean, durationMs?: number): void;
  /** False while the user is on Do Not Disturb or In a meeting: incoming calls are declined quietly. */
  canRing(): boolean;
  /** Ringtone control. */
  startRinging(): void;
  stopRinging(): void;
}

type Signal = 'offer' | 'answer' | 'ice' | 'hangup' | 'decline' | 'busy';

interface SignalPayload {
  callId: string;
  signal: Signal;
  video: boolean;
  sdp?: string;
  candidate?: RTCIceCandidateInit;
}

const RING_TIMEOUT_MS = 45_000;
const RECONNECT_GRACE_MS = 8_000;

const IDLE: CallState = {
  phase: 'idle',
  callId: null,
  peerId: null,
  peerName: '',
  conversationId: null,
  video: false,
  muted: false,
  cameraOff: false,
  startedAt: null,
  link: 'idle',
  error: null,
  localStream: null,
  remoteStream: null,
  relayAvailable: false,
  verified: false,
};

export const IDLE_CALL_STATE: CallState = IDLE;

/**
 * One-to-one voice and video calls.
 *
 * Signalling (offer, answer, ICE candidates, hang-up) travels over Supabase
 * Realtime broadcast, but every signal is first encrypted end to end with the
 * same authenticated keys as chat messages, so the server relaying it cannot
 * read or forge it. Media flows directly between the two browsers (or through
 * a TURN relay) and is encrypted by WebRTC (DTLS-SRTP).
 */
export class CallManager {
  private state: CallState = IDLE;
  private listeners = new Set<() => void>();
  private inbox: RealtimeChannel | null = null;
  private outbox = new Map<string, Promise<RealtimeChannel>>();
  private pc: RTCPeerConnection | null = null;
  private pendingOffer: { sdp: string; video: boolean } | null = null;
  private queuedIce: RTCIceCandidateInit[] = [];
  private ringTimer: ReturnType<typeof setTimeout> | null = null;
  private graceTimer: ReturnType<typeof setTimeout> | null = null;
  private isCaller = false;

  constructor(
    private supabase: SupabaseClient,
    private crypto: MessagingCrypto,
    private myId: string,
    private hooks: CallHooks
  ) {}

  // ---- store plumbing ----
  getState = (): CallState => this.state;
  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  };
  private set(patch: Partial<CallState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }

  // ---- lifecycle ----
  start(): void {
    this.inbox = this.supabase
      .channel(`pc-call:${this.myId}`, { config: { broadcast: { self: false }, private: true } })
      .on('broadcast', { event: 'signal' }, ({ payload }) => void this.receive(payload as { from: string; body: { ciphertext: string; nonce: string; encryptionVersion: number } }))
      .subscribe();
  }

  stop(): void {
    this.cleanup();
    if (this.inbox) void this.supabase.removeChannel(this.inbox);
    this.inbox = null;
    for (const p of this.outbox.values()) void p.then((c) => this.supabase.removeChannel(c));
    this.outbox.clear();
  }

  // ---- signalling ----
  private channelFor(peerId: string): Promise<RealtimeChannel> {
    let existing = this.outbox.get(peerId);
    if (!existing) {
      existing = new Promise<RealtimeChannel>((resolve, reject) => {
        const ch = this.supabase.channel(`pc-call:${peerId}`, { config: { broadcast: { self: false }, private: true } });
        const timeout = setTimeout(() => reject(new Error('Could not reach the call service')), 8000);
        ch.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout);
            resolve(ch);
          }
        });
      });
      this.outbox.set(peerId, existing);
    }
    return existing;
  }

  private async send(peerId: string, body: SignalPayload): Promise<void> {
    const envelope: MessageEnvelope = { v: 1, kind: 'call_signal', ...body };
    const encrypted = await this.crypto.encryptForRecipient(peerId, envelope);
    const ch = await this.channelFor(peerId);
    await ch.send({ type: 'broadcast', event: 'signal', payload: { from: this.myId, body: encrypted } });
  }

  private async receive(raw: { from: string; body: { ciphertext: string; nonce: string; encryptionVersion: number } }): Promise<void> {
    if (!raw?.from || raw.from === this.myId) return;
    let envelope: MessageEnvelope;
    try {
      envelope = await this.crypto.decryptWithParticipant(raw.from, raw.body);
    } catch {
      return; // not from a contact we share keys with, or tampered with: ignore silently
    }
    if (envelope.kind !== 'call_signal') return;
    const { callId, signal, video, sdp, candidate } = envelope;

    switch (signal) {
      case 'offer':
        return this.onOffer(raw.from, callId, video, sdp ?? '');
      case 'answer':
        if (callId !== this.state.callId || !this.pc || !sdp) return;
        if (this.ringTimer) clearTimeout(this.ringTimer);
        await this.pc.setRemoteDescription({ type: 'answer', sdp });
        await this.flushIce();
        this.set({ phase: 'connecting', link: 'connecting' });
        return;
      case 'ice':
        if (callId !== this.state.callId || !candidate) return;
        if (this.pc?.remoteDescription) await this.pc.addIceCandidate(candidate).catch(() => {});
        else this.queuedIce.push(candidate);
        return;
      case 'hangup':
        if (callId !== this.state.callId) return;
        return this.finish(this.state.phase === 'connected' ? 'ended' : 'missed', false);
      case 'decline':
      case 'busy':
        if (callId !== this.state.callId) return;
        return this.finish(signal === 'busy' ? 'busy' : 'declined', false);
    }
  }

  private async onOffer(from: string, callId: string, video: boolean, sdp: string): Promise<void> {
    const peer = this.hooks.getPeer(from);
    if (!peer || !sdp) return; // only people we have a chat with can ring us
    if (this.state.phase !== 'idle') {
      void this.send(from, { callId, signal: 'busy', video }).catch(() => {});
      return;
    }
    if (!this.hooks.canRing()) {
      void this.send(from, { callId, signal: 'decline', video }).catch(() => {});
      return;
    }
    this.isCaller = false;
    this.pendingOffer = { sdp, video };
    this.queuedIce = [];
    this.set({ ...IDLE, phase: 'incoming', callId, peerId: from, peerName: peer.name, conversationId: peer.conversationId, video, verified: peer.verified });
    this.hooks.startRinging();
    this.ringTimer = setTimeout(() => this.finish('missed', false), RING_TIMEOUT_MS);
  }

  // ---- WebRTC ----
  private async iceConfig(): Promise<{ iceServers: RTCIceServer[]; relayAvailable: boolean }> {
    try {
      const res = await fetch('/api/turn', { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch {
      // fall through to public STUN
    }
    return { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }], relayAvailable: false };
  }

  private async openMedia(video: boolean): Promise<MediaStream> {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser cannot make calls (no camera or microphone access).');
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: true, video });
    } catch (err) {
      const name = (err as DOMException)?.name;
      if (name === 'NotAllowedError') throw new Error(`Allow ${video ? 'camera and microphone' : 'the microphone'} access in your browser to make calls.`);
      if (name === 'NotFoundError') throw new Error(`No ${video ? 'camera or microphone' : 'microphone'} was found.`);
      throw new Error('Could not start your microphone or camera.');
    }
  }

  private async createConnection(peerId: string, callId: string, stream: MediaStream, video: boolean): Promise<void> {
    const cfg = await this.iceConfig();
    this.set({ relayAvailable: cfg.relayAvailable });
    const pc = new RTCPeerConnection({ iceServers: cfg.iceServers });
    this.pc = pc;
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    const remote = new MediaStream();
    pc.ontrack = (e) => {
      e.streams[0]?.getTracks().forEach((t) => remote.addTrack(t));
      if (!e.streams[0]) remote.addTrack(e.track);
      this.set({ remoteStream: remote });
    };
    pc.onicecandidate = (e) => {
      if (e.candidate) void this.send(peerId, { callId, signal: 'ice', video, candidate: e.candidate.toJSON() }).catch(() => {});
    };
    pc.oniceconnectionstatechange = () => {
      const s = pc.iceConnectionState;
      if (s === 'connected' || s === 'completed') {
        if (this.graceTimer) clearTimeout(this.graceTimer);
        this.set({ phase: 'connected', link: 'connected', startedAt: this.state.startedAt ?? Date.now(), error: null });
      } else if (s === 'disconnected') {
        this.set({ link: 'reconnecting' });
        this.graceTimer = setTimeout(() => this.failWith('The connection was lost.'), RECONNECT_GRACE_MS);
      } else if (s === 'failed') {
        this.failWith(cfg.relayAvailable ? 'The connection failed.' : 'The connection failed. Some networks need a relay server (TURN) for calls.');
      }
    };
  }

  private async flushIce(): Promise<void> {
    const pc = this.pc;
    if (!pc) return;
    for (const c of this.queuedIce.splice(0)) await pc.addIceCandidate(c).catch(() => {});
  }

  private failWith(message: string): void {
    const wasConnected = this.state.phase === 'connected';
    void this.finish(wasConnected ? 'ended' : 'missed', true, message);
  }

  // ---- user actions ----
  async startCall(peerId: string, video: boolean): Promise<void> {
    if (this.state.phase !== 'idle') return;
    const peer = this.hooks.getPeer(peerId);
    if (!peer) return;
    const callId = crypto.randomUUID();
    this.isCaller = true;
    this.queuedIce = [];
    this.set({ ...IDLE, phase: 'outgoing', callId, peerId, peerName: peer.name, conversationId: peer.conversationId, video, link: 'connecting', verified: peer.verified });

    try {
      const stream = await this.openMedia(video);
      this.set({ localStream: stream });
      await this.createConnection(peerId, callId, stream, video);
      const offer = await this.pc!.createOffer();
      await this.pc!.setLocalDescription(offer);
      await this.send(peerId, { callId, signal: 'offer', video, sdp: offer.sdp });
      this.ringTimer = setTimeout(() => void this.finish('missed', true), RING_TIMEOUT_MS);
    } catch (err) {
      this.cleanup();
      this.set({ ...IDLE, error: err instanceof Error ? err.message : 'Could not start the call.' });
    }
  }

  async accept(): Promise<void> {
    const { callId, peerId, video } = this.state;
    const offer = this.pendingOffer;
    if (this.state.phase !== 'incoming' || !callId || !peerId || !offer) return;
    this.hooks.stopRinging();
    if (this.ringTimer) clearTimeout(this.ringTimer);
    this.set({ phase: 'connecting', link: 'connecting' });
    try {
      const stream = await this.openMedia(video);
      this.set({ localStream: stream });
      await this.createConnection(peerId, callId, stream, video);
      await this.pc!.setRemoteDescription({ type: 'offer', sdp: offer.sdp });
      await this.flushIce();
      const answer = await this.pc!.createAnswer();
      await this.pc!.setLocalDescription(answer);
      await this.send(peerId, { callId, signal: 'answer', video, sdp: answer.sdp });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not answer the call.';
      void this.send(peerId, { callId, signal: 'decline', video }).catch(() => {});
      this.cleanup();
      this.set({ ...IDLE, error: message });
    }
  }

  decline(): void {
    const { callId, peerId, video } = this.state;
    if (this.state.phase !== 'incoming' || !callId || !peerId) return;
    void this.send(peerId, { callId, signal: 'decline', video }).catch(() => {});
    this.hooks.stopRinging();
    this.cleanup();
    this.set({ ...IDLE });
  }

  hangup(): void {
    void this.finish(this.state.phase === 'connected' ? 'ended' : 'missed', true);
  }

  toggleMute(): void {
    const next = !this.state.muted;
    this.state.localStream?.getAudioTracks().forEach((t) => (t.enabled = !next));
    this.set({ muted: next });
  }

  toggleCamera(): void {
    if (!this.state.video) return;
    const next = !this.state.cameraOff;
    this.state.localStream?.getVideoTracks().forEach((t) => (t.enabled = !next));
    this.set({ cameraOff: next });
  }

  clearError(): void {
    this.set({ error: null });
  }

  // ---- ending ----
  /**
   * Ends the call. `notifyPeer` sends a hang-up; the caller's side writes the call entry into the chat
   * (only one side logs it, so it appears once).
   */
  private async finish(outcome: CallOutcome, notifyPeer: boolean, error?: string): Promise<void> {
    const { callId, peerId, conversationId, video, startedAt, phase } = this.state;
    if (phase === 'idle' || !callId || !peerId) return;
    if (notifyPeer) await this.send(peerId, { callId, signal: 'hangup', video }).catch(() => {});

    const durationMs = startedAt ? Date.now() - startedAt : undefined;
    if (this.isCaller && conversationId) this.hooks.logCall(conversationId, callId, outcome, video, durationMs);

    this.hooks.stopRinging();
    this.cleanup();
    this.set({ ...IDLE, error: error ?? null });
  }

  private cleanup(): void {
    if (this.ringTimer) clearTimeout(this.ringTimer);
    if (this.graceTimer) clearTimeout(this.graceTimer);
    this.ringTimer = this.graceTimer = null;
    this.state.localStream?.getTracks().forEach((t) => t.stop());
    this.pc?.close();
    this.pc = null;
    this.pendingOffer = null;
    this.queuedIce = [];
  }
}
