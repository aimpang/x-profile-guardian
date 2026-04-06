-- Drop the overly permissive UPDATE policy
DROP POLICY "Users can update their own connected account" ON public.connected_accounts;

-- Create a restricted UPDATE policy that only allows push-related columns
CREATE POLICY "Users can update push settings only"
ON public.connected_accounts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create a function to enforce column-level restrictions
CREATE OR REPLACE FUNCTION public.check_connected_accounts_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow changes to push_enabled and push_token
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

-- Attach the trigger
CREATE TRIGGER enforce_connected_accounts_update
BEFORE UPDATE ON public.connected_accounts
FOR EACH ROW
EXECUTE FUNCTION public.check_connected_accounts_update();