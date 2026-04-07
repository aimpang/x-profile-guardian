ALTER TABLE public.connected_accounts
  ADD COLUMN IF NOT EXISTS monitoring_error BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trial_warning_sent_at TIMESTAMPTZ;
