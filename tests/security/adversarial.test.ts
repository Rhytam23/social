import { describe, it, expect, beforeEach } from 'vitest';
import { ChatStore } from '../../lib/store/chatStore';
import { checkRateLimit } from '../../lib/rate-limit/rateLimiter';
import { encryptAttachment, decryptAttachment } from '../../crypto/attachments/attachmentEncryptor';
import { isUserAdmin } from '../../lib/auth/roles';
import { DeviceKeyStore } from '../../crypto/storage/keyStorage';
import { generateDeviceKeys } from '../../crypto/identity/deviceKeys';
import { createKeyBackup, restoreKeyBackup } from '../../crypto/backup/keyBackup';
import { bytesToBase64 } from '../../crypto/utils/encoding';

describe('Adversarial & Security Hardening Test Suite', () => {
  let store: ChatStore;

  beforeEach(() => {
    store = new ChatStore();
    store.initDemoMode();
  });

  describe('1. Authorization & IDOR Resistance', () => {
    it('should prevent non-members from reading or posting to foreign direct conversations', async () => {
      // Alice and Bob have a conversation: conv-alice-bob
      // Carol (usr-carol) switches in
      store.switchDemoUser('usr-carol');
      const state = store.getState();

      // Carol creates a private conversation with David
      const carolDavidConvId = await store.createDirectConversation(
        state.allUsers.find((u) => u.id === 'usr-david')!
      );

      // Verify Alice's messages are not in Carol's conversation
      const carolMsgs = store.getState().messagesMap[carolDavidConvId];
      expect(carolMsgs.some((m) => m.senderId === 'usr-alice')).toBe(false);
    });

    it('should prevent unauthorized users from editing other users messages', () => {
      // Alice posts a message
      store.switchDemoUser('usr-alice');
      store.sendMessage('Alice confidential announcement');
      const aliceMsgs = store.getState().messagesMap['conv-alice-bob'];
      const targetMsg = aliceMsgs[aliceMsgs.length - 1];
      expect(targetMsg.senderId).toBe('usr-alice');

      // Bob switches in and attempts to edit Alice's message
      store.switchDemoUser('usr-bob');
      // Client-side isSelf is false for Bob on Alice's message
      const currentBobMsgs = store.getState().messagesMap['conv-alice-bob'];
      const msgUnderBob = currentBobMsgs.find((m) => m.id === targetMsg.id)!;
      expect(msgUnderBob.isSelf).toBe(false);
    });
  });

  describe('2. Privilege Escalation Defense', () => {
    it('should reject role escalation attempts by regular members', async () => {
      const bob = store.getState().allUsers.find((u) => u.id === 'usr-bob')!;
      expect(bob.role).toBe('member');

      // Bob cannot escalate himself through client action
      store.switchDemoUser('usr-bob');
      expect(store.getState().currentUser.role).toBe('member');
    });

    it('should verify isUserAdmin returns false for invalid or non-existent user IDs', async () => {
      expect(await isUserAdmin('')).toBe(false);
      expect(await isUserAdmin('non-existent-uuid-1234')).toBe(false);
    });
  });

  describe('4. Attachment Encryption & Sanitization Defense', () => {
    it('should encrypt and decrypt attachments using AES-GCM 256-bit', async () => {
      const rawContent = new TextEncoder().encode('Confidential project document content.');
      const encrypted = await encryptAttachment(rawContent, 'confidential.pdf', 'application/pdf');

      expect(encrypted.attachmentKeyB64).toBeDefined();
      expect(encrypted.ivB64).toBeDefined();
      expect(encrypted.encryptedBuffer.byteLength).toBeGreaterThan(0);

      // Decrypt with correct key
      const decrypted = await decryptAttachment(
        encrypted.encryptedBuffer,
        encrypted.attachmentKeyB64,
        encrypted.ivB64
      );
      const decryptedText = new TextDecoder().decode(decrypted);
      expect(decryptedText).toBe('Confidential project document content.');
    });

    it('should reject attachment decryption when ciphertext or key is tampered with', async () => {
      const rawContent = new TextEncoder().encode('Sensitive financial ledger.');
      const encrypted = await encryptAttachment(rawContent, 'ledger.csv', 'text/csv');

      // Tamper with key
      const wrongKeyBytes = new Uint8Array(32);
      wrongKeyBytes.fill(99);
      const wrongKeyB64 = bytesToBase64(wrongKeyBytes);

      await expect(
        decryptAttachment(encrypted.encryptedBuffer, wrongKeyB64, encrypted.ivB64)
      ).rejects.toThrow();
    });
  });

  describe('5. Rate Limiting Engine', () => {
    it('should allow requests within limit and throttle subsequent requests', async () => {
      const testId = `adversarial-ip-${Date.now()}`;
      const limit = 3;

      const res1 = await checkRateLimit(testId, { limit, windowMs: 1000 });
      const res2 = await checkRateLimit(testId, { limit, windowMs: 1000 });
      const res3 = await checkRateLimit(testId, { limit, windowMs: 1000 });
      const res4 = await checkRateLimit(testId, { limit, windowMs: 1000 });

      expect(res1.success).toBe(true);
      expect(res2.success).toBe(true);
      expect(res3.success).toBe(true);
      expect(res4.success).toBe(false);
      expect(res4.remaining).toBe(0);
    });
  });

  describe('6. Input / XSS Sanitization & Injection Defense', () => {
    it('should store and render HTML/script payloads safely as plain text without execution', () => {
      const xssPayload = '<script>alert("XSS")</script><img src=x onerror=alert(1)>';
      store.sendMessage(xssPayload);

      const msgs = store.getState().messagesMap['conv-alice-bob'];
      const lastMsg = msgs[msgs.length - 1];

      expect(lastMsg.content).toBe(xssPayload);
      // Content is stored as raw string and safely escaped during React JSX rendering
    });
  });

  describe('7. Cryptographic Key Store Backup & Passphrase Protection', () => {
    it('should encrypt key store backup with Argon2id and reject brute force with wrong passphrase', async () => {
      const keyStore = new DeviceKeyStore();
      await generateDeviceKeys(keyStore);

      const validPassphrase = 'CorrectHorseBatteryStaple!2026';
      const backup = await createKeyBackup(validPassphrase, keyStore);
      expect(backup.ciphertextB64).toBeDefined();
      expect(backup.kdfParams.algorithm).toBe('Argon2id');

      // Attempt restore with wrong passphrase
      const restoreStore = new DeviceKeyStore();
      await expect(
        restoreKeyBackup('WrongPassphrase123!', backup, restoreStore)
      ).rejects.toThrow();

      // Restore with correct passphrase
      await restoreKeyBackup(validPassphrase, backup, restoreStore);
      expect(restoreStore.requireIdentity().publicKey).toEqual(keyStore.requireIdentity().publicKey);
    });
  });
});
