import { describe, it, expect, beforeEach } from 'vitest';
import {
  DeviceKeyStore,
  generateDeviceKeys,
  registerPeerKey,
  computeDeviceFingerprint,
  computeSafetyNumber,
  encrypt1to1Message,
  decrypt1to1Message,
  generateGroupKey,
  distributeGroupKey,
  unwrapGroupKeyEnvelope,
  encryptGroupMessage,
  decryptGroupMessage,
  encryptAttachment,
  decryptAttachment,
  createKeyBackup,
  restoreKeyBackup,
  bytesToBase64,
  base64ToBytes,
} from '../../crypto';

describe('End-to-End Encryption (E2EE) Suite (libsodium X25519 / XSalsa20-Poly1305)', () => {
  let aliceStore: DeviceKeyStore;
  let bobStore: DeviceKeyStore;
  let charlieStore: DeviceKeyStore;

  beforeEach(async () => {
    aliceStore = new DeviceKeyStore();
    bobStore = new DeviceKeyStore();
    charlieStore = new DeviceKeyStore();

    await generateDeviceKeys(aliceStore);
  });

  // 1. Identity generation
  it('1. should generate valid X25519 device identity keys', async () => {
    const bundle = await generateDeviceKeys(new DeviceKeyStore());
    expect(bundle.deviceId).toBeTruthy();
    expect(bundle.identityPublicKey).toBeTruthy();
    expect(base64ToBytes(bundle.identityPublicKey)).toHaveLength(32);
  });

  // 2. Identity persistence
  it('2. should persist and export/import key store state', async () => {
    const exportedJson = aliceStore.exportSerializedState();

    const restoredStore = new DeviceKeyStore();
    restoredStore.importSerializedState(exportedJson);

    expect(restoredStore.requireIdentity().publicKey).toEqual(aliceStore.requireIdentity().publicKey);
    expect(restoredStore.requireIdentity().privateKey).toEqual(aliceStore.requireIdentity().privateKey);
  });

  // 3. Peer key registration ("session establishment" for a public-key scheme)
  it('3. should register a peer device public key for later use', async () => {
    const bobBundle = await generateDeviceKeys(bobStore);
    registerPeerKey(aliceStore, 'bob-user-id', bobBundle.deviceId, bobBundle.identityPublicKey);

    const cached = aliceStore.getPeerKey('bob-user-id', bobBundle.deviceId);
    expect(cached).toEqual(base64ToBytes(bobBundle.identityPublicKey));
  });

  // 4 & 5. Message encryption & decryption
  it('4 & 5. should encrypt and decrypt 1-to-1 messages successfully', async () => {
    const bobBundle = await generateDeviceKeys(bobStore);

    const plaintext = 'Secret 1-to-1 message content';
    const encryptedPayload = await encrypt1to1Message(
      plaintext,
      bytesToBase64(aliceStore.requireIdentity().privateKey),
      bobBundle.identityPublicKey
    );

    expect(encryptedPayload.ciphertext).not.toBe(plaintext);
    expect(encryptedPayload.ciphertext).not.toBe(bytesToBase64(new TextEncoder().encode(plaintext)));

    const decryptedText = await decrypt1to1Message(
      encryptedPayload,
      bytesToBase64(bobStore.requireIdentity().privateKey),
      bytesToBase64(aliceStore.requireIdentity().publicKey)
    );
    expect(decryptedText).toBe(plaintext);
  });

  // 5b. Sender can decrypt their own sent message (shared secret is symmetric)
  it('5b. should let the sender decrypt their own sent message using the recipient\'s public key', async () => {
    const bobBundle = await generateDeviceKeys(bobStore);

    const encryptedPayload = await encrypt1to1Message(
      'A message Alice sent to Bob',
      bytesToBase64(aliceStore.requireIdentity().privateKey),
      bobBundle.identityPublicKey
    );

    // Alice re-reads her own sent message (e.g. after a realtime echo or a
    // history reload) using the SAME key pair she encrypted it with: her own
    // private key + Bob's public key. This must not require Bob's private key.
    const decrypted = await decrypt1to1Message(
      encryptedPayload,
      bytesToBase64(aliceStore.requireIdentity().privateKey),
      bobBundle.identityPublicKey
    );
    expect(decrypted).toBe('A message Alice sent to Bob');
  });

  // 6. Wrong-recipient failure
  it('6. should fail to decrypt message using the wrong recipient private key', async () => {
    const bobBundle = await generateDeviceKeys(bobStore);
    await generateDeviceKeys(charlieStore);

    const encryptedPayload = await encrypt1to1Message(
      'Hello Bob',
      bytesToBase64(aliceStore.requireIdentity().privateKey),
      bobBundle.identityPublicKey
    );

    await expect(
      decrypt1to1Message(
        encryptedPayload,
        bytesToBase64(charlieStore.requireIdentity().privateKey),
        bytesToBase64(aliceStore.requireIdentity().publicKey)
      )
    ).rejects.toThrow();
  });

  // 7. Ciphertext tampering
  it('7. should fail decryption if ciphertext is tampered with', async () => {
    const bobBundle = await generateDeviceKeys(bobStore);

    const encryptedPayload = await encrypt1to1Message(
      'Integrity check',
      bytesToBase64(aliceStore.requireIdentity().privateKey),
      bobBundle.identityPublicKey
    );

    const tamperedBytes = base64ToBytes(encryptedPayload.ciphertext);
    tamperedBytes[tamperedBytes.length - 1] ^= 0xff;
    encryptedPayload.ciphertext = bytesToBase64(tamperedBytes);

    await expect(
      decrypt1to1Message(
        encryptedPayload,
        bytesToBase64(bobStore.requireIdentity().privateKey),
        bytesToBase64(aliceStore.requireIdentity().publicKey)
      )
    ).rejects.toThrow();
  });

  // 8. Nonce tampering
  it('8. should fail decryption if the nonce is tampered with', async () => {
    const bobBundle = await generateDeviceKeys(bobStore);

    const encryptedPayload = await encrypt1to1Message(
      'Nonce check',
      bytesToBase64(aliceStore.requireIdentity().privateKey),
      bobBundle.identityPublicKey
    );

    const tamperedNonce = base64ToBytes(encryptedPayload.nonce);
    tamperedNonce[0] ^= 0xff;
    encryptedPayload.nonce = bytesToBase64(tamperedNonce);

    await expect(
      decrypt1to1Message(
        encryptedPayload,
        bytesToBase64(bobStore.requireIdentity().privateKey),
        bytesToBase64(aliceStore.requireIdentity().publicKey)
      )
    ).rejects.toThrow();
  });

  // 9. Private-key isolation
  it('9. should ensure private keys are never exposed in exported public bundles', async () => {
    const bundle = await generateDeviceKeys(new DeviceKeyStore());
    const serializedBundle = JSON.stringify(bundle);
    expect(serializedBundle).not.toContain('privateKey');
    expect(Object.keys(bundle)).not.toContain('privateKey');
  });

  // 10. Multi-device behavior
  it('10. should handle distinct keys per device for the same user', async () => {
    const bobDev1Store = new DeviceKeyStore();
    const bobDev2Store = new DeviceKeyStore();
    const bobDev1Bundle = await generateDeviceKeys(bobDev1Store);
    const bobDev2Bundle = await generateDeviceKeys(bobDev2Store);

    expect(bobDev1Bundle.deviceId).not.toBe(bobDev2Bundle.deviceId);
    expect(bobDev1Bundle.identityPublicKey).not.toBe(bobDev2Bundle.identityPublicKey);

    const msgDev1 = await encrypt1to1Message(
      'Hello Bob Device 1',
      bytesToBase64(aliceStore.requireIdentity().privateKey),
      bobDev1Bundle.identityPublicKey
    );
    const msgDev2 = await encrypt1to1Message(
      'Hello Bob Device 2',
      bytesToBase64(aliceStore.requireIdentity().privateKey),
      bobDev2Bundle.identityPublicKey
    );

    expect(
      await decrypt1to1Message(
        msgDev1,
        bytesToBase64(bobDev1Store.requireIdentity().privateKey),
        bytesToBase64(aliceStore.requireIdentity().publicKey)
      )
    ).toBe('Hello Bob Device 1');
    expect(
      await decrypt1to1Message(
        msgDev2,
        bytesToBase64(bobDev2Store.requireIdentity().privateKey),
        bytesToBase64(aliceStore.requireIdentity().publicKey)
      )
    ).toBe('Hello Bob Device 2');
  });

  // 11 & 12. Group encryption & membership rotation
  it('11 & 12. should encrypt group messages and enforce key rotation on member removal', async () => {
    const bobBundle = await generateDeviceKeys(bobStore);
    const charlieBundle = await generateDeviceKeys(charlieStore);

    const groupKeyV1 = await generateGroupKey();
    const envelopesV1 = await distributeGroupKey(groupKeyV1, 1, [
      { userId: 'bob-user-id', deviceId: bobBundle.deviceId, publicKeyB64: bobBundle.identityPublicKey },
      { userId: 'charlie-user-id', deviceId: charlieBundle.deviceId, publicKeyB64: charlieBundle.identityPublicKey },
    ]);

    const bobEnvelope = envelopesV1.find((e) => e.recipientUserId === 'bob-user-id')!;
    const bobGroupKey = await unwrapGroupKeyEnvelope(
      bobEnvelope.encryptedGroupKey,
      bobBundle.identityPublicKey,
      bytesToBase64(bobStore.requireIdentity().privateKey)
    );

    const groupMsgV1 = await encryptGroupMessage('Group announcement V1', groupKeyV1, 1);
    expect(await decryptGroupMessage(groupMsgV1, bobGroupKey)).toBe('Group announcement V1');

    // Rotate keys for V2 after Charlie is removed from the group.
    const groupKeyV2 = await generateGroupKey();
    const envelopesV2 = await distributeGroupKey(groupKeyV2, 2, [
      { userId: 'bob-user-id', deviceId: bobBundle.deviceId, publicKeyB64: bobBundle.identityPublicKey },
    ]);

    expect(envelopesV2).toHaveLength(1);

    const groupMsgV2 = await encryptGroupMessage('Group announcement V2', groupKeyV2, 2);

    // Charlie was removed: he never receives the V2 envelope, so his cached
    // V1 key cannot decrypt the V2 message.
    await expect(decryptGroupMessage(groupMsgV2, groupKeyV1)).rejects.toThrow();

    const bobGroupKeyV2 = await unwrapGroupKeyEnvelope(
      envelopesV2[0].encryptedGroupKey,
      bobBundle.identityPublicKey,
      bytesToBase64(bobStore.requireIdentity().privateKey)
    );
    expect(await decryptGroupMessage(groupMsgV2, bobGroupKeyV2)).toBe('Group announcement V2');
  });

  // 13. Attachment encryption
  it('13. should encrypt and decrypt file attachments locally', async () => {
    const rawFileText = 'Binary PDF document payload content';
    const fileBytes = new TextEncoder().encode(rawFileText);

    const encrypted = await encryptAttachment(fileBytes, 'doc.pdf', 'application/pdf');

    expect(encrypted.encryptedBuffer.byteLength).toBeGreaterThan(0);
    expect(encrypted.attachmentKeyB64).toHaveLength(44); // 32 bytes base64

    const decryptedBuffer = await decryptAttachment(
      encrypted.encryptedBuffer,
      encrypted.attachmentKeyB64,
      encrypted.ivB64
    );

    const decryptedText = new TextDecoder().decode(decryptedBuffer);
    expect(decryptedText).toBe(rawFileText);
  });

  // 14, 15, 16 & 17. Backup encryption, restoration, wrong password, tampering
  it('14, 15, 16 & 17. should encrypt/restore key store backup with Argon2id and reject wrong passphrases', async () => {
    const passphrase = 'SuperSecretMasterPassword123!';
    const backup = await createKeyBackup(passphrase, aliceStore);

    expect(backup.kdfParams.algorithm).toBe('Argon2id');
    expect(backup.ciphertextB64).toBeTruthy();

    // 15. Restoration with correct password
    const restoredStore = new DeviceKeyStore();
    await restoreKeyBackup(passphrase, backup, restoredStore);
    expect(restoredStore.requireIdentity().publicKey).toEqual(aliceStore.requireIdentity().publicKey);

    // 16. Incorrect password failure
    await expect(
      restoreKeyBackup('WrongPassword!', backup, new DeviceKeyStore())
    ).rejects.toThrow('Invalid passphrase or corrupted backup ciphertext');

    // 17. Tampered backup ciphertext failure
    const tamperedBackup = { ...backup };
    const buf = base64ToBytes(tamperedBackup.ciphertextB64);
    buf[0] ^= 0xff;
    tamperedBackup.ciphertextB64 = bytesToBase64(buf);

    await expect(
      restoreKeyBackup(passphrase, tamperedBackup, new DeviceKeyStore())
    ).rejects.toThrow('Invalid passphrase or corrupted backup ciphertext');
  });

  // 18. Safety number / fingerprint verification
  it('18. should compute a stable, order-independent safety number for two parties', async () => {
    const bobBundle = await generateDeviceKeys(bobStore);
    const aliceFingerprint = await computeDeviceFingerprint(
      bytesToBase64(aliceStore.requireIdentity().publicKey)
    );
    expect(aliceFingerprint).toMatch(/^[0-9A-F-]+$/);

    const numberAB = await computeSafetyNumber(
      bytesToBase64(aliceStore.requireIdentity().publicKey),
      bobBundle.identityPublicKey
    );
    const numberBA = await computeSafetyNumber(
      bobBundle.identityPublicKey,
      bytesToBase64(aliceStore.requireIdentity().publicKey)
    );
    expect(numberAB).toBe(numberBA);
  });
});
