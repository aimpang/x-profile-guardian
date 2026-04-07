-- Backfill last_snapshot JSONB to normalize bio (null -> '') and display_name (handle legacy 'name' key)
-- This prevents spurious bio alerts on display name changes for existing accounts.
-- Idempotent and safe to run multiple times.

UPDATE connected_accounts 
SET last_snapshot = last_snapshot || jsonb_build_object(
  'bio', COALESCE(last_snapshot->>'bio', ''),
  'display_name', COALESCE(
    last_snapshot->>'display_name', 
    last_snapshot->>'name', 
    ''
  )
)
WHERE last_snapshot IS NOT NULL 
  AND (
    last_snapshot->>'bio' IS NULL 
    OR (last_snapshot ? 'name' AND NOT (last_snapshot ? 'display_name'))
  );

-- Clean up any legacy 'name' key
UPDATE connected_accounts 
SET last_snapshot = last_snapshot - 'name'
WHERE last_snapshot ? 'name';

-- Verify (optional, for logging)
-- SELECT count(*) FROM connected_accounts WHERE last_snapshot->>'bio' = '' AND (last_snapshot->'bio' IS NOT NULL);