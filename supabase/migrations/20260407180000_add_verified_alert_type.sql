-- Add 'verified' as a valid alert event type
ALTER TABLE public.alerts
  DROP CONSTRAINT IF EXISTS alerts_event_type_check;

ALTER TABLE public.alerts
  ADD CONSTRAINT alerts_event_type_check
  CHECK (event_type IN ('username', 'display_name', 'bio', 'profile_image', 'banner', 'followers', 'verified'));
