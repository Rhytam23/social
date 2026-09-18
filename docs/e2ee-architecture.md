# End-to-End Encryption (E2EE) Architecture Documentation

**Platform:** `private-chat`  
**Cryptographic Protocol:** Signal Protocol (X3DH + Double Ratchet + Signal Sender Keys)  
**Primary Package:** `@signalapp/libsignal-client`  
**Backup KDF Package:** `hash-wasm` (Argon2id)

---

## 1. Executive Summary & Core Guarantees

The `private-chat` platform implements client-side End-to-End Encryption (E2EE) using Signal Messenger's official Rust/WASM library (`@signalapp/libsignal-client`). 

Plaintext message content, unencrypted attachments, and private keys **never** reach Supabase databases, servers, or logs. All message encryption, key derivation, and file encryption occur strictly on the user's client device.

---

## 2. Cryptographic Library & Package Versions

- **Primary E2EE Engine:** `@signalapp/libsignal-client` (Official Signal Rust/WASM package)
- **Backup Key Derivation:** `hash-wasm` (WASM-based Argon2id implementation)
- **Attachment Symmetric Encryption:** Web Crypto API (`crypto.subtle` AES-256-GCM)

---

## 3. Key Hierarchy & Device Identity

Each user device manages a distinct set of cryptographic key pairs stored locally in client-side storage (`crypto/storage/keyStorage.ts`):

1. **Identity KeyPair (`IdentityKeyPair`):** Long-term X25519 keypair uniquely identifying the user's device.
2. **Signed PreKey (`SignedPreKeyRecord`):** Medium-term public key signed with the device's Identity Private Key to prevent MITM attacks during async session setup.
3. **One-Time PreKeys (`PreKeyRecord`):** Ephemeral single-use keys published to `user_devices` for initial asynchronous X3DH key agreement.
4. **Sender Keys (`SenderKeyRecord`):** Per-group message keys distributed over pairwise Signal sessions for group message encryption.

> **Storage Isolation Rule:** Private key material (`IdentityKeyPair`, `SignedPreKeyRecord` private key, `PreKeyRecord` private keys, `SenderKeyRecord` private ratchets) is persisted exclusively on-device in browser `IndexedDB`. Only public key bundles (`identityPublicKey`, `signedPreKeyPublicKey`, `signedPreKeySignature`, `oneTimePreKeys`) are published to the `user_devices` table.

---

## 4. 1-to-1 Session Establishment & Message Encryption

### Initial Key Agreement (X3DH)
When User A initiates a 1-to-1 conversation with User B:
1. User A fetches User B's public prekey bundle from `user_devices`.
2. User A executes `establishOutboundSession` (`processPreKeyBundle`), performing X3DH key agreement to establish a pairwise `SessionRecord`.
3. User A encrypts the plaintext message via `signalEncrypt()`. The output `CiphertextMessage` contains message bytes, ephemeral keys, and counter headers.
4. User A sends `{ ciphertext, nonce, encryptionVersion: 1 }` to Supabase.
5. User B receives the payload and executes `signalDecrypt()` or `signalDecryptPreKey()`, advancing the Double Ratchet to compute the matching message decryption key.

---

## 5. Group Encryption & Key Rotation

Group messaging uses Signal's **Sender Keys** protocol (`groupEncrypt`, `groupDecrypt`):

1. **Sender Key Generation:** The conversation creator generates a `SenderKeyRecord` for a specific `distributionId` using `createGroupSenderKey()`.
2. **Key Envelope Distribution:** The sender creates a `SenderKeyDistributionMessage` and encrypts it individually for each active group member device using 1-to-1 Signal sessions (`rotateGroupKeysForMembers()`). The resulting encrypted envelopes are stored in `group_key_envelopes`.
3. **Group Message Encryption:** Group messages are encrypted locally via `encryptGroupMessage()`, producing a `SenderKeyMessage` payload.
4. **Key Rotation on Member Removal / Addition:** When a group member leaves or is removed:
   - A new `distributionId` (UUID) and `key_version` are generated.
   - A new `SenderKeyRecord` is initialized.
   - The new distribution message is distributed **only** to remaining active member devices.
   - Removed members do not receive the new distribution message and are cryptographically incapable of decrypting future group messages.

---

## 6. Client-Side Attachment Encryption

Attachments (images, audio, files) are encrypted before uploading to Supabase Storage:

1. **Local Key Generation:** A fresh 32-byte secret key and 12-byte random IV are generated locally per file (`crypto.getRandomValues()`).
2. **Encryption:** The client encrypts the file `ArrayBuffer` via AES-256-GCM (`encryptAttachment()`).
3. **Storage Upload:** Only the encrypted file ciphertext blob is uploaded to Supabase Storage.
4. **Key Transmission:** The 32-byte attachment key and IV are included inside the E2EE Signal message payload (which is itself encrypted end-to-end). Supabase Storage never possesses the attachment key.

---

## 7. Passphrase Key Backup Architecture

Users can generate an encrypted backup of their local E2EE key store (`createKeyBackup()`):

- **Key Derivation:** **Argon2id** (`timeCost = 3`, `memoryCost = 65536` [64 MB], `parallelism = 4`, `hashLength = 32`) with a fresh 16-byte random salt.
- **Symmetric Encryption:** AES-256-GCM with a fresh 12-byte random IV per backup.
- **Backup Object:** `{ version: 1, kdfParams, saltB64, nonceB64, ciphertextB64 }`.
- **Security:** The user's master password is never stored or transmitted. The server stores only the encrypted backup blob. Without the correct passphrase, AES-GCM tag verification fails upon restoration attempt.

---

## 8. Threat Model & Security Boundaries

### Protected Boundaries
- **Database & Storage Compromise:** Database operators or compromise vectors cannot read message text or decrypt file attachments.
- **Network Interception (MITM):** E2EE protects message payloads independently of TLS/HTTPS transport security.
- **Unauthorized Group Access:** Forward & backward secrecy enforced via versioned group key rotation.

### Unprotected Boundaries (Out of Scope for E2EE)
- **Compromised End-User Devices:** Malware or memory dumps on an infected client device can inspect plaintext in the DOM or extract local IndexedDB keys.
- **Recipient Exfiltration:** Authorized message recipients can take screenshots or copy decrypted text.
- **Traffic Metadata:** Routing metadata (`conversation_id`, `sender_id`, `created_at`, message counts) remains visible to the server for delivery and RLS enforcement.
