-- Backfill verified=false into existing snapshots that are missing the field
-- Prevents false "Verified status changed" alert on first poll after upgrade
UPDATE public.connected_accounts
SET last_snapshot = last_snapshot || '{"verified": false}'::jsonb
WHERE last_snapshot IS NOT NULL
  AND last_snapshot->>'verified' IS NULL;
