# End-to-end encryption

This describes what the code in `crypto/` and `lib/messaging/` actually does, and where its protection stops.

## Goals

- The server, the database and anyone with access to them cannot read message text, attachment contents, file names or file types.
- Only the participants of a conversation can decrypt it.
- A tampered or wrongly addressed message fails to decrypt instead of producing garbage.

## Not goals

- Hiding **who talks to whom, and when**. Membership, timestamps and sizes are visible to the server.
- Forward secrecy or post-compromise security (see [Limitations](#limitations)).
- Protection on a device that is already compromised.

## Why libsodium and not Signal

The project originally called for `@signalapp/libsignal-client`. That package ships only native Node.js binaries and cannot run in a web page, and running it on the server would mean the server sees plaintext, which defeats the purpose. The cryptography is therefore built on [libsodium](https://doc.libsodium.org) (`libsodium-wrappers`, WebAssembly), which runs the same in the browser and in the tests. It is a simpler design than Signal's Double Ratchet, and gives up its forward secrecy. See [Decisions](DECISIONS.md#adr-001-libsodium-instead-of-libsignal).

## Primitives

| Purpose | Primitive | Where |
|---|---|---|
| 1:1 messages | `crypto_box`: X25519 key agreement + XSalsa20-Poly1305 | `crypto/messages/messageEncryptor.ts` |
| Group messages | `crypto_secretbox`: XSalsa20-Poly1305 with a per-group key | `crypto/groups/groupEncryptor.ts` |
| Delivering group keys | `crypto_box_seal`: anonymous sealed box to each member device | `crypto/groups/groupEncryptor.ts` |
| Attachments | AES-256-GCM (WebCrypto), fresh random key and IV per file | `crypto/attachments/attachmentEncryptor.ts` |
| Key backup | Argon2id (hash-wasm) → AES-256-GCM | `crypto/backup/keyBackup.ts` |
| Fingerprints, safety numbers | BLAKE2b (`crypto_generichash`) | `crypto/sessions/dhSession.ts` |

`encryption_version` is `2` for messages produced by this scheme. It is stored with every message so the format can change later.

## Keys

**Device identity key.** On first sign-in the browser generates an X25519 key pair (`crypto/identity/deviceKeys.ts`). The private key is stored in IndexedDB by `DeviceKeyStore` (`crypto/storage/keyStorage.ts`) and never leaves the device. The public key and a device id are published in `user_devices`.

`MessagingCrypto` (`lib/messaging/messagingCrypto.ts`) is the session-scoped object that loads the key store, registers the device, looks up other people's public keys, and encrypts and decrypts for the store.

## Direct messages

The sender encrypts with `crypto_box(message, nonce, recipientPublicKey, senderPrivateKey)` using a random nonce. The database stores `ciphertext` and `nonce`.

The shared secret is symmetric, so **either participant decrypts with their own private key and the other participant's public key**. This matters for reading your own sent messages: the code always uses the conversation's other participant's key, not the message author's (a bug in an early draft, now covered by a regression test).

## Group messages

1. The creator generates a random 32-byte group key (version 1).
2. It is sealed to each member's device public key with `crypto_box_seal` and stored per device in `group_key_envelopes` (`conversation_id`, `user_id`, `device_id`, `key_version`).
3. Messages are encrypted with `crypto_secretbox` under the group key. The `nonce` column holds JSON containing the nonce and the key version.
4. Whenever a member is **added or removed**, a new key version is generated and sealed to the current members. Removed members get no new key, and people who join later cannot decrypt earlier versions.

Any current member can distribute a key, because sealed boxes are anonymous and need no proof of who sealed them. Row level security only lets the recipient read their own envelopes, and only lets a member insert an envelope addressed to another current member's registered device.

## What is inside a message

The plaintext is a JSON envelope (`lib/messaging/envelope.ts`): the text, or for files the storage path, file name, type, size, decryption key and IV. Everything travels in the encrypted payload; no attachment metadata table exists. See [Architecture](ARCHITECTURE.md#message-payloads-envelopes).

## Attachments

The browser encrypts the file with a fresh AES-256-GCM key and IV, uploads only ciphertext to a private bucket, and puts the key inside the encrypted message. Recipients download the ciphertext and decrypt locally. Voice notes are the same, with a duration.

## Key backup

`Settings → Privacy & Security` exports a file containing your identity key encrypted with a key derived from your passphrase:

- Argon2id, 64 MiB memory, 3 iterations, parallelism 4, 16-byte random salt, 32-byte output
- AES-256-GCM with a random nonce
- JSON with a version, the KDF parameters, salt, nonce and ciphertext

Restoring on another browser with the file and passphrase gives that browser the same identity, so old messages can be read. A wrong passphrase or a modified file fails authentication. **There is no recovery without the file and passphrase.**

## Safety numbers

Each device has a fingerprint (BLAKE2b of its public key) and each conversation a safety number built from both parties' keys. Comparing them out of band is how you would detect a swapped key. The settings and conversation panels display real values. The "mark verified" button in the conversation inspector is not wired to anything yet.

## Limitations

- **No forward secrecy.** Each pair of users shares a long-lived secret derived from their long-lived keys. If a private key is ever stolen, every message that was ever exchanged with that person and captured as ciphertext can be decrypted. Groups have limited protection through key rotation, but earlier key versions are still held.
- **No post-compromise security.** Nothing heals after a key theft except replacing the key.
- **The server distributes public keys.** A malicious or compromised server could substitute a key and read new messages (a man-in-the-middle). Only comparing safety numbers reveals that.
- **One key per account in practice.** Signing in on a new browser creates a new device key unless a backup is restored, and the app looks up a single device per user, so there is no real multi-device support.
- **Anything that runs in your browser can reach the key.** A cross-site scripting bug would expose IndexedDB. The site sets clickjacking and content-type headers but has no Content Security Policy yet.
- **Key generation and Argon2id run on the main thread**, which can briefly freeze the interface on slow devices.
- **Metadata is not hidden**: participants, timing, message counts, ciphertext and attachment sizes.
- A group member who has never signed in has published no key, so they are skipped when a group key is distributed and cannot read the group until someone re-shares.

## Tests

`tests/crypto/e2ee.test.ts` and `tests/security/adversarial.test.ts` cover key generation, both directions of 1:1 encryption including reading your own messages, rejection of wrong keys, wrong recipients and tampered ciphertext, group key distribution and rotation, attachment round trips and tamper detection, and backup export/restore with wrong passphrases.
