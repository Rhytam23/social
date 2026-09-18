import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();

function readSql(rel: string): string {
  return readFileSync(join(root, rel), 'utf-8');
}

const migration003 = readSql('database/migrations/003_security_foundation.sql');
const migration001 = readSql('database/migrations/001_initial_schema.sql');
const storageSql = readSql('database/migrations/004_storage.sql');

describe('Security foundation — group roles removed', () => {
  it('drops the conversation_members.role column', () => {
    expect(migration003).toMatch(
      /ALTER TABLE public\.conversation_members DROP COLUMN IF EXISTS role/
    );
  });

  it('drops is_group_admin() and never recreates it', () => {
    expect(migration003).toMatch(/DROP FUNCTION IF EXISTS public\.is_group_admin\(UUID\)/);
    expect(migration003).not.toMatch(/CREATE.*is_group_admin/);
  });

  it('does not add any role column back', () => {
    expect(migration003).not.toMatch(/ADD COLUMN.*role/);
  });
});

describe('Security foundation — application admin authorization', () => {
  it('is_admin() reads only profiles.is_admin, not app_metadata', () => {
    const body = migration003
      .split('CREATE OR REPLACE FUNCTION public.is_admin()')[1]
      .split('$$;')[0];
    expect(body).toMatch(/SELECT is_admin FROM public\.profiles WHERE id = auth\.uid\(\)/);
    expect(body).not.toMatch(/app_metadata/);
  });

  it('prevents authenticated users from escalating is_admin (service role only)', () => {
    expect(migration003).toMatch(/IF auth\.uid\(\) IS NULL THEN/);
    expect(migration003).toMatch(/NEW\.is_admin := false/);
    expect(migration003).toMatch(/NEW\.is_admin := OLD\.is_admin/);
  });
});

describe('Security foundation — RLS scoping (no broad policies)', () => {
  it('contains no USING (true) or WITH CHECK (true) broad policies', () => {
    expect(migration003).not.toMatch(/USING \(true\)/);
    expect(migration003).not.toMatch(/WITH CHECK \(true\)/);
  });

  it('scopes user_devices SELECT to owner or conversation-mates', () => {
    expect(migration003).toMatch(/user_devices_select_policy/);
    expect(migration003).toMatch(/shares_conversation_with\(user_id\)/);
  });

  it('scopes presence SELECT to owner or conversation-mates', () => {
    expect(migration003).toMatch(/presence_select_policy/);
    expect(migration003).toMatch(/shares_conversation_with\(user_id\)/);
  });

  it('prevents arbitrary self-join via membership-based insert policy', () => {
    // The insert policy requires being the creator or an existing member.
    expect(migration003).toMatch(/conversation_members_insert_policy/);
    expect(migration003).toMatch(/c\.created_by = auth\.uid\(\)/);
    expect(migration003).toMatch(/is_conversation_member\(conversation_id\)/);
  });

  it('hardens group_key_envelopes insert to validate recipient + device', () => {
    expect(migration003).toMatch(/group_key_envelopes_insert_policy/);
    expect(migration003).toMatch(/is_valid_group_key_recipient\(conversation_id, user_id, device_id\)/);
    // The helper validates the recipient is a member and the device belongs to them.
    expect(migration003).toMatch(/cm\.user_id = p_user_id/);
    expect(migration003).toMatch(/ud\.device_id = p_device_id/);
    expect(migration003).toMatch(/c\.type = 'group'/);
  });
});

describe('Security foundation — indexes and updated_at', () => {
  it('adds missing indexes for sender, reactions, receipts, and envelopes', () => {
    expect(migration003).toMatch(/idx_messages_sender/);
    expect(migration003).toMatch(/idx_message_reactions_user/);
    expect(migration003).toMatch(/idx_message_receipts_user/);
    expect(migration003).toMatch(/idx_group_key_envelopes_user_id/);
  });

  it('adds an updated_at trigger and applies it to mutable tables', () => {
    expect(migration003).toMatch(/set_updated_at/);
    expect(migration003).toMatch(/set_profiles_updated_at/);
    expect(migration003).toMatch(/set_conversations_updated_at/);
    expect(migration003).toMatch(/set_user_devices_updated_at/);
    expect(migration003).toMatch(/set_presence_updated_at/);
  });
});

describe('Security foundation — plaintext and private-key invariants', () => {
  it('message schema has no plaintext content column', () => {
    expect(migration001).toMatch(/ciphertext TEXT NOT NULL/);
    expect(migration001).toMatch(/nonce TEXT NOT NULL/);
    expect(migration001).not.toMatch(/content TEXT/);
  });

  it('user_devices stores no private key material', () => {
    expect(migration001).toMatch(/identity_public_key TEXT NOT NULL/);
    expect(migration001).not.toMatch(/private_key/);
    expect(migration001).not.toMatch(/identity_private_key/);
  });
});

describe('Security foundation — storage', () => {
  it('creates a private attachments bucket', () => {
    expect(storageSql).toMatch(/INSERT INTO storage\.buckets/);
    expect(storageSql).toMatch(/'attachments', 'attachments', false/);
  });

  it('scopes storage object access to the owner folder', () => {
    expect(storageSql).toMatch(/storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/);
  });
});
