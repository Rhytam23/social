-- ============================================================
-- 024: reports that lead to warnings, temporary bans and blocks.
-- Re-runnable. Requires 001-023 (025 is independent of this one).
--
-- Counting: each DIFFERENT person who reported someone counts once (in the last 90 days), reports that an
-- admin dismissed do not count, and reports from accounts less than 24 hours old do not count. That keeps
-- one angry person, or a batch of fresh fake accounts, from getting someone banned.
--
--   3 people      the reported person gets an in-app warning (no names) and appears in the admin queue
--   10 people     temporary ban (7 days): they cannot sign in, and their email and every IP address they were
--                 seen from are blocked from creating new accounts for the same period
--   over 10       shown in red in the admin queue
--   20 people     permanent block of the account, the email and the addresses
--
-- Platform admins are never banned automatically. Every automatic and manual action is written to the admin
-- activity log and every ban can be undone by an admin.
--
-- Blocking new sign-ups by email or address needs the "Before User Created" hook switched on once in the
-- Supabase dashboard (Authentication, Hooks): choose Postgres function public.hook_before_user_created.
-- Banned accounts are refused by Supabase Auth itself (auth.users.banned_until), no hook needed.
--
-- IP addresses are personal data: they are stored only for this, kept 180 days after last use (block list
-- entries follow their own expiry), and readable by platform admins only. The privacy policy says so.
-- ============================================================

-- ---- tables (no client access at all: everything goes through the functions below) ----------------------

CREATE TABLE IF NOT EXISTS public.user_ips (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ip TEXT NOT NULL CHECK (char_length(ip) BETWEEN 2 AND 45),
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, ip)
);
CREATE INDEX IF NOT EXISTS idx_user_ips_ip ON public.user_ips(ip);

CREATE TABLE IF NOT EXISTS public.blocked_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('email', 'ip')),
  value TEXT NOT NULL CHECK (char_length(value) BETWEEN 2 AND 254),
  reason TEXT CHECK (reason IS NULL OR char_length(reason) <= 200),
  source TEXT NOT NULL DEFAULT 'auto' CHECK (source IN ('auto', 'admin')),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ, -- NULL = permanent
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (kind, value)
);

CREATE TABLE IF NOT EXISTS public.user_moderation (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  warned_at TIMESTAMPTZ,
  warning_seen_at TIMESTAMPTZ,
  banned_until TIMESTAMPTZ, -- '9999-12-31' = permanent
  ban_reason TEXT CHECK (ban_reason IS NULL OR char_length(ban_reason) <= 200)
);

ALTER TABLE public.user_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_moderation ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_ips FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.blocked_identities FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.user_moderation FROM PUBLIC, anon, authenticated;

-- ---- reports: only about someone you actually share a conversation with ---------------------------------

DROP POLICY IF EXISTS reports_insert_policy ON public.reports;
CREATE POLICY reports_insert_policy ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (
    reporter_id = auth.uid()
    AND reported_user_id IS NOT NULL
    AND reported_user_id <> auth.uid()
    AND public.shares_conversation_with(reported_user_id)
    AND (conversation_id IS NULL OR public.is_conversation_member(conversation_id))
  );

-- ---- thresholds (the admin screen mirrors these; see lib/limits.ts) -------------------------------------

CREATE OR REPLACE FUNCTION public.moderation_thresholds()
RETURNS TABLE (warn_at INT, temp_ban_at INT, block_at INT, temp_ban_days INT, window_days INT, min_reporter_age_hours INT)
LANGUAGE sql
IMMUTABLE
AS $$ SELECT 3, 10, 20, 7, 90, 24 $$;

GRANT EXECUTE ON FUNCTION public.moderation_thresholds() TO authenticated, service_role;

-- ---- counting -----------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.eligible_reporter_count(p_user UUID)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(DISTINCT r.reporter_id)::INT
  FROM public.reports r
  JOIN public.profiles rp ON rp.id = r.reporter_id
  WHERE r.reported_user_id = p_user
    AND r.status <> 'dismissed'
    AND r.created_at > NOW() - INTERVAL '90 days'
    AND rp.created_at <= r.created_at - INTERVAL '24 hours';
$$;

REVOKE ALL ON FUNCTION public.eligible_reporter_count(UUID) FROM PUBLIC, anon, authenticated;

-- ---- ban and unban (internal) ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.apply_ban(p_user UUID, p_until TIMESTAMPTZ, p_reason TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_expires TIMESTAMPTZ := CASE WHEN p_until >= '9999-01-01'::timestamptz THEN NULL ELSE p_until END;
BEGIN
  INSERT INTO public.user_moderation (user_id, banned_until, ban_reason)
  VALUES (p_user, p_until, left(p_reason, 200))
  ON CONFLICT (user_id) DO UPDATE SET banned_until = EXCLUDED.banned_until, ban_reason = EXCLUDED.ban_reason;

  -- Supabase Auth refuses sign-in and token refresh for a banned user; existing sessions are ended.
  UPDATE auth.users SET banned_until = p_until WHERE id = p_user;
  DELETE FROM auth.sessions WHERE user_id = p_user;

  SELECT lower(email) INTO v_email FROM auth.users WHERE id = p_user;
  IF v_email IS NOT NULL AND v_email <> '' THEN
    INSERT INTO public.blocked_identities (kind, value, reason, source, user_id, expires_at)
    VALUES ('email', v_email, left(p_reason, 200), 'auto', p_user, v_expires)
    ON CONFLICT (kind, value) DO UPDATE
      SET expires_at = CASE WHEN public.blocked_identities.expires_at IS NULL OR EXCLUDED.expires_at IS NULL THEN NULL
                            ELSE GREATEST(public.blocked_identities.expires_at, EXCLUDED.expires_at) END,
          user_id = EXCLUDED.user_id;
  END IF;

  INSERT INTO public.blocked_identities (kind, value, reason, source, user_id, expires_at)
  SELECT 'ip', ui.ip, left(p_reason, 200), 'auto', p_user, v_expires
  FROM public.user_ips ui
  WHERE ui.user_id = p_user
  ON CONFLICT (kind, value) DO UPDATE
    SET expires_at = CASE WHEN public.blocked_identities.expires_at IS NULL OR EXCLUDED.expires_at IS NULL THEN NULL
                          ELSE GREATEST(public.blocked_identities.expires_at, EXCLUDED.expires_at) END;
END;
$$;

CREATE OR REPLACE FUNCTION public.lift_ban(p_user UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_moderation SET banned_until = NULL, ban_reason = NULL WHERE user_id = p_user;
  UPDATE auth.users SET banned_until = NULL WHERE id = p_user;
  DELETE FROM public.blocked_identities WHERE user_id = p_user;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_ban(UUID, TIMESTAMPTZ, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.lift_ban(UUID) FROM PUBLIC, anon, authenticated;

-- ---- the tiers, run after every new report -----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reports_apply_tiers()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_n INT;
  v_current TIMESTAMPTZ;
BEGIN
  IF NEW.reported_user_id IS NULL THEN RETURN NEW; END IF;
  -- Platform admins are never banned automatically.
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.reported_user_id AND is_admin) THEN RETURN NEW; END IF;

  v_n := public.eligible_reporter_count(NEW.reported_user_id);
  SELECT banned_until INTO v_current FROM public.user_moderation WHERE user_id = NEW.reported_user_id;

  IF v_n >= 20 THEN
    IF v_current IS NULL OR v_current < '9999-01-01'::timestamptz THEN
      PERFORM public.apply_ban(NEW.reported_user_id, '9999-12-31 23:59:59+00'::timestamptz, 'Reported by ' || v_n || ' different people');
      INSERT INTO public.admin_audit_log (actor_id, action, target_type, target_id, detail)
      VALUES (NULL, 'auto_block', 'user', NEW.reported_user_id::text, 'permanent, ' || v_n || ' different reporters');
    END IF;
  ELSIF v_n >= 10 THEN
    IF v_current IS NULL OR v_current < NOW() THEN
      PERFORM public.apply_ban(NEW.reported_user_id, NOW() + INTERVAL '7 days', 'Reported by ' || v_n || ' different people');
      INSERT INTO public.admin_audit_log (actor_id, action, target_type, target_id, detail)
      VALUES (NULL, 'auto_temp_ban', 'user', NEW.reported_user_id::text, '7 days, ' || v_n || ' different reporters');
    END IF;
  END IF;

  IF v_n >= 3 THEN
    INSERT INTO public.user_moderation (user_id, warned_at) VALUES (NEW.reported_user_id, NOW())
    ON CONFLICT (user_id) DO UPDATE SET warned_at = COALESCE(public.user_moderation.warned_at, NOW());
    IF NOT EXISTS (SELECT 1 FROM public.admin_audit_log WHERE action = 'auto_warn' AND target_id = NEW.reported_user_id::text) THEN
      INSERT INTO public.admin_audit_log (actor_id, action, target_type, target_id, detail)
      VALUES (NULL, 'auto_warn', 'user', NEW.reported_user_id::text, v_n || ' different reporters');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_reports_apply_tiers ON public.reports;
CREATE TRIGGER trigger_reports_apply_tiers
  AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.reports_apply_tiers();

-- ---- warnings (what the reported person sees) ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_my_warning()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT warned_at IS NOT NULL AND (warning_seen_at IS NULL OR warning_seen_at < warned_at)
                   FROM public.user_moderation WHERE user_id = auth.uid()), FALSE);
$$;

CREATE OR REPLACE FUNCTION public.acknowledge_warning()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.user_moderation SET warning_seen_at = NOW() WHERE user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_warning() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.acknowledge_warning() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_warning() TO authenticated;
GRANT EXECUTE ON FUNCTION public.acknowledge_warning() TO authenticated;

-- ---- where someone signed in from (server only) --------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.record_user_ip(p_user UUID, p_ip TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_ip IS NULL OR p_ip !~ '^[0-9a-fA-F:.]{2,45}$' THEN RETURN; END IF;

  INSERT INTO public.user_ips (user_id, ip) VALUES (p_user, p_ip)
  ON CONFLICT (user_id, ip) DO UPDATE SET last_seen_at = NOW();

  -- Keep the 20 most recent addresses per person, and nothing older than 180 days.
  DELETE FROM public.user_ips
  WHERE user_id = p_user
    AND ip NOT IN (SELECT ip FROM public.user_ips WHERE user_id = p_user ORDER BY last_seen_at DESC LIMIT 20);
  DELETE FROM public.user_ips WHERE last_seen_at < NOW() - INTERVAL '180 days';
END;
$$;

REVOKE ALL ON FUNCTION public.record_user_ip(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_user_ip(UUID, TEXT) TO service_role;

-- ---- what admins see and do (each checks is_admin() itself, each writes an audit row) ---------------------------

CREATE OR REPLACE FUNCTION public.admin_moderation_overview()
RETURNS TABLE (
  user_id UUID, display_name TEXT, username TEXT,
  distinct_reporters INT, total_reports BIGINT, open_reports BIGINT, last_report_at TIMESTAMPTZ,
  warned BOOLEAN, banned_until TIMESTAMPTZ, is_platform_admin BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
  SELECT p.id, p.display_name, p.username,
         public.eligible_reporter_count(p.id),
         (SELECT count(*) FROM public.reports r WHERE r.reported_user_id = p.id),
         (SELECT count(*) FROM public.reports r WHERE r.reported_user_id = p.id AND r.status = 'open'),
         (SELECT max(r.created_at) FROM public.reports r WHERE r.reported_user_id = p.id),
         COALESCE(m.warned_at IS NOT NULL, FALSE),
         m.banned_until,
         p.is_admin
  FROM public.profiles p
  LEFT JOIN public.user_moderation m ON m.user_id = p.id
  WHERE EXISTS (SELECT 1 FROM public.reports r WHERE r.reported_user_id = p.id)
     OR (m.banned_until IS NOT NULL AND m.banned_until > NOW())
  ORDER BY public.eligible_reporter_count(p.id) DESC, 7 DESC NULLS LAST;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_ban_user(p_user UUID, p_days INT, p_reason TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_until TIMESTAMPTZ;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF p_user = auth.uid() THEN RAISE EXCEPTION 'You cannot ban yourself' USING ERRCODE = 'P0001'; END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user AND is_admin) THEN
    RAISE EXCEPTION 'Platform admins cannot be banned here' USING ERRCODE = 'P0001';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user) THEN RAISE EXCEPTION 'User not found' USING ERRCODE = 'P0001'; END IF;

  v_until := CASE WHEN p_days IS NULL OR p_days <= 0 THEN '9999-12-31 23:59:59+00'::timestamptz ELSE NOW() + make_interval(days => LEAST(p_days, 3650)) END;
  PERFORM public.apply_ban(p_user, v_until, COALESCE(NULLIF(trim(p_reason), ''), 'Banned by an administrator'));
  UPDATE public.blocked_identities SET source = 'admin' WHERE user_id = p_user;

  INSERT INTO public.admin_audit_log (actor_id, action, target_type, target_id, detail)
  VALUES (auth.uid(), 'ban_user', 'user', p_user::text, CASE WHEN p_days IS NULL OR p_days <= 0 THEN 'permanent' ELSE p_days || ' days' END);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_unban_user(p_user UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  PERFORM public.lift_ban(p_user);
  INSERT INTO public.admin_audit_log (actor_id, action, target_type, target_id)
  VALUES (auth.uid(), 'unban_user', 'user', p_user::text);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_blocked_identities()
RETURNS TABLE (id UUID, kind TEXT, value TEXT, reason TEXT, source TEXT, user_id UUID, expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ, accounts_seen INT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
  SELECT b.id, b.kind, b.value, b.reason, b.source, b.user_id, b.expires_at, b.created_at,
         CASE WHEN b.kind = 'ip' THEN (SELECT count(DISTINCT ui.user_id)::INT FROM public.user_ips ui WHERE ui.ip = b.value) ELSE 1 END
  FROM public.blocked_identities b
  WHERE b.expires_at IS NULL OR b.expires_at > NOW()
  ORDER BY b.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_unblock_identity(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kind TEXT;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  DELETE FROM public.blocked_identities WHERE id = p_id RETURNING kind INTO v_kind;
  IF FOUND THEN
    INSERT INTO public.admin_audit_log (actor_id, action, target_type, target_id, detail)
    VALUES (auth.uid(), 'unblock_identity', 'blocked_identity', p_id::text, v_kind);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_moderation_overview() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_ban_user(UUID, INT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_unban_user(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_blocked_identities() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_unblock_identity(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_moderation_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_ban_user(UUID, INT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_unban_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_blocked_identities() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_unblock_identity(UUID) TO authenticated;

-- ---- refuse new accounts from blocked emails and addresses (enable the hook in the dashboard) --------------------------

CREATE OR REPLACE FUNCTION public.hook_before_user_created(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT := lower(COALESCE(event -> 'user' ->> 'email', ''));
  v_ip TEXT := event -> 'metadata' ->> 'ip_address';
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.blocked_identities b
    WHERE (b.expires_at IS NULL OR b.expires_at > NOW())
      AND ((b.kind = 'email' AND b.value = v_email) OR (b.kind = 'ip' AND v_ip IS NOT NULL AND b.value = v_ip))
  ) THEN
    RETURN jsonb_build_object('error', jsonb_build_object(
      'message', 'This email address or network cannot be used to create an account. If you think this is a mistake, please contact support.',
      'http_code', 403));
  END IF;
  RETURN '{}'::jsonb;
END;
$$;

REVOKE ALL ON FUNCTION public.hook_before_user_created(JSONB) FROM PUBLIC, anon, authenticated;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    GRANT EXECUTE ON FUNCTION public.hook_before_user_created(JSONB) TO supabase_auth_admin;
  END IF;
END $$;
