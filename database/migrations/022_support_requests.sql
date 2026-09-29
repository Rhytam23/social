-- ============================================================
-- 022: support requests (the contact form and "Report a problem").
-- Re-runnable. Requires 001-021.
--
--   support_requests   one row per message sent to the people who run the service.
--
-- Access, same pattern as the admin error log (019):
--   * Reading: platform admins only (row level security).
--   * Writing: only through SECURITY DEFINER functions. Submitting is callable by the server
--     (service_role) only, because the contact form works without an account; the server checks the
--     request first (origin, size, rate). Resolving a request is callable by signed-in users but
--     checks is_admin() itself and writes an audit row.
--   * Retention: requests are deleted after 90 days, and the table is capped at 5,000 rows.
--   * One email address can send at most 5 requests a day, so the form cannot be used to flood
--     the admin inbox even from many addresses.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT CHECK (name IS NULL OR char_length(name) <= 80),
  email TEXT NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
  topic TEXT NOT NULL CHECK (topic IN ('question', 'problem', 'account', 'abuse', 'other')),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 10 AND 2000),
  context TEXT CHECK (context IS NULL OR char_length(context) <= 1000),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_support_requests_status_created ON public.support_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_requests_email_created ON public.support_requests(lower(email), created_at DESC);

ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

-- Reading is for platform admins only. There are deliberately no INSERT, UPDATE or DELETE policies.
DROP POLICY IF EXISTS support_requests_select_policy ON public.support_requests;
CREATE POLICY support_requests_select_policy ON public.support_requests FOR SELECT TO authenticated USING (public.is_admin());

REVOKE ALL ON public.support_requests FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.support_requests FROM authenticated;

-- ---- submit (server only) ----

CREATE OR REPLACE FUNCTION public.submit_support_request(
  p_user_id UUID,
  p_name TEXT,
  p_email TEXT,
  p_topic TEXT,
  p_message TEXT,
  p_context TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
BEGIN
  IF p_topic NOT IN ('question', 'problem', 'account', 'abuse', 'other') THEN
    RAISE EXCEPTION 'invalid_topic' USING ERRCODE = 'P0001';
  END IF;

  IF (SELECT count(*) FROM public.support_requests
      WHERE lower(email) = lower(p_email) AND created_at > NOW() - INTERVAL '1 day') >= 5 THEN
    RAISE EXCEPTION 'too_many_requests' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.support_requests (user_id, name, email, topic, message, context)
  VALUES (p_user_id, left(nullif(p_name, ''), 80), left(p_email, 254), p_topic, left(p_message, 2000), left(nullif(p_context, ''), 1000))
  RETURNING id INTO new_id;

  -- Retention: 90 days, and never more than 5,000 rows.
  DELETE FROM public.support_requests WHERE created_at < NOW() - INTERVAL '90 days';
  IF (SELECT count(*) FROM public.support_requests) > 5000 THEN
    DELETE FROM public.support_requests
    WHERE id IN (SELECT id FROM public.support_requests ORDER BY created_at DESC OFFSET 5000);
  END IF;

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_support_request(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_support_request(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- ---- admin action (signed-in users may call it, but it checks is_admin() itself) ----

CREATE OR REPLACE FUNCTION public.admin_set_support_status(p_id UUID, p_status TEXT)
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

  UPDATE public.support_requests
  SET status = p_status,
      resolved_by = CASE WHEN p_status = 'resolved' THEN auth.uid() ELSE NULL END,
      resolved_at = CASE WHEN p_status = 'resolved' THEN NOW() ELSE NULL END
  WHERE id = p_id;

  IF FOUND THEN
    INSERT INTO public.admin_audit_log (actor_id, action, target_type, target_id)
    VALUES (auth.uid(), CASE WHEN p_status = 'resolved' THEN 'resolve_support' ELSE 'reopen_support' END, 'support_request', p_id::text);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_support_status(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_support_status(UUID, TEXT) TO authenticated;
