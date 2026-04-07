-- Allow 'followers' as an alert event type
ALTER TABLE public.alerts
  DROP CONSTRAINT IF EXISTS alerts_event_type_check;

ALTER TABLE public.alerts
  ADD CONSTRAINT alerts_event_type_check
  CHECK (event_type IN ('username', 'display_name', 'bio', 'profile_image', 'banner', 'followers'));

-- Add followers_count to connected_accounts snapshot
ALTER TABLE public.connected_accounts
  ADD COLUMN IF NOT EXISTS followers_count INTEGER;
