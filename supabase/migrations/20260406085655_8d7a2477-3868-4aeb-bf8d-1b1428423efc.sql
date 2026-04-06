CREATE OR REPLACE FUNCTION public.check_connected_accounts_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role to update anything (for webhooks/edge functions)
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Regular users can only update push_enabled and push_token
  IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
     OR NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at
     OR NEW.x_user_id IS DISTINCT FROM OLD.x_user_id
     OR NEW.x_username IS DISTINCT FROM OLD.x_username
     OR NEW.x_display_name IS DISTINCT FROM OLD.x_display_name
     OR NEW.x_avatar_url IS DISTINCT FROM OLD.x_avatar_url
     OR NEW.last_snapshot IS DISTINCT FROM OLD.last_snapshot
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
  THEN
    RAISE EXCEPTION 'You can only update push_enabled and push_token';
  END IF;
  RETURN NEW;
END;
$$;