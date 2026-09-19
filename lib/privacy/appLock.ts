import { useSyncExternalStore } from 'react';

/**
 * App lock: a PIN screen in front of the app on this device.
 *
 * Honest scope: it stops someone who picks up your unlocked phone or laptop
 * from reading your chats. It does not encrypt the keys stored in this
 * browser (a person with developer tools access to the profile could still
 * reach them), so it is a convenience lock, not full-disk protection.
 */

export interface PinRecord {
  salt: string;
  hash: string;
  iterations: number;
}

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const ITERATIONS = 310_000;
const MAX_FREE_ATTEMPTS = 5;

const toB64 = (bytes: ArrayBuffer | Uint8Array): string => {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  arr.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
};
const fromB64 = (b64: string): Uint8Array => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

async function derive(pin: string, salt: Uint8Array, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' }, key, 256);
  return toB64(bits);
}

export function isValidPin(pin: string): boolean {
  return /^\d{4,8}$/.test(pin);
}

export async function createPinRecord(pin: string): Promise<PinRecord> {
  if (!isValidPin(pin)) throw new Error('Use 4 to 8 digits');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt: toB64(salt), hash: await derive(pin, salt, ITERATIONS), iterations: ITERATIONS };
}

export async function checkPin(pin: string, record: PinRecord): Promise<boolean> {
  const hash = await derive(pin, fromB64(record.salt), record.iterations);
  // Constant-time-ish comparison of two equal-length base64 strings.
  if (hash.length !== record.hash.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ record.hash.charCodeAt(i);
  return diff === 0;
}

/** How long to make the user wait after `failures` wrong PINs in a row (none for the first few). */
export function lockoutMs(failures: number): number {
  if (failures < MAX_FREE_ATTEMPTS) return 0;
  return Math.min(30_000 * 2 ** (failures - MAX_FREE_ATTEMPTS), 15 * 60_000);
}

// ---- persistence (per user, this device only) ----
const recordKey = (userId: string) => `pc_lock_pin_${userId}`;

export function loadPinRecord(userId: string, store: KeyValueStore = localStorage): PinRecord | null {
  try {
    const raw = store.getItem(recordKey(userId));
    return raw ? (JSON.parse(raw) as PinRecord) : null;
  } catch {
    return null;
  }
}

export function savePinRecord(userId: string, record: PinRecord, store: KeyValueStore = localStorage) {
  store.setItem(recordKey(userId), JSON.stringify(record));
}

export function removePinRecord(userId: string, store: KeyValueStore = localStorage) {
  store.removeItem(recordKey(userId));
}

// ---- runtime lock state ----
let locked = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function lockNow() {
  if (!locked) {
    locked = true;
    emit();
  }
}

export function unlock() {
  if (locked) {
    locked = false;
    emit();
  }
}

export function useLocked(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => locked,
    () => false
  );
}
