

# Rebuild Rich Dashboard

The current Dashboard already has most of this structure from the last edit. Let me check what's actually rendering now vs what's expected.

## Current State

The existing `src/pages/Dashboard.tsx` already contains all four sections (header, status card, alerts, settings) with both connected/not-connected states. The code matches the requested layout closely.

## What Needs Fixing

After reviewing the code, the structure is correct but may appear "empty" due to:
1. The not-connected state card could be more visually prominent (larger padding, bigger icon)
2. Settings section only shows when `account` exists — it should always show the trial info even when not connected
3. The alerts and settings sections are hidden behind `{account && ...}` conditionals, making the page look bare in the not-connected state

## Changes to `src/pages/Dashboard.tsx`

1. **Not-connected state**: Increase shield icon to `h-20 w-20`, add more vertical padding (`p-12`), make the blue button larger (`size="lg"` with `px-10`)
2. **Always show trial/subscription banner**: Move the trial warning banner outside the `account` conditional so users see "14 days left" even before connecting
3. **Show empty alerts section even when not connected**: Display the "No alerts yet" empty state regardless of connection status, so the page has visual weight
4. **Show settings section always**: Show push toggle and billing info even before connecting (disabled state for push toggle when no account)
5. **Footer with email + logout**: Keep the bottom footer visible always

## Files Modified

- `src/pages/Dashboard.tsx` — rebuild with all sections always visible, richer not-connected state

