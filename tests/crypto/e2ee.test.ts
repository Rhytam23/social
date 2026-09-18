import { describe, it, expect, beforeEach } from 'vitest';
import { ProtocolAddress } from '@signalapp/libsignal-client';
import {
  SignalKeyStore,
  generateDeviceKeys,
  establishOutboundSession,
  encrypt1to1Message,
  decrypt1to1Message,
  createGroupSenderKey,
  processReceivedGroupSenderKey,
  rotateGroupKeysForMembers,
  encryptGroupMessage,
  decryptGroupMessage,
  encryptAttachment,
  decryptAttachment,
  createKeyBackup,
  restoreKeyBackup,
} from '../../crypto';

function wasmToBuffer(u8: Uint8Array): Buffer {
  return Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength);
}

describe('End-to-End Encryption (E2EE) Signal Protocol Suite', () => {
  let aliceStore: SignalKeyStore;
  let bobStore: SignalKeyStore;
  let charlieStore: SignalKeyStore;

  const aliceAddress = ProtocolAddress.new('alice-user-id', 1);
  const bobAddress = ProtocolAddress.new('bob-user-id', 1);
  const charlieAddress = ProtocolAddress.new('charlie-user-id', 1);

  beforeEach(async () => {
    aliceStore = new SignalKeyStore();
    bobStore = new SignalKeyStore();
    charlieStore = new SignalKeyStore();

    await generateDeviceKeys(aliceStore, 1001, 1, 5);
  });

  // 1. Identity generation
  it('1. should generate valid cryptographic device identity keys', async () => {
    const bundle = await generateDeviceKeys(aliceStore, 1001, 1, 5);

    expect(bundle.registrationId).toBe(1001);
    expect(bundle.identityPublicKey).toBeTruthy();
    expect(bundle.signedPreKeyPublicKey).toBeTruthy();
    expect(bundle.oneTimePreKeys).toHaveLength(5);
  });

  // 2. Identity persistence
  it('2. should persist and export/import key store state', async () => {
    const exportedJson = await aliceStore.exportSerializedState();

    const restoredStore = new SignalKeyStore();
    await restoredStore.importSerializedState(exportedJson);

    const originalPair = await aliceStore.getIdentityKeyPair();
    const restoredPair = await restoredStore.getIdentityKeyPair();

    expect(
      wasmToBuffer(restoredPair!.publicKey.serialize()).equals(
        wasmToBuffer(originalPair!.publicKey.serialize())
      )
    ).toBe(true);
  });

  // 3. Session establishment
  it('3. should establish a 1-to-1 Signal session using prekey bundle', async () => {
    const bobPublicBundle = await generateDeviceKeys(bobStore, 2002, 1, 5);

    await establishOutboundSession(
      aliceAddress,
      bobAddress,
      {
        registrationId: bobPublicBundle.registrationId,
        deviceId: 1,
        identityPublicKeyB64: bobPublicBundle.identityPublicKey,
        signedPreKeyId: bobPublicBundle.signedPreKeyId,
        signedPreKeyPublicKeyB64: bobPublicBundle.signedPreKeyPublicKey,
        signedPreKeySignatureB64: bobPublicBundle.signedPreKeySignature,
        oneTimePreKeyId: bobPublicBundle.oneTimePreKeys[0].id,
        oneTimePreKeyPublicKeyB64: bobPublicBundle.oneTimePreKeys[0].publicKey,
        kyberPreKeyId: bobPublicBundle.kyberPreKeyId,
        kyberPreKeyPublicKeyB64: bobPublicBundle.kyberPreKeyPublicKey,
        kyberPreKeySignatureB64: bobPublicBundle.kyberPreKeySignature,
      },
      aliceStore
    );

    const session = await aliceStore.getSession(bobAddress);
    expect(session).not.toBeNull();
  });

  // 4. Message encryption & 5. Message decryption
  it('4 & 5. should encrypt and decrypt 1-to-1 messages successfully', async () => {
    const bobPublicBundle = await generateDeviceKeys(bobStore, 2002, 1, 5);

    await establishOutboundSession(
      aliceAddress,
      bobAddress,
      {
        registrationId: bobPublicBundle.registrationId,
        deviceId: 1,
        identityPublicKeyB64: bobPublicBundle.identityPublicKey,
        signedPreKeyId: bobPublicBundle.signedPreKeyId,
        signedPreKeyPublicKeyB64: bobPublicBundle.signedPreKeyPublicKey,
        signedPreKeySignatureB64: bobPublicBundle.signedPreKeySignature,
        oneTimePreKeyId: bobPublicBundle.oneTimePreKeys[0].id,
        oneTimePreKeyPublicKeyB64: bobPublicBundle.oneTimePreKeys[0].publicKey,
        kyberPreKeyId: bobPublicBundle.kyberPreKeyId,
        kyberPreKeyPublicKeyB64: bobPublicBundle.kyberPreKeyPublicKey,
        kyberPreKeySignatureB64: bobPublicBundle.kyberPreKeySignature,
      },
      aliceStore
    );

    const plaintext = 'Secret 1-to-1 message content';
    const encryptedPayload = await encrypt1to1Message(plaintext, aliceAddress, bobAddress, aliceStore);

    expect(encryptedPayload.ciphertext).not.toBe(plaintext);

    const decryptedText = await decrypt1to1Message(encryptedPayload, bobAddress, aliceAddress, bobStore);
    expect(decryptedText).toBe(plaintext);
  });

  // 6. Wrong-session failure
  it('6. should fail to decrypt message using wrong session store', async () => {
    const bobPublicBundle = await generateDeviceKeys(bobStore, 2002, 1, 5);

    await establishOutboundSession(
      aliceAddress,
      bobAddress,
      {
        registrationId: bobPublicBundle.registrationId,
        deviceId: 1,
        identityPublicKeyB64: bobPublicBundle.identityPublicKey,
        signedPreKeyId: bobPublicBundle.signedPreKeyId,
        signedPreKeyPublicKeyB64: bobPublicBundle.signedPreKeyPublicKey,
        signedPreKeySignatureB64: bobPublicBundle.signedPreKeySignature,
        kyberPreKeyId: bobPublicBundle.kyberPreKeyId,
        kyberPreKeyPublicKeyB64: bobPublicBundle.kyberPreKeyPublicKey,
        kyberPreKeySignatureB64: bobPublicBundle.kyberPreKeySignature,
      },
      aliceStore
    );

    const encryptedPayload = await encrypt1to1Message('Hello Bob', aliceAddress, bobAddress, aliceStore);

    // Charlie tries to decrypt Alice's message to Bob using Charlie's store
    await generateDeviceKeys(charlieStore, 3003, 1, 5);
    await expect(
      decrypt1to1Message(encryptedPayload, charlieAddress, aliceAddress, charlieStore)
    ).rejects.toThrow();
  });

  // 7. Ciphertext tampering
  it('7. should fail decryption if ciphertext is tampered with', async () => {
    const bobPublicBundle = await generateDeviceKeys(bobStore, 2002, 1, 5);

    await establishOutboundSession(
      aliceAddress,
      bobAddress,
      {
        registrationId: bobPublicBundle.registrationId,
        deviceId: 1,
        identityPublicKeyB64: bobPublicBundle.identityPublicKey,
        signedPreKeyId: bobPublicBundle.signedPreKeyId,
        signedPreKeyPublicKeyB64: bobPublicBundle.signedPreKeyPublicKey,
        signedPreKeySignatureB64: bobPublicBundle.signedPreKeySignature,
        kyberPreKeyId: bobPublicBundle.kyberPreKeyId,
        kyberPreKeyPublicKeyB64: bobPublicBundle.kyberPreKeyPublicKey,
        kyberPreKeySignatureB64: bobPublicBundle.kyberPreKeySignature,
      },
      aliceStore
    );

    const encryptedPayload = await encrypt1to1Message('Integrity check', aliceAddress, bobAddress, aliceStore);

    // Tamper ciphertext
    const tamperedBuffer = Buffer.from(encryptedPayload.ciphertext, 'base64');
    tamperedBuffer[tamperedBuffer.length - 1] ^= 0xff;
    encryptedPayload.ciphertext = tamperedBuffer.toString('base64');

    await expect(
      decrypt1to1Message(encryptedPayload, bobAddress, aliceAddress, bobStore)
    ).rejects.toThrow();
  });

  // 8. Metadata tampering
  it('8. should fail decryption if nonce/metadata is tampered with', async () => {
    const bobPublicBundle = await generateDeviceKeys(bobStore, 2002, 1, 5);

    await establishOutboundSession(
      aliceAddress,
      bobAddress,
      {
        registrationId: bobPublicBundle.registrationId,
        deviceId: 1,
        identityPublicKeyB64: bobPublicBundle.identityPublicKey,
        signedPreKeyId: bobPublicBundle.signedPreKeyId,
        signedPreKeyPublicKeyB64: bobPublicBundle.signedPreKeyPublicKey,
        signedPreKeySignatureB64: bobPublicBundle.signedPreKeySignature,
        kyberPreKeyId: bobPublicBundle.kyberPreKeyId,
        kyberPreKeyPublicKeyB64: bobPublicBundle.kyberPreKeyPublicKey,
        kyberPreKeySignatureB64: bobPublicBundle.kyberPreKeySignature,
      },
      aliceStore
    );

    const encryptedPayload = await encrypt1to1Message('Metadata check', aliceAddress, bobAddress, aliceStore);
    encryptedPayload.nonce = Buffer.from(JSON.stringify({ type: 999 }), 'utf-8').toString('base64');

    await expect(
      decrypt1to1Message(encryptedPayload, bobAddress, aliceAddress, bobStore)
    ).rejects.toThrow();
  });

  // 9. Private-key isolation
  it('9. should ensure private keys are never exposed in exported public bundles', async () => {
    const bundle = await generateDeviceKeys(aliceStore, 1001, 1, 5);

    const serializedBundle = JSON.stringify(bundle);
    expect(serializedBundle).not.toContain('privateKey');
    expect(serializedBundle).not.toContain('secretKey');
  });

  // 10. Multi-device behavior
  it('10. should handle distinct sessions per device ID for the same user', async () => {
    const bobDevice1Address = ProtocolAddress.new('bob-user-id', 1);
    const bobDevice2Address = ProtocolAddress.new('bob-user-id', 2);

    const bobDev1Bundle = await generateDeviceKeys(bobStore, 2001, 1, 5);
    const bobDev2Store = new SignalKeyStore();
    const bobDev2Bundle = await generateDeviceKeys(bobDev2Store, 2002, 1, 5);

    await establishOutboundSession(aliceAddress, bobDevice1Address, {
      registrationId: bobDev1Bundle.registrationId,
      deviceId: 1,
      identityPublicKeyB64: bobDev1Bundle.identityPublicKey,
      signedPreKeyId: bobDev1Bundle.signedPreKeyId,
      signedPreKeyPublicKeyB64: bobDev1Bundle.signedPreKeyPublicKey,
      signedPreKeySignatureB64: bobDev1Bundle.signedPreKeySignature,
      kyberPreKeyId: bobDev1Bundle.kyberPreKeyId,
      kyberPreKeyPublicKeyB64: bobDev1Bundle.kyberPreKeyPublicKey,
      kyberPreKeySignatureB64: bobDev1Bundle.kyberPreKeySignature,
    }, aliceStore);

    await establishOutboundSession(aliceAddress, bobDevice2Address, {
      registrationId: bobDev2Bundle.registrationId,
      deviceId: 2,
      identityPublicKeyB64: bobDev2Bundle.identityPublicKey,
      signedPreKeyId: bobDev2Bundle.signedPreKeyId,
      signedPreKeyPublicKeyB64: bobDev2Bundle.signedPreKeyPublicKey,
      signedPreKeySignatureB64: bobDev2Bundle.signedPreKeySignature,
      kyberPreKeyId: bobDev2Bundle.kyberPreKeyId,
      kyberPreKeyPublicKeyB64: bobDev2Bundle.kyberPreKeyPublicKey,
      kyberPreKeySignatureB64: bobDev2Bundle.kyberPreKeySignature,
    }, aliceStore);

    const msgDev1 = await encrypt1to1Message('Hello Bob Device 1', aliceAddress, bobDevice1Address, aliceStore);
    const msgDev2 = await encrypt1to1Message('Hello Bob Device 2', aliceAddress, bobDevice2Address, aliceStore);

    expect(await decrypt1to1Message(msgDev1, bobDevice1Address, aliceAddress, bobStore)).toBe('Hello Bob Device 1');
    expect(await decrypt1to1Message(msgDev2, bobDevice2Address, aliceAddress, bobDev2Store)).toBe('Hello Bob Device 2');
  });

  // 11. Group encryption & 12. Group membership rotation
  it('11 & 12. should encrypt group messages and enforce key rotation on member removal', async () => {
    const distIdV1 = '12345678-1234-4234-8234-123456789011';

    // Alice creates Sender Key for distribution V1
    const distMsgV1 = await createGroupSenderKey(aliceAddress, distIdV1, aliceStore);

    // Bob processes Alice's Sender Key
    await processReceivedGroupSenderKey(aliceAddress, distMsgV1, bobStore);

    // Alice encrypts group message
    const groupMsg = await encryptGroupMessage('Group announcement V1', aliceAddress, distIdV1, 1, aliceStore);

    // Bob decrypts
    const decryptedBob = await decryptGroupMessage(groupMsg, aliceAddress, bobStore);
    expect(decryptedBob).toBe('Group announcement V1');

    // Charlie was removed from group, so Charlie does NOT receive distMsgV1
    await generateDeviceKeys(charlieStore, 3003, 1, 5);
    await expect(
      decryptGroupMessage(groupMsg, aliceAddress, charlieStore)
    ).rejects.toThrow();

    // Rotate keys for V2 after member change
    const distIdV2 = '12345678-1234-4234-8234-123456789022';
    const bobBundle = await generateDeviceKeys(bobStore, 2002, 1, 5);
    await establishOutboundSession(aliceAddress, bobAddress, {
      registrationId: bobBundle.registrationId,
      deviceId: 1,
      identityPublicKeyB64: bobBundle.identityPublicKey,
      signedPreKeyId: bobBundle.signedPreKeyId,
      signedPreKeyPublicKeyB64: bobBundle.signedPreKeyPublicKey,
      signedPreKeySignatureB64: bobBundle.signedPreKeySignature,
      kyberPreKeyId: bobBundle.kyberPreKeyId,
      kyberPreKeyPublicKeyB64: bobBundle.kyberPreKeyPublicKey,
      kyberPreKeySignatureB64: bobBundle.kyberPreKeySignature,
    }, aliceStore);

    const envelopes = await rotateGroupKeysForMembers(
      'conv-group-id',
      distIdV2,
      2,
      aliceAddress,
      [{ userId: 'bob-user-id', deviceId: '1', address: bobAddress }],
      aliceStore
    );

    expect(envelopes).toHaveLength(1);

    // Bob decrypts envelope payload and processes V2 key
    const envelopePayload = JSON.parse(envelopes[0].encryptedDistributionMessage);
    const distMsgV2 = await decrypt1to1Message(envelopePayload, bobAddress, aliceAddress, bobStore);
    await processReceivedGroupSenderKey(aliceAddress, distMsgV2, bobStore);

    const groupMsgV2 = await encryptGroupMessage('Group announcement V2', aliceAddress, distIdV2, 2, aliceStore);
    expect(await decryptGroupMessage(groupMsgV2, aliceAddress, bobStore)).toBe('Group announcement V2');
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

  // 14. Backup encryption, 15. Restoration, 16. Incorrect password, 17. Backup tampering
  it('14, 15, 16 & 17. should encrypt/restore key store backup with Argon2id and reject wrong passphrases', async () => {
    const passphrase = 'SuperSecretMasterPassword123!';
    const backup = await createKeyBackup(passphrase, aliceStore);

    expect(backup.kdfParams.algorithm).toBe('Argon2id');
    expect(backup.ciphertextB64).toBeTruthy();

    // 15. Restoration with correct password
    const restoredStore = new SignalKeyStore();
    await restoreKeyBackup(passphrase, backup, restoredStore);

    const origPair = await aliceStore.getIdentityKeyPair();
    const restPair = await restoredStore.getIdentityKeyPair();
    expect(
      wasmToBuffer(restPair!.publicKey.serialize()).equals(
        wasmToBuffer(origPair!.publicKey.serialize())
      )
    ).toBe(true);

    // 16. Incorrect password failure
    await expect(
      restoreKeyBackup('WrongPassword!', backup, new SignalKeyStore())
    ).rejects.toThrow('Invalid passphrase or corrupted backup ciphertext');

    // 17. Tampered backup ciphertext failure
    const tamperedBackup = { ...backup };
    const buf = Buffer.from(tamperedBackup.ciphertextB64, 'base64');
    buf[0] ^= 0xff;
    tamperedBackup.ciphertextB64 = buf.toString('base64');

    await expect(
      restoreKeyBackup(passphrase, tamperedBackup, new SignalKeyStore())
    ).rejects.toThrow('Invalid passphrase or corrupted backup ciphertext');
  });
});
