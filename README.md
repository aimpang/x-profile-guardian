# XSentinel

X account identity monitoring. Get alerted within minutes when your X profile changes — username, bio, avatar, banner, or follower count.

Live: [xsentinel.dev](https://xsentinel.dev)

---

## Features

- **Profile monitoring** — username, display name, bio, profile picture, banner checked every minute
- **Follower drop alerts** — notified when follower count drops ≥50 or ≥5% in a single poll
- **Email + push alerts** — Resend for email, OneSignal for browser push
- **Alert history** — full before/after record of every change (up to 50)
- **"This was me"** — one-click dismiss for legitimate changes
- **14-day free trial** — then $9/mo or $89/yr via Stripe

---

## Architecture

```
Browser (React + Vite)
    │
    ├── Supabase Auth (email/password, Google OAuth)
    ├── Supabase DB (PostgreSQL + RLS)
    └── Supabase Edge Functions (Deno)
            │
            ├── x-oauth-start        PKCE flow initiation
            ├── x-oauth-callback     Token exchange + account upsert
            ├── poll-profiles        Polling worker (called by pg_cron)
            ├── check-subscription   Stripe status check
            ├── create-checkout      Stripe checkout session
            ├── customer-portal      Stripe billing portal
            └── stripe-webhook       Subscription lifecycle events

pg_cron → net.http_post → poll-profiles (every 1 min)
    │
    └── X API v2 /users/me?user.fields=...,public_metrics
            │
            ├── diff against last_snapshot in connected_accounts
            ├── insert alert row on change
            ├── send email via Resend
            └── send push via OneSignal
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions / Deno) |
| Monitoring | X API v2 + pg_cron polling |
| Payments | Stripe (monthly + yearly subscriptions) |
| Email alerts | Resend |
| Push alerts | OneSignal Web SDK v16 |
| Deployment | Lovable (preview) → xsentinel.dev |

---

## Database Schema

### `connected_accounts`
| Column | Type | Notes |
|---|---|---|
| user_id | UUID | FK → auth.users |
| x_user_id | TEXT | X numeric user ID |
| x_username | TEXT | |
| x_display_name | TEXT | |
| x_avatar_url | TEXT | |
| last_snapshot | JSONB | `{username, display_name, bio, profile_image, banner, followers}` |
| x_access_token | TEXT | X OAuth2 access token |
| x_refresh_token | TEXT | X OAuth2 refresh token |
| followers_count | INTEGER | Latest known count |
| subscription_status | TEXT | `trial \| active \| expired` |
| trial_ends_at | TIMESTAMPTZ | |
| push_enabled | BOOLEAN | |
| push_token | TEXT | OneSignal player ID |

### `alerts`
| Column | Type | Notes |
|---|---|---|
| user_id | UUID | FK → auth.users |
| event_type | TEXT | `username \| display_name \| bio \| profile_image \| banner \| followers` |
| old_data | JSONB | `{ [event_type]: value }` |
| new_data | JSONB | `{ [event_type]: value }` |
| is_legitimate | BOOLEAN | User acknowledged via "This was me" |
| created_at | TIMESTAMPTZ | |

### `x_oauth_states`
PKCE state + code_verifier storage (ephemeral, deleted after use).

---

## Edge Functions

### `poll-profiles`
Core monitoring worker. Called by pg_cron every minute.

1. Fetch all `connected_accounts` where `subscription_status != expired` and `x_access_token IS NOT NULL`
2. For each account: refresh OAuth token via `refresh_token`, fetch `/2/users/me` with `public_metrics`
3. Diff `username`, `display_name`, `bio`, `profile_image`, `banner` against `last_snapshot`
4. Check follower drop (≥50 or ≥5%)
5. Insert alert, send email + push for each change
6. Update `last_snapshot` + `followers_count`

Protected by `X-Poll-Secret` header (set as Supabase secret `POLL_SECRET`).

### `x-oauth-start`
Generates PKCE `code_verifier` + `code_challenge`, stores state in `x_oauth_states`, returns X OAuth2 authorization URL.

### `x-oauth-callback`
Exchanges auth code for tokens, fetches X profile, upserts `connected_accounts` with tokens + initial snapshot.

### `create-checkout` / `customer-portal` / `stripe-webhook` / `check-subscription`
Standard Stripe integration. Webhook updates `subscription_status` on `connected_accounts`.

---

## Required Secrets (Supabase Edge Function Secrets)

```
X_CLIENT_ID
X_CLIENT_SECRET
APP_URL                  # e.g. https://xsentinel.dev
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_MONTHLY
STRIPE_PRICE_YEARLY
RESEND_API_KEY
ONESIGNAL_APP_ID
ONESIGNAL_REST_API_KEY
POLL_SECRET              # arbitrary secret for cron → poll-profiles auth
```

---

## Local Development

```bash
npm install
npm run dev              # http://localhost:8080
```

Supabase client is hardcoded to production project (`bozqoeuzihyaduqzfzyi`) — no local Supabase setup needed for frontend dev.

---

## Cron Setup (Supabase SQL Editor)

Enable `pg_cron` and `pg_net` extensions first, then:

```sql
SELECT cron.schedule(
  'poll-x-profiles',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://bozqoeuzihyaduqzfzyi.supabase.co/functions/v1/poll-profiles',
    headers := jsonb_build_object('x-poll-secret', '<POLL_SECRET>'),
    body := '{}'::jsonb
  )
  $$
);
```

---

© 2026 XSentinel. All rights reserved.
