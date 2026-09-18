-- Function: consume_invite
-- Description: Atomically validates and consumes a single-use invite token during
--              user registration with FOR UPDATE row locking to prevent races.
--
-- Security notes:
--   * Only the server-side service role may invoke this function. Ordinary
--     authenticated users are intentionally denied EXECUTE because invite
--     consumption is a privileged registration-path operation.
--   * The function never returns raw database errors (SQLERRM). All failure
--     paths return stable, non-sensitive messages.
--   * The invite token is compared by its SHA-256 hash only; raw tokens are
--     never stored or logged.

CREATE OR REPLACE FUNCTION public.consume_invite(
  p_token_hash TEXT,
  p_user_id UUID,
  p_assigned_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_normalized_email TEXT;
BEGIN
  -- Param validation
  IF p_token_hash IS NULL OR p_user_id IS NULL OR p_assigned_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid parameters');
  END IF;

  -- Caller identity verification: if this function is ever invoked by an
  -- authenticated user, their identity must match p_user_id. This is defense
  -- in depth; the intended caller is the service role (auth.uid() IS NULL).
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  v_normalized_email := LOWER(TRIM(p_assigned_email));

  -- Lock the target invite row atomically with FOR UPDATE to prevent race
  -- conditions during concurrent consumption attempts.
  SELECT * INTO v_invite
  FROM public.invites
  WHERE token_hash = p_token_hash
  FOR UPDATE;

  -- 1. Check if invite exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid invite token');
  END IF;

  -- 2. Check status
  IF v_invite.status = 'used' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invite has already been used');
  END IF;

  IF v_invite.status = 'revoked' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invite has been revoked');
  END IF;

  -- 3. Check expiration
  IF v_invite.expires_at <= NOW() OR v_invite.status = 'expired' THEN
    UPDATE public.invites
    SET status = 'expired'
    WHERE id = v_invite.id;

    RETURN jsonb_build_object('success', false, 'message', 'Invite has expired');
  END IF;

  -- 4. Check assigned email
  IF LOWER(TRIM(v_invite.assigned_email)) <> v_normalized_email THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invite assigned email does not match registration email');
  END IF;

  -- 5. Atomically consume invite
  UPDATE public.invites
  SET
    status = 'used',
    used_at = NOW(),
    used_by = p_user_id
  WHERE id = v_invite.id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Invite successfully consumed',
    'invite_id', v_invite.id
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Never expose internal database error details to callers.
    RETURN jsonb_build_object('success', false, 'message', 'Invite consumption failed');
END;
$$;

-- Restrict execution to the server-side service role only. Ordinary
-- authenticated users must not invoke this privileged function directly.
REVOKE ALL ON FUNCTION public.consume_invite(TEXT, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_invite(TEXT, UUID, TEXT) TO service_role;
