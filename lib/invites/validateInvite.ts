import { hashToken } from '../utils/crypto';
import { createAdminClient } from '../supabase/admin';

export interface ValidateInviteResult {
  isValid: boolean;
  reason?: 'invalid_token' | 'expired' | 'revoked' | 'used';
  inviteId?: string;
  assignedEmail?: string;
}

export async function validateInvite(
  rawToken: string,
  userEmail?: string
): Promise<ValidateInviteResult> {
  if (!rawToken) {
    return { isValid: false, reason: 'invalid_token' };
  }

  const tokenHash = hashToken(rawToken);
  const supabaseAdmin = createAdminClient();

  const { data: invite, error } = await supabaseAdmin
    .from('invites')
    .select('id, status, assigned_email, expires_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (error || !invite) {
    return { isValid: false, reason: 'invalid_token' };
  }

  if (invite.status === 'revoked') {
    return { isValid: false, reason: 'revoked', inviteId: invite.id };
  }

  if (invite.status === 'used') {
    return { isValid: false, reason: 'used', inviteId: invite.id };
  }

  const now = new Date();
  const expiresAt = new Date(invite.expires_at);

  if (now > expiresAt || invite.status === 'expired') {
    return { isValid: false, reason: 'expired', inviteId: invite.id };
  }

  if (userEmail) {
    const normalizedEmail = userEmail.toLowerCase().trim();
    if (invite.assigned_email.toLowerCase() !== normalizedEmail) {
      return { isValid: false, reason: 'invalid_token' };
    }
  }

  return {
    isValid: true,
    inviteId: invite.id,
    assignedEmail: invite.assigned_email,
  };
}
