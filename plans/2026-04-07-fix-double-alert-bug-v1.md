# Fix Spurious Bio and Display Name Alert Duplication

## Objective

Address the root cause identified in prior analysis where changes to only the display name trigger alerts for both display_name and bio. This is due to inconsistent snapshot normalization (null vs empty string for bio), X API field name mismatches (name/description vs canonical display_name/bio), partial snapshot updates in webhooks, and dual execution of polling and webhook paths. The plan normalizes data consistently across paths, adds backfills where needed, updates mappings, and verifies no regressions, ensuring only genuine changes generate alerts while preserving real-time behavior and existing data.

## Implementation Plan

- [ ] Re-examine and baseline current state of key implementation files including poll-profiles detection/diff logic, webhook field handling, snapshot creation in OAuth/callback, relevant DB migrations for alerts and snapshots, and frontend alert rendering to account for any external modifications - necessary to ensure edits target exact current code without assumptions.
- [ ] Introduce a shared normalizeSnapshot utility function that standardizes field values (e.g., bio to empty string, maps 'name' to 'display_name' and 'description' to 'bio') and applies it consistently in profile fetch, snapshot updates, and comparisons - directly resolves the core null/"" drift and field mismatch causing duplicate alerts.
- [ ] Refactor the per-field diff loop in the polling function to always use normalized values for string comparisons, skipping verified boolean logic where appropriate - eliminates false positive bio alerts on name changes.
- [ ] Update webhook event processing to normalize incoming X event types and fully backfill the snapshot using the new utility before applying changes - prevents partial update drift that interacts badly with subsequent polls.
- [ ] Create and apply a targeted DB migration or patch to backfill existing last_snapshot JSONB records with normalized bio/display_name defaults for legacy accounts - ensures historical data does not trigger spurious alerts post-fix.
- [ ] Review and align event_type handling, alert insertion, frontend eventConfig mapping, severity logic, and label rendering to gracefully handle any transitional raw field names while preferring canonical ones - maintains consistent UX in alert display and filtering.
- [ ] Extend existing test suites with specific cases for name-only, bio-only, and combined changes, including end-to-end simulation of poll vs webhook paths - confirms the fix and prevents regressions.
- [ ] Deploy updated edge functions to Supabase, apply any migration, restart cron if needed, and monitor initial alert generation - brings the fix into production.

## Verification Criteria

- A display name only change generates exactly one alert with event_type for display_name (verified via DB query and dashboard rendering).
- A bio only change generates exactly one alert for bio with no extraneous name alert.
- Existing alerts, snapshots, and historical data remain unchanged and display correctly.
- No new alerts for unchanged fields after normalization; type checks, build, and comprehensive tests all pass.
- Webhook and polling paths both respect the normalized logic without errors or duplicates (confirmed in test_comprehensive.py and manual X profile edit tests).

## Potential Risks and Mitigations

1. **[Data corruption or lost alerts on backfill/migration]** Mitigation: Make migration idempotent and non-destructive; test on copy of production-like data first; include rollback SQL.
2. **[Webhook downtime or missed events during function redeploy]** Mitigation: Use Supabase's atomic deploy capabilities; monitor function logs post-deploy; have fallback polling interval tightened temporarily.
3. **[Over-normalization affecting other fields like verified or username]** Mitigation: Unit test normalize function exhaustively against all fields and X API sample payloads; keep verified Boolean logic isolated.
4. **[Increased complexity in shared utility leading to maintenance burden]** Mitigation: Keep normalizeSnapshot simple and well-documented with clear input/output contracts.

## Alternative Approaches

1. **[Move normalization entirely to database level with triggers or generated columns on last_snapshot JSONB]**: More robust for consistency across all paths and future functions but requires schema changes, potential performance impact on writes, and more complex migration; trade-off favors long-term data integrity over function-only changes.
2. **[Consolidate to single real-time path (webhook only with full snapshot refresh on every event)]**: Eliminates poll/webhook interaction bugs but increases dependency on X webhook reliability and may raise API usage/costs; suitable if polling can be deprecated after validation.
