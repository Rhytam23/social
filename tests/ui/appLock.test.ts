import { describe, it, expect } from 'vitest';
import { checkPin, createPinRecord, isValidPin, loadPinRecord, lockoutMs, removePinRecord, savePinRecord, type KeyValueStore } from '../../lib/privacy/appLock';

function memoryStore(): KeyValueStore {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  };
}

describe('PIN validation', () => {
  it('accepts 4 to 8 digits only', () => {
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('12345678')).toBe(true);
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin('123456789')).toBe(false);
    expect(isValidPin('12a4')).toBe(false);
  });
});

describe('PIN record', () => {
  it('verifies the right PIN and rejects a wrong one', async () => {
    const record = await createPinRecord('4821');
    expect(await checkPin('4821', record)).toBe(true);
    expect(await checkPin('4822', record)).toBe(false);
  });

  it('never stores the PIN itself, and salts each record', async () => {
    const a = await createPinRecord('4821');
    const b = await createPinRecord('4821');
    expect(JSON.stringify(a)).not.toContain('4821');
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
  });

  it('rejects an invalid PIN when creating', async () => {
    await expect(createPinRecord('12')).rejects.toThrow();
  });

  it('round-trips through storage per user', async () => {
    const store = memoryStore();
    const record = await createPinRecord('9999');
    savePinRecord('u1', record, store);
    expect(loadPinRecord('u1', store)).toEqual(record);
    expect(loadPinRecord('u2', store)).toBeNull();
    removePinRecord('u1', store);
    expect(loadPinRecord('u1', store)).toBeNull();
  });
});

describe('lockoutMs', () => {
  it('is free for the first attempts, then backs off up to a cap', () => {
    expect(lockoutMs(0)).toBe(0);
    expect(lockoutMs(4)).toBe(0);
    expect(lockoutMs(5)).toBe(30_000);
    expect(lockoutMs(6)).toBe(60_000);
    expect(lockoutMs(30)).toBe(15 * 60_000);
  });
});
