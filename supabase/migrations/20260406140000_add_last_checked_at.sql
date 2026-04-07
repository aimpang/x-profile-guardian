ALTER TABLE public.connected_accounts
  ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ;
