import { hashToken } from '../utils/crypto';
import { createAdminClient } from '../supabase/admin';

export interface ConsumeInviteOptions {
  rawToken: string;
  userId: string;
  userEmail: string;
}

export interface ConsumeInviteResult {
  success: boolean;
  inviteId?: string;
  error?: string;
}

interface ConsumeInviteRpcResult {
  success: boolean;
  message?: string;
  invite_id?: string;
}

export async function consumeInvite({
  rawToken,
  userId,
  userEmail,
}: ConsumeInviteOptions): Promise<ConsumeInviteResult> {
  if (!rawToken || !userId || !userEmail) {
    return { success: false, error: 'Missing required parameters' };
  }

  const tokenHash = hashToken(rawToken);
  const normalizedEmail = userEmail.toLowerCase().trim();
  const supabaseAdmin = createAdminClient();

  const { data, error } = await supabaseAdmin.rpc('consume_invite', {
    p_token_hash: tokenHash,
    p_user_id: userId,
    p_assigned_email: normalizedEmail,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const rpcResult = data as unknown as ConsumeInviteRpcResult | null;

  if (!rpcResult || !rpcResult.success) {
    return { success: false, error: rpcResult?.message || 'Failed to consume invite' };
  }

  return {
    success: true,
    inviteId: rpcResult.invite_id,
  };
}
