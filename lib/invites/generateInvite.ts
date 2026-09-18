import { generateSecureToken, hashToken } from '../utils/crypto';
import { createAdminClient } from '../supabase/admin';

export interface GenerateInviteOptions {
  assignedEmail: string;
  createdBy: string;
  expiresInDays?: number;
}

export interface GenerateInviteResult {
  rawToken: string;
  inviteId: string;
  tokenHash: string;
  assignedEmail: string;
  expiresAt: string;
}

export async function generateInvite({
  assignedEmail,
  createdBy,
  expiresInDays = 7,
}: GenerateInviteOptions): Promise<GenerateInviteResult> {
  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);
  const normalizedEmail = assignedEmail.toLowerCase().trim();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const supabaseAdmin = createAdminClient();

  const { data, error } = await supabaseAdmin
    .from('invites')
    .insert({
      token_hash: tokenHash,
      assigned_email: normalizedEmail,
      created_by: createdBy,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })
    .select('id, expires_at')
    .single();

  if (error || !data) {
    throw new Error(`Failed to generate invite: ${error?.message || 'Unknown error'}`);
  }

  return {
    rawToken,
    inviteId: data.id,
    tokenHash,
    assignedEmail: normalizedEmail,
    expiresAt: data.expires_at,
  };
}
