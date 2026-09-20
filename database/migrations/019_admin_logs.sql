-- ============================================================
-- 019: admin error log and admin activity log.
-- Re-runnable. Requires 001-018.
--
-- Why: technical error detail is shown only to platform admins, but admins
-- do not have Supabase or Vercel access, so they need somewhere inside the
-- app to see what is going wrong and what other admins did.
--
--   error_logs       one row per distinct error (same error again = the
--                    counter goes up), server and browser errors, scrubbed
--                    of secrets and never containing message content.
--   admin_audit_log  append-only record of admin actions.
--
-- Access:
--   * Reading: platform admins only (row level security).
--   * Writing: only through SECURITY DEFINER functions. The two ingest
--     functions are callable by the server (service_role) only; the two
--     admin actions (resolve, clear) check is_admin() themselves and write
--     an audit row. Nobody can edit or delete the audit log through the API.
--   * Retention: rows not seen for 30 days are deleted on each new log, and
--     the table is capped at 5,000 rows.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint TEXT NOT NULL UNIQUE CHECK (char_length(fingerprint) BETWEEN 8 AND 128),
  level TEXT NOT NULL DEFAULT 'error' CHECK (level IN ('error', 'warn')),
  source TEXT NOT NULL CHECK (source IN ('server', 'client')),
  area TEXT NOT NULL CHECK (char_length(area) BETWEEN 1 AND 120),
  message TEXT NOT NULL CHECK (char_length(message) <= 500),
  detail TEXT CHECK (detail IS NULL OR char_length(detail) <= 2000),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  path TEXT CHECK (path IS NULL OR char_length(path) <= 200),
  user_agent TEXT CHECK (user_agent IS NULL OR char_length(user_agent) <= 200),
  release TEXT CHECK (release IS NULL OR char_length(release) <= 40),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  occurrences INT NOT NULL DEFAULT 1 CHECK (occurrences >= 1),
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_error_logs_last_seen ON public.error_logs(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_status_last_seen ON public.error_logs(status, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (char_length(action) BETWEEN 1 AND 60),
  target_type TEXT CHECK (target_type IS NULL OR char_length(target_type) <= 40),
  target_id TEXT CHECK (target_id IS NULL OR char_length(target_id) <= 80),
  detail TEXT CHECK (detail IS NULL OR char_length(detail) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON public.admin_audit_log(created_at DESC);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Reading is for platform admins only. There are deliberately no INSERT, UPDATE or DELETE policies.
DROP POLICY IF EXISTS error_logs_select_policy ON public.error_logs;
CREATE POLICY error_logs_select_policy ON public.error_logs FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS admin_audit_select_policy ON public.admin_audit_log;
CREATE POLICY admin_audit_select_policy ON public.admin_audit_log FOR SELECT TO authenticated USING (public.is_admin());

-- Defence in depth: even a future policy mistake cannot let a client write to these tables.
REVOKE ALL ON public.error_logs FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.error_logs FROM authenticated;
REVOKE ALL ON public.admin_audit_log FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.admin_audit_log FROM authenticated;

-- ---- ingest (server only) ----

CREATE OR REPLACE FUNCTION public.log_error(
  p_source TEXT,
  p_level TEXT,
  p_area TEXT,
  p_message TEXT,
  p_detail TEXT,
  p_fingerprint TEXT,
  p_user_id UUID,
  p_path TEXT,
  p_user_agent TEXT,
  p_release TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_source NOT IN ('server', 'client') OR p_level NOT IN ('error', 'warn') THEN
    RAISE EXCEPTION 'invalid_log_entry' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.error_logs AS e (fingerprint, level, source, area, message, detail, user_id, path, user_agent, release)
  VALUES (
    left(p_fingerprint, 128),
    p_level,
    p_source,
    left(coalesce(nullif(p_area, ''), 'unknown'), 120),
    left(coalesce(p_message, ''), 500),
    left(p_detail, 2000),
    p_user_id,
    left(p_path, 200),
    left(p_user_agent, 200),
    left(p_release, 40)
  )
  ON CONFLICT (fingerprint) DO UPDATE SET
    occurrences = e.occurrences + 1,
    last_seen_at = NOW(),
    user_id = COALESCE(EXCLUDED.user_id, e.user_id),
    detail = COALESCE(EXCLUDED.detail, e.detail),
    -- A resolved error that happens again is open again.
    status = 'open',
    resolved_by = NULL,
    resolved_at = NULL;

  -- Retention: 30 days since last seen, and never more than 5,000 rows.
  DELETE FROM public.error_logs WHERE last_seen_at < NOW() - INTERVAL '30 days';
  IF (SELECT count(*) FROM public.error_logs) > 5000 THEN
    DELETE FROM public.error_logs
    WHERE id IN (SELECT id FROM public.error_logs ORDER BY last_seen_at DESC OFFSET 5000);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_actor UUID,
  p_action TEXT,
  p_target_type TEXT,
  p_target_id TEXT,
  p_detail TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_audit_log (actor_id, action, target_type, target_id, detail)
  VALUES (p_actor, left(p_action, 60), left(p_target_type, 40), left(p_target_id, 80), left(p_detail, 500));
END;
$$;

REVOKE ALL ON FUNCTION public.log_error(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_error(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT) TO service_role;
REVOKE ALL ON FUNCTION public.log_admin_action(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_action(UUID, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- ---- admin actions (callable by signed-in users, but each checks is_admin() itself) ----

CREATE OR REPLACE FUNCTION public.admin_set_error_status(p_id UUID, p_status TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF p_status NOT IN ('open', 'resolved') THEN
    RAISE EXCEPTION 'invalid_status' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.error_logs
  SET status = p_status,
      resolved_by = CASE WHEN p_status = 'resolved' THEN auth.uid() ELSE NULL END,
      resolved_at = CASE WHEN p_status = 'resolved' THEN NOW() ELSE NULL END
  WHERE id = p_id;

  IF FOUND THEN
    INSERT INTO public.admin_audit_log (actor_id, action, target_type, target_id)
    VALUES (auth.uid(), CASE WHEN p_status = 'resolved' THEN 'resolve_error' ELSE 'reopen_error' END, 'error_log', p_id::text);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_clear_errors(p_only_resolved BOOLEAN DEFAULT TRUE)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  removed INT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.error_logs WHERE (NOT p_only_resolved) OR status = 'resolved';
  GET DIAGNOSTICS removed = ROW_COUNT;

  INSERT INTO public.admin_audit_log (actor_id, action, target_type, detail)
  VALUES (auth.uid(), 'clear_errors', 'error_log', CASE WHEN p_only_resolved THEN 'resolved only: ' ELSE 'all: ' END || removed::text || ' removed');
  RETURN removed;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_error_status(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_error_status(UUID, TEXT) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.admin_clear_errors(BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_clear_errors(BOOLEAN) TO authenticated, service_role;
