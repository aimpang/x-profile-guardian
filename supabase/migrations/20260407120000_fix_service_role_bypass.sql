-- Fix the service_role bypass check in the connected_accounts update trigger.
-- The previous check used current_setting('role') which does not reliably return
-- 'service_role' inside Supabase edge functions. The correct approach is to check
-- whether the caller is bypassing RLS (service_role has no JWT claims).

CREATE OR REPLACE FUNCTION public.check_connected_accounts_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_sub TEXT;
BEGIN
  -- Service role callers have no JWT claims — they bypass RLS.
  -- Detect this by checking for absence of a valid JWT sub claim.
  -- If there is no JWT sub, this is a trusted backend caller; allow all updates.
  BEGIN
    jwt_sub := current_setting('request.jwt.claims', true)::json->>'sub';
  EXCEPTION WHEN others THEN
    jwt_sub := NULL;
  END;

  IF jwt_sub IS NULL OR jwt_sub = '' THEN
    RETURN NEW;
  END IF;

  -- Regular authenticated users can only update push_enabled, push_token, and digest_enabled
  IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
     OR NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at
     OR NEW.x_user_id IS DISTINCT FROM OLD.x_user_id
     OR NEW.x_username IS DISTINCT FROM OLD.x_username
     OR NEW.x_display_name IS DISTINCT FROM OLD.x_display_name
     OR NEW.x_avatar_url IS DISTINCT FROM OLD.x_avatar_url
     OR NEW.last_snapshot IS DISTINCT FROM OLD.last_snapshot
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
  THEN
    RAISE EXCEPTION 'You can only update push_enabled, push_token, and digest_enabled';
  END IF;

  RETURN NEW;
END;
$$;
