import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { MessagingCrypto } from '../../lib/messaging/messagingCrypto';
import { createKeyBackup, restoreKeyBackup, DeviceKeyStore } from '../../crypto';

/**
 * A browser with no key must not silently create a new identity when the account already has
 * one (that would cut the first device off). It must ask to be linked instead.
 */

interface Call {
  table: string;
  op: string;
  args: unknown[];
}

function fakeSupabase(existingDevices: number, countError = false) {
  const calls: Call[] = [];
  const from = (table: string) => {
    let op = 'select';
    const builder: Record<string, unknown> = {};
    const chain = (name: string) => (...args: unknown[]) => {
      if (['select', 'upsert', 'update', 'delete'].includes(name)) {
        op = name;
        calls.push({ table, op: name, args });
      }
      return builder;
    };
    for (const m of ['select', 'upsert', 'update', 'delete', 'eq', 'order', 'limit']) builder[m] = chain(m);
    builder.then = (resolve: (v: unknown) => void) =>
      resolve(op === 'select' ? { count: countError ? null : existingDevices, error: countError ? { message: 'boom' } : null } : { error: null });
    return builder;
  };
  return { client: { from } as unknown as SupabaseClient, calls };
}

describe('linking a new browser to an account', () => {
  it('a brand-new account gets an identity registered', async () => {
    const { client, calls } = fakeSupabase(0);
    const crypto = new MessagingCrypto(client as never, 'u1');
    await crypto.waitReady();
    expect(crypto.needsLink()).toBe(false);
    expect(crypto.hasIdentity()).toBe(true);
    expect(calls.some((c) => c.op === 'upsert' && c.table === 'user_devices')).toBe(true);
  });

  it('an account that already has an identity makes this browser link instead of minting a key', async () => {
    const { client, calls } = fakeSupabase(1);
    const crypto = new MessagingCrypto(client as never, 'u1');
    await crypto.waitReady();
    expect(crypto.needsLink()).toBe(true);
    expect(crypto.hasIdentity()).toBe(false);
    expect(calls.some((c) => c.op === 'upsert')).toBe(false);
  });

  it('if the device check fails it refuses to continue rather than minting a key', async () => {
    const { client, calls } = fakeSupabase(0, true);
    const crypto = new MessagingCrypto(client as never, 'u1');
    await expect(crypto.waitReady()).rejects.toThrow(/Could not check/);
    expect(calls.some((c) => c.op === 'upsert')).toBe(false);
  });

  it('restoring the first device backup gives this browser the same identity and registers it', async () => {
    // First device.
    const first = fakeSupabase(0);
    const device1 = new MessagingCrypto(first.client as never, 'u1');
    await device1.waitReady();
    const backup = await createKeyBackup('correct horse battery', device1.getKeyStore());

    // Second browser: account already has a device, so it must link.
    const second = fakeSupabase(1);
    const device2 = new MessagingCrypto(second.client as never, 'u1');
    await device2.waitReady();
    expect(device2.needsLink()).toBe(true);

    await restoreKeyBackup('correct horse battery', backup, device2.getKeyStore());
    await device2.completeLinking(null);

    expect(device2.needsLink()).toBe(false);
    expect(device2.myDeviceId()).toBe(device1.myDeviceId());
    expect(device2.myPublicKeyB64()).toBe(device1.myPublicKeyB64());
  });

  it('a wrong passphrase does not link', async () => {
    const first = fakeSupabase(0);
    const device1 = new MessagingCrypto(first.client as never, 'u1');
    await device1.waitReady();
    const backup = await createKeyBackup('correct horse battery', device1.getKeyStore());
    await expect(restoreKeyBackup('wrong passphrase!!', backup, new DeviceKeyStore())).rejects.toThrow(/Invalid passphrase/);
  });

  it('linking an empty key store is refused', async () => {
    const { client } = fakeSupabase(1);
    const crypto = new MessagingCrypto(client as never, 'u1');
    await crypto.waitReady();
    await expect(crypto.completeLinking(null)).rejects.toThrow(/does not contain an account key/);
  });
});
