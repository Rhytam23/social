# 16_CHANGELOG.md — Version History & Changelog

This document tracks historical releases, migration milestones, and structural updates of the **Private Chat** repository.

---

## [0.1.0] — Current Baseline Release

### Added
- **PostgreSQL Database Foundation:** Added database migrations [`001_initial_schema.sql`](file:///d:/social/database/migrations/001_initial_schema.sql) through [`004_storage.sql`](file:///d:/social/database/migrations/004_storage.sql).
- **Atomic Invite RPC:** Implemented `consume_invite` stored procedure with `FOR UPDATE` row locking and SHA-256 token hashing.
- **Client E2EE Engine:** Integrated `@signalapp/libsignal-client` for 1-to-1 Double Ratchet sessions and Signal SenderKeys group key rotation ([`crypto/`](file:///d:/social/crypto)).
- **AES-256-GCM Attachment Engine:** Web Crypto API integration for encrypting file attachments prior to upload ([`crypto/attachments/attachmentEncryptor.ts`](file:///d:/social/crypto/attachments/attachmentEncryptor.ts)).
- **Argon2id Key Backup System:** Key store export and import encrypted with passphrase-derived keys ([`crypto/backup/keyBackup.ts`](file:///d:/social/crypto/backup/keyBackup.ts)).
- **Automated Vitest Security Suite:** Created 34 unit and static security test cases under [`tests/`](file:///d:/social/tests).
- **Security Hardening Migration:** Applied migration `003_security_foundation.sql`, removing group roles, restricting prekey and presence RLS policies to mutual conversation participants, and hardening group key envelope insertions.
