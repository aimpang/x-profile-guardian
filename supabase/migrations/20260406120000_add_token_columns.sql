ALTER TABLE public.connected_accounts
  ADD COLUMN IF NOT EXISTS x_access_token TEXT,
  ADD COLUMN IF NOT EXISTS x_refresh_token TEXT;
