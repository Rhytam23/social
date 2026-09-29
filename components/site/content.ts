/**
 * What the public pages say, as data. Every statement describes what the product does today; the sources are
 * docs/E2EE.md, docs/SECURITY.md and docs/TROUBLESHOOTING.md. Keep this in step with them.
 */

export const PROTECTIONS: Array<[string, string]> = [
  ['Encrypted on your device', 'Direct messages use X25519 key exchange with XSalsa20-Poly1305 (libsodium). Attachments use AES-256-GCM. The plaintext never leaves your device.'],
  ['Keys that stay with you', 'Your private key lives in your browser. A backup protected by a passphrase (Argon2id) lets you restore your history on a new device, or link a second one.'],
  ['Groups that rotate keys', 'Each group and channel shares one key, sealed separately to every member. It changes when someone leaves, so they cannot read what comes next.'],
  ['What the server can see', 'Who is in a conversation, when messages are sent and how large they are. Not what they say. Search runs on your device, over messages already on it.'],
];

export const SERVER_CAN_SEE = [
  'Who is in which conversation, group or community, and when messages were sent.',
  'How large messages and files are (not what they contain).',
  'Which message a thread reply belongs to, and which messages you saved.',
  'Read receipts and unread positions, unless you turn read receipts off.',
  'The disappearing-message timer of a conversation.',
  'Who blocked whom, and any report you send (its text only if you choose to include it).',
  'Who is online, and typing, while you have those features on.',
];

export const SERVER_CANNOT_SEE = [
  'The text of your messages.',
  'The contents, names and types of your files and voice notes.',
  'Your private key or the passphrase of your backup.',
  'The audio and video of calls, which go between browsers (or through a relay that only sees encrypted packets).',
];

export const LIMITS = [
  'There is no forward secrecy yet: someone who obtains your key could read messages they also obtained.',
  'Your devices share one account key, which you link with your passphrase backup. Losing or compromising one linked device exposes the account.',
  'The server hands out public keys, so a compromised server could substitute one. Comparing safety numbers with the other person is how you would notice.',
  'Messages already on a device are readable by whoever holds and unlocks it. The app lock is a screen lock, not extra encryption.',
  'Who talks to whom, and when, is visible to the server.',
  'The software has not had an independent security audit.',
];

export const FEATURE_GROUPS: Array<{ title: string; items: Array<[string, string]> }> = [
  {
    title: 'Messaging',
    items: [
      ['Direct messages', 'One-to-one chats with replies, reactions, read receipts and saved messages. Read receipts and typing indicators can be switched off.'],
      ['Threads', 'Reply in a thread under a message so a busy conversation stays readable.'],
      ['Search', 'Search your chats and within a conversation. It runs on your device, over messages already on it.'],
      ['Disappearing messages', 'Delete new messages after 24 hours, 7 days or 90 days, per chat.'],
    ],
  },
  {
    title: 'Groups and communities',
    items: [
      ['Groups and roles', 'Owner, admin and member roles, admin-only posting, and a group key that changes when people leave.'],
      ['Communities', 'A community holds public and private channels, with invite links and roles. Every channel is end-to-end encrypted.'],
    ],
  },
  {
    title: 'Calls and files',
    items: [
      ['Voice and video calls', 'One-to-one calls with encrypted signalling. Media goes directly between the two browsers, or through a relay that only sees encrypted packets.'],
      ['Files and voice notes', 'Encrypted in your browser before they upload. Images up to 10 MB, other files up to 25 MB, and videos up to 100 MB where the service allows it.'],
    ],
  },
  {
    title: 'Privacy and safety',
    items: [
      ['Block and report', 'Block someone so they cannot message you. Report a message to the administrators, optionally with its text.'],
      ['App lock', 'Protect the screen with a PIN when you step away.'],
      ['Safety numbers', 'Compare a short code with the other person to check that nobody swapped keys.'],
    ],
  },
  {
    title: 'Your devices',
    items: [
      ['More than one device', 'Link a phone and a computer to the same account with your passphrase-protected key backup.'],
      ['Light, dark or your device setting', 'Follows your device by default; you can choose.'],
    ],
  },
];

export const FAQ: Array<{ topic: string; items: Array<{ q: string; a: string }> }> = [
  {
    topic: 'Privacy',
    items: [
      { q: 'What can the service see about my messages?', a: 'Only ciphertext: who is in a conversation, when messages are sent and how large they are. It cannot read the text, your files or your voice notes. See the Security page for the full list.' },
      { q: 'Can the administrators read my chats?', a: 'No. Messages are encrypted with keys that stay in your browser, so administrators cannot read them either. They can see reports that someone chose to send, and the metadata described above.' },
    ],
  },
  {
    topic: 'Sign in and devices',
    items: [
      { q: 'After I sign in it says "Link this device". What is that?', a: 'This browser has no encryption key, but your account already has one on another device. Nook does not create a second key, because that would cut your first device off. Choose the key backup file you exported on the first device and type its passphrase.' },
      { q: 'How do I back up my key?', a: 'In the app, open Settings, then Security, and export a backup. It is protected by a passphrase you choose. Keep the file and the passphrase safe: without them there is no recovery.' },
      { q: 'I cleared my browser data or lost my device. Are my messages gone?', a: 'Your key lived in that browser. If you have a key backup and its passphrase, restore it in Settings, Security. Without a backup, earlier messages cannot be recovered and you would start with a new key.' },
      { q: 'Does a password reset get my messages back?', a: 'No. Your password signs you in; your encryption key is separate and lives in your browser and your backup.' },
      { q: 'The confirmation email did not arrive.', a: 'Check your spam folder, wait a few minutes, and try again. If it still does not come, send us a message from the Contact page.' },
    ],
  },
  {
    topic: 'Using Nook',
    items: [
      { q: 'How big can a file be?', a: 'Images up to 10 MB, other files up to 25 MB, and videos up to 100 MB where the service allows it. Each account can upload up to 500 MB a day. A file over the limit is refused before it uploads.' },
      { q: 'A call rings but never connects.', a: 'Some home and mobile networks need a relay server for calls. Try another network first; if it keeps failing, tell us which networks you tried.' },
      { q: 'How do disappearing messages work?', a: 'Choose a time in the conversation options. New messages are deleted for everyone after that time. Messages already sent are not changed.' },
    ],
  },
  {
    topic: 'Safety and your data',
    items: [
      { q: 'Someone is bothering me.', a: 'Block them from the conversation or their profile, and report any message from its menu. Reports go to the administrators.' },
      { q: 'How do I delete my account and data?', a: 'There is no self-service deletion yet. Send us a message on the Contact page, choose "My account or my data", and we will help.' },
      { q: 'I found a security problem.', a: 'Please tell us privately through the Contact page before you tell anyone else. See the Security page for how we handle reports.' },
    ],
  },
];
