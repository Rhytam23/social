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

## Keys and linking devices

**The account key.** The first time someone signs in on an account that has no key yet, the browser generates an X25519 key pair (`crypto/identity/deviceKeys.ts`) and a random device id. The private key is stored in IndexedDB by `DeviceKeyStore` (`crypto/storage/keyStorage.ts`) and only leaves the browser inside the passphrase-protected backup. The public key and device id are published in `user_devices`.

**Several devices, one key.** A person can use a phone and a computer (and more) at once. They do it by **sharing the one account key**, not by having one key per device. Everything in this design (direct-message keys, group key envelopes, history) is tied to that key, so a second browser that holds the same key reads the same chats, including old messages, with no protocol change.

How a second browser gets the key:

1. On the first device, export the key backup (Settings, Security).
2. Signing in on a new browser with no key: `MessagingCrypto` asks the database whether the account already has a registered key. If it does, the browser **does not create a new key** (that would make contacts encrypt to it and cut the first device off). It stops at the "Link this device" screen (`components/auth/LinkDevice.tsx`).
3. The person chooses the backup file and types its passphrase. The key is restored into that browser's IndexedDB and `completeLinking()` makes sure it is registered.
4. "Start fresh" is the alternative: it deletes the account's registered keys and creates a new one. Old messages become unreadable and contacts see a "security code changed" warning.

If the check for existing keys fails (for example the network is down), the browser refuses to continue instead of guessing.

**Limits.** The database allows at most **3 registered key rows per account** (migration `018`); this stops row spam and repeated key swapping. Because all devices hold the same key, the number of *browsers* is not limited, and "revoke device" in Settings only removes a registry row: it cannot take the key back from a browser that already has it. The trade-off of sharing one key is that **losing or compromising any linked device exposes the whole account**.

`MessagingCrypto` (`lib/messaging/messagingCrypto.ts`) is the session-scoped object that loads the key store, registers the key, looks up other people's public keys, and encrypts and decrypts for the store.

## Direct messages

The sender encrypts with `crypto_box(message, nonce, recipientPublicKey, senderPrivateKey)` using a random nonce. The database stores `ciphertext` and `nonce`.

The shared secret is symmetric, so **either participant decrypts with their own private key and the other participant's public key**. This matters for reading your own sent messages: the code always uses the conversation's other participant's key, not the message author's (a bug in an early draft, now covered by a regression test).

## Group messages

1. The creator generates a random 32-byte group key (version 1).
2. It is sealed to each member's device public key with `crypto_box_seal` and stored per device in `group_key_envelopes` (`conversation_id`, `user_id`, `device_id`, `key_version`).
3. Messages are encrypted with `crypto_secretbox` under the group key. The `nonce` column holds JSON containing the nonce and the key version.
4. Whenever a member is **added or removed**, a new key version is generated and sealed to the current members. Removed members get no new key, and people who join later cannot decrypt earlier versions.

Sealed boxes are anonymous: anyone who knows a public key can create one, and the recipient cannot tell who sealed it. That is why **who may create envelopes is restricted in the database**: since migration `017`, only a group **owner or admin** can insert an envelope, and only for an active member's registered device. Before that fix any member could plant an envelope, meaning a malicious member could hand a victim a group key the attacker already knew. Recipients can read only their own envelopes.

A member who has never signed in has no registered key and is skipped until they do.

## What is inside a message

The plaintext is a JSON envelope (`lib/messaging/envelope.ts`): the text, or for files the storage path, file name, type, size, decryption key and IV. Everything travels in the encrypted payload; no attachment metadata table exists. See [Architecture](ARCHITECTURE.md#message-payloads-envelopes).

## Attachments

The browser encrypts the file with a fresh AES-256-GCM key and IV, uploads only ciphertext to a private bucket (stored as `application/octet-stream` at `<conversationId>/<random uuid>_<safe name>`, at most 25 MB), and puts the key inside the encrypted message. Recipients download the ciphertext and decrypt locally. Voice notes are the same, with a duration.

## Key backup

`Settings → Privacy & Security` exports a file containing your identity key encrypted with a key derived from your passphrase:

- Argon2id, 64 MiB memory, 3 iterations, parallelism 4, 16-byte random salt, 32-byte output
- AES-256-GCM with a random nonce
- JSON with a version, the KDF parameters, salt, nonce and ciphertext

Restoring on another browser with the file and passphrase gives that browser the same key, so old messages can be read. This is also how a second device is linked (see above). A wrong passphrase or a modified file fails authentication. **There is no recovery without the file and passphrase.**

## Safety numbers

Each device has a fingerprint (BLAKE2b of its public key) and each conversation a safety number built from both parties' keys. Comparing them out of band is how you would detect a swapped key. The settings and conversation panels display real values. The "mark verified" button in the conversation inspector is not wired to anything yet.

## What the server can see

Message text, attachment names and types, reactions text, poll content and call contents are never visible. The server does see:

- who is in which conversation, community or channel, and when messages were sent
- **which message a thread reply belongs to** (`thread_root_id`) and **which message you saved** (`saved_messages`)
- **read receipts and unread positions**, unless you turn read receipts off (you then also stop seeing others')
- **the disappearing-message timer** of a conversation and each message's expiry time
- **who blocked whom**, and any report you file (its text only if you tick "include the text")
- who is online, and typing, on public Realtime channels while you have those features on (user ids and a status only)
- for calls: that a call signal was sent between two users. The offer, answer and network candidates are encrypted with the same keys as messages; the media itself is encrypted by WebRTC and goes browser to browser, or through your TURN relay, which sees only encrypted packets.

## Limitations

- **No forward secrecy.** Each pair of users shares a long-lived secret derived from their long-lived keys. If a private key is ever stolen, every message that was ever exchanged with that person and captured as ciphertext can be decrypted. Groups have limited protection through key rotation, but earlier key versions are still held.
- **No post-compromise security.** Nothing heals after a key theft except replacing the key.
- **The server distributes public keys.** A malicious or compromised server could substitute a key and read new messages (a man-in-the-middle). Only comparing safety numbers reveals that.
- **Devices share one key.** Multi-device works by copying the account key (via the backup) to each device, not by giving each device its own key and encrypting to all of them. Compromise of any one linked device exposes the account, and a key cannot be revoked from a device that already has it. A design with a key per device and fan-out encryption would fix this but needs a message-format change and a way for new devices to get group keys.
- **Anything that runs in your browser can reach the key.** A cross-site scripting bug would expose IndexedDB. The site sends a Content-Security-Policy that limits where scripts, images and connections may come from, but it still allows inline scripts (the framework needs them), so it reduces rather than removes this risk. The app lock is a screen lock, not encryption of the stored key.
- **Key generation and Argon2id run on the main thread**, which can briefly freeze the interface on slow devices.
- **Metadata is not hidden**: participants, timing, message counts, ciphertext and attachment sizes.
- A group member who has never signed in has published no key, so they are skipped when a group key is distributed and cannot read the group until an admin re-shares.
- **Old group key versions.** A device that only has the latest group key cannot read messages encrypted under an earlier version.

## Tests

`tests/crypto/e2ee.test.ts` and `tests/security/adversarial.test.ts` cover key generation, both directions of 1:1 encryption including reading your own messages, rejection of wrong keys, wrong recipients and tampered ciphertext, group key distribution and rotation, attachment round trips and tamper detection, and backup export/restore with wrong passphrases.

`tests/security/deviceLinking.test.ts` covers linking: an account that already has a key makes a new browser link instead of creating one, a failed check refuses to continue, restoring the backup gives the same key and device id, and a wrong passphrase or an empty backup is refused. It uses a stubbed database, not two real browsers. `tests/security/rls.test.ts` proves on a real Postgres that only group admins can create key envelopes.
