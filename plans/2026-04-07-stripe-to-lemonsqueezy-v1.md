# Stripe → LemonSqueezy Migration Plan

**Date:** 2026-04-07  
**Project:** x-profile-guardian (XSentinel)  
**Scope:** Full replacement of Stripe payment processing with LemonSqueezy across all Supabase edge functions, UI pages, and content strings.

---

## Objective

Migrate all payment infrastructure from Stripe to LemonSqueezy. This includes replacing four Supabase Deno edge functions, updating all UI strings and hardcoded Stripe references, rotating environment variables, and registering a new webhook in the LemonSqueezy dashboard. The database schema requires no structural changes — only the internal status value mappings need updating. No npm packages need to be added or removed (the project has no Stripe npm package; all Stripe SDK usage is via Deno ESM CDN imports inside edge functions).

---

## Complete Inventory of Stripe-Affected Files

### Edge Functions (full rewrites required)

| File | Stripe Surface |
|---|---|
| `supabase/functions/check-subscription/index.ts` | `stripe.customers.list()`, `stripe.subscriptions.list()` |
| `supabase/functions/create-checkout/index.ts` | `stripe.checkout.sessions.create()`, hardcoded Price ID |
| `supabase/functions/customer-portal/index.ts` | `stripe.billingPortal.sessions.create()` |
| `supabase/functions/stripe-webhook/index.ts` | `stripe.webhooks.constructEvent()`, all event handlers |

### Frontend Pages (string/text changes only)

| File | What Changes |
|---|---|
| `src/pages/Dashboard.tsx` | Line `601`: `"Active — billed via Stripe"` → `"Active — billed via Lemon Squeezy"`. Line `432`: `"...a quick setup with Stripe."` → `"...a quick setup with Lemon Squeezy."` |
| `src/pages/SettingsPage.tsx` | Line `104`: Toast text `"Stripe billing portal coming soon"` → `"Lemon Squeezy billing portal coming soon"` (or wire up the real `customer-portal` function) |
| `src/pages/Terms.tsx` | Line `67`: `"Billing is handled by Stripe."` → `"Billing is handled by Lemon Squeezy."` |
| `src/pages/Privacy.tsx` | Line `47`: `"...handled exclusively by Stripe"` → `"...handled exclusively by Lemon Squeezy"`. Line `69`: `"Stripe"` → `"Lemon Squeezy"`. Line `83`: `"Stripe may retain billing records..."` → `"Lemon Squeezy may retain billing records..."` |

### Environment Variables

| Old Variable | New Variable | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | `LEMONSQUEEZY_API_KEY` | LemonSqueezy API key from Settings → API |
| `STRIPE_WEBHOOK_SECRET` | `LEMONSQUEEZY_WEBHOOK_SECRET` | Signing secret from Webhooks dashboard |
| `STRIPE_PRICE_MONTHLY` | `LEMONSQUEEZY_VARIANT_MONTHLY` | Variant ID (integer) for monthly plan |
| `STRIPE_PRICE_YEARLY` | `LEMONSQUEEZY_VARIANT_YEARLY` | Variant ID (integer) for yearly plan |

> **Also needed:** `LEMONSQUEEZY_STORE_ID` — required for the Create Checkout API call (the `relationships.store.data.id` field).

### No Changes Required

- `package.json` — No Stripe npm packages exist. No packages to add; LemonSqueezy SDK is imported via CDN in Deno edge functions exactly like Stripe was.
- All SQL migration files — The `subscription_status` column and its constraint (`'trial' | 'active' | 'expired'`) map cleanly to LemonSqueezy statuses. The trigger mechanism for `service_role` bypass is provider-agnostic and continues to work unchanged.
- `src/integrations/supabase/types.ts` — Auto-generated, no changes needed.
- `src/pages/Index.tsx` — No Stripe references; pricing amounts are display-only strings.

---

## LemonSqueezy API Concepts (Stripe Equivalents)

| Stripe Concept | LemonSqueezy Equivalent |
|---|---|
| `stripe.checkout.sessions.create()` | `POST /v1/checkouts` — returns a `url` in `data.attributes.url` |
| Price ID (`price_1…`) | Variant ID (integer, e.g. `12345`) |
| `stripe.customers.list({ email })` | `GET /v1/customers?filter[email]=...` |
| `stripe.billingPortal.sessions.create()` | Subscription object's `attributes.urls.customer_portal` (pre-signed URL) |
| `stripe.subscriptions.list({ customer })` | `GET /v1/subscriptions?filter[user_email]=...` or `GET /v1/subscriptions?filter[customer_id]=...` |
| Webhook header: `stripe-signature` | Webhook header: `X-Signature` (HMAC-SHA256 of raw body using signing secret) |
| `stripe.webhooks.constructEvent()` | Manual HMAC verification: `createHmac('sha256', secret).update(rawBody).digest('hex')` |
| `customer.subscription.created` | `subscription_created` |
| `customer.subscription.updated` | `subscription_updated` |
| `customer.subscription.deleted` | `subscription_expired` or `subscription_cancelled` |

### LemonSqueezy Subscription Status Mapping

| LemonSqueezy `status` | Internal `subscription_status` |
|---|---|
| `on_trial` | `trial` |
| `active` | `active` |
| `past_due` | `expired` |
| `unpaid` | `expired` |
| `cancelled` | `expired` (access still valid until `ends_at`) |
| `expired` | `expired` |
| `paused` | `expired` (conservative; no access while paused) |

### Trial End Handling

- LemonSqueezy sends `attributes.trial_ends_at` (ISO 8601 string, or `null`) directly on the subscription object — no Unix timestamp conversion needed (unlike Stripe's `sub.trial_end * 1000`).

---

## Implementation Plan

### Phase 1 — LemonSqueezy Setup (Pre-code)

- [ ] Task 1.1. Create a LemonSqueezy account and store if one does not already exist at `app.lemonsqueezy.com`.
- [ ] Task 1.2. Create two Products/Variants in the LemonSqueezy dashboard — one for the monthly plan (`$9/mo`) and one for the yearly plan (`$89/yr`). Configure both as recurring subscription variants with a 14-day free trial. Note the integer Variant IDs for each.
- [ ] Task 1.3. Generate a LemonSqueezy API key from Settings → API. Store securely — this replaces `STRIPE_SECRET_KEY`.
- [ ] Task 1.4. Locate the Store ID from the LemonSqueezy dashboard (Settings → Stores). Required for checkout creation.
- [ ] Task 1.5. In the Supabase dashboard for this project, navigate to Edge Functions → Secrets and add the five new secrets: `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_WEBHOOK_SECRET` (placeholder for now), `LEMONSQUEEZY_VARIANT_MONTHLY`, `LEMONSQUEEZY_VARIANT_YEARLY`, `LEMONSQUEEZY_STORE_ID`. Do not delete the Stripe secrets yet.

### Phase 2 — Rewrite `create-checkout` Edge Function

- [ ] Task 2.1. Replace the Stripe ESM import (`https://esm.sh/stripe@18.5.0`) with direct `fetch()` calls to the LemonSqueezy REST API (`https://api.lemonsqueezy.com/v1/checkouts`). No external SDK is needed — the LemonSqueezy API is a simple JSON:API REST interface that Deno's built-in `fetch` handles natively.
- [ ] Task 2.2. Replace the `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_YEARLY` env var reads with `LEMONSQUEEZY_VARIANT_MONTHLY` / `LEMONSQUEEZY_VARIANT_YEARLY`. Also read `LEMONSQUEEZY_STORE_ID` and `LEMONSQUEEZY_API_KEY`.
- [ ] Task 2.3. Remove the `stripe.customers.list()` pre-flight call. LemonSqueezy checkouts accept `checkout_data.email` directly and handle customer deduplication internally — no customer ID lookup is needed.
- [ ] Task 2.4. Construct the checkout payload as a JSON:API object targeting `POST https://api.lemonsqueezy.com/v1/checkouts`. Key fields: `data.relationships.store.data.id` (store ID), `data.relationships.variant.data.id` (variant ID), `data.attributes.checkout_data.email` (user email), `data.attributes.product_options.redirect_url` (success URL), `data.attributes.checkout_data.custom.user_id` (pass Supabase user ID for webhook correlation — this eliminates the need to list all users in the webhook handler). Preserve the same 14-day trial by configuring it on the variant in the LemonSqueezy dashboard (not via API parameter on checkout).
- [ ] Task 2.5. Extract the checkout URL from `response.data.attributes.url` and return it as `{ url }` — the response shape the frontend already expects remains unchanged.

### Phase 3 — Rewrite `check-subscription` Edge Function

- [ ] Task 3.1. Replace the Stripe import and instantiation with direct `fetch()` to `GET https://api.lemonsqueezy.com/v1/subscriptions?filter[user_email]={email}` using Bearer auth with `LEMONSQUEEZY_API_KEY`.
- [ ] Task 3.2. Parse the first subscription from `response.data[0]`. Map `attributes.status` to the `subscribed` boolean: treat `on_trial` and `active` as subscribed.
- [ ] Task 3.3. Read `attributes.trial_ends_at` directly (already ISO 8601 string — no Unix conversion needed). Read `attributes.renews_at` as the equivalent of `current_period_end`.
- [ ] Task 3.4. Return the same `{ subscribed, status, trial_end, current_period_end, subscription_id }` shape that `src/pages/Dashboard.tsx:56-62` already expects, so no frontend changes are required for this function's consumers.

### Phase 4 — Rewrite `customer-portal` Edge Function

- [ ] Task 4.1. Replace the Stripe `billingPortal.sessions.create()` call. In LemonSqueezy, the customer portal URL is already embedded in the subscription object as `attributes.urls.customer_portal` — it is a pre-signed URL valid for 24 hours. No separate "portal session creation" API call is needed.
- [ ] Task 4.2. Fetch the user's subscription via `GET /v1/subscriptions?filter[user_email]={email}` (same call as `check-subscription`), read `data[0].attributes.urls.customer_portal`, and return `{ url: portalUrl }`.
- [ ] Task 4.3. Update the error message: change `"No Stripe customer found. Please subscribe first."` to `"No active subscription found. Please subscribe first."` to remove the Stripe branding.

### Phase 5 — Rewrite `stripe-webhook` Edge Function (Rename to `lemonsqueezy-webhook`)

> This is the highest-risk change. The webhook is the only way subscription state is persisted to the database.

- [ ] Task 5.1. Rename the edge function directory from `supabase/functions/stripe-webhook/` to `supabase/functions/lemonsqueezy-webhook/`. Update any deployment scripts or Supabase config that reference the old function name.
- [ ] Task 5.2. Replace the Stripe signature verification (`stripe.webhooks.constructEvent()`) with LemonSqueezy's HMAC-SHA256 verification. LemonSqueezy sends the signature in the `X-Signature` request header. Verification: compute `HMAC-SHA256(rawBody, LEMONSQUEEZY_WEBHOOK_SECRET)` and compare hex digests. Deno's `crypto.subtle` or the `std/hash` module can perform this. Return `400` on mismatch.
- [ ] Task 5.3. Replace the `event.type` switch with LemonSqueezy event types. Subscribe to: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`, `subscription_paused`, `subscription_unpaused`, `subscription_resumed`.
- [ ] Task 5.4. Extract the customer email from `event.data.attributes.user_email` directly — this field is present on all LemonSqueezy subscription events without needing a secondary customer lookup API call (eliminates the `stripe.customers.retrieve()` round-trip).
- [ ] Task 5.5. **Critical improvement**: If `checkout_data.custom.user_id` was passed during checkout creation (Task 2.4), extract it from `event.meta.custom_data.user_id` in the webhook payload. This allows direct DB update by user ID without calling `supabase.auth.admin.listUsers()` — which is a full user list scan that is slow and will become a bottleneck at scale.
- [ ] Task 5.6. Implement the status mapping for LemonSqueezy statuses (see table above). Note: `cancelled` in LemonSqueezy means the subscription is still active until `ends_at` (grace period). Decide whether to set status to `active` (preserving access) or `expired` during this grace period — the recommended approach is `active` until `ends_at` has passed, then `expired`.
- [ ] Task 5.7. For `trial_ends_at`, read `event.data.attributes.trial_ends_at` directly — it is already an ISO 8601 string or `null`. No Unix timestamp conversion required.
- [ ] Task 5.8. Keep the same DB update pattern: `supabase.from("connected_accounts").update({ subscription_status, trial_ends_at }).eq("user_id", userId)` with `service_role` client. The security trigger at `supabase/migrations/20260406085655_8d7a2477...sql` continues to work unchanged.
- [ ] Task 5.9. Remove the Stripe SDK import and instantiation at the module level (lines `5-7` in the current file).

### Phase 6 — Register LemonSqueezy Webhook

- [ ] Task 6.1. Deploy the new `lemonsqueezy-webhook` edge function to Supabase. The public URL will be: `https://{your-project-ref}.supabase.co/functions/v1/lemonsqueezy-webhook`.
- [ ] Task 6.2. In the LemonSqueezy dashboard (Settings → Webhooks), create a new webhook pointing to the URL from Task 6.1. Subscribe to events: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`, `subscription_paused`, `subscription_resumed`.
- [ ] Task 6.3. Copy the signing secret from the webhook configuration page and set it as the `LEMONSQUEEZY_WEBHOOK_SECRET` Supabase secret (replacing the placeholder from Task 1.5).

### Phase 7 — Frontend Content Updates

- [ ] Task 7.1. In `src/pages/Dashboard.tsx` at line `601`, change `"Active — billed via Stripe"` to `"Active — billed via Lemon Squeezy"`.
- [ ] Task 7.2. In `src/pages/Dashboard.tsx` at line `432`, change `"...a quick setup with Stripe."` to `"...a quick setup with Lemon Squeezy."`.
- [ ] Task 7.3. In `src/pages/SettingsPage.tsx` at line `104`, wire the "Manage billing" button to actually invoke the `customer-portal` edge function (same pattern as `Dashboard.tsx:216-229`) instead of the stub toast. Remove the Stripe branding from the toast message.
- [ ] Task 7.4. In `src/pages/Terms.tsx` at line `67`, replace `"Billing is handled by Stripe."` with `"Billing is handled by Lemon Squeezy."`.
- [ ] Task 7.5. In `src/pages/Privacy.tsx` at line `47`, replace `"...handled exclusively by Stripe — we never see or store your card number."` with `"...handled exclusively by Lemon Squeezy — we never see or store your card number."`.
- [ ] Task 7.6. In `src/pages/Privacy.tsx` at line `69`, replace `"Stripe — subscription billing. Subject to Stripe's Privacy Policy."` with `"Lemon Squeezy — subscription billing. Subject to Lemon Squeezy's Privacy Policy."`.
- [ ] Task 7.7. In `src/pages/Privacy.tsx` at line `83`, replace `"Stripe may retain billing records for legal compliance purposes..."` with `"Lemon Squeezy may retain billing records for legal compliance purposes..."`.

### Phase 8 — Cleanup and Cutover

- [ ] Task 8.1. Test the full flow end-to-end in LemonSqueezy test mode: create a checkout, complete payment with a test card, confirm the webhook fires and `connected_accounts.subscription_status` updates to `trial` or `active`.
- [ ] Task 8.2. Test the customer portal URL: invoke `customer-portal`, confirm a valid URL is returned, confirm clicking it opens the LemonSqueezy customer portal.
- [ ] Task 8.3. Test `check-subscription`: invoke it for a user with an active LemonSqueezy subscription and confirm the correct `{ subscribed: true, status, trial_end, current_period_end, subscription_id }` shape is returned.
- [ ] Task 8.4. Test subscription cancellation: cancel via the customer portal, confirm the `subscription_cancelled` webhook fires and `subscription_status` updates correctly in the DB.
- [ ] Task 8.5. Once verified in test mode, switch LemonSqueezy to live mode, update the Supabase secrets with live API key and live variant IDs, and update the webhook URL to point to the production edge function.
- [ ] Task 8.6. Delete the old Stripe secrets from Supabase (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`) after confirming LemonSqueezy is fully operational and no active Stripe subscribers remain (or have been migrated/refunded).
- [ ] Task 8.7. Delete or archive the old `supabase/functions/stripe-webhook/` directory if still present.

---

## Verification Criteria

- A new user clicking "Connect to X" → checkout opens a LemonSqueezy-hosted checkout page (not Stripe).
- After completing test checkout, `connected_accounts.subscription_status` updates to `trial` within seconds of the webhook firing.
- `check-subscription` returns `{ subscribed: true, status: "on_trial" }` for a user in trial.
- "Manage billing" button in Dashboard opens the LemonSqueezy customer portal URL.
- Canceling a subscription via the portal triggers `subscription_cancelled` webhook and eventually sets `subscription_status = "expired"` at the end of the billing period.
- No `STRIPE_*` environment variable references remain in any edge function.
- No "Stripe" branding appears in any user-facing UI text.
- The `stripe-webhook` edge function no longer receives or processes any events (can be verified by checking the old Stripe webhook's delivery log in the Stripe dashboard showing no new attempts).

---

## Potential Risks and Mitigations

1. **Existing Stripe subscribers lose access during migration**
   Mitigation: Keep Stripe operational in parallel until all existing subscribers have either lapsed naturally or been contacted. Do not delete the `stripe-webhook` edge function until Stripe subscription count is zero. Alternatively, manually set `subscription_status = 'active'` in the DB for any users with active Stripe subs while migrating them to LemonSqueezy.

2. **User email mismatch between Supabase and LemonSqueezy**
   The current `check-subscription` and webhook use `user.email` to find subscriptions. If a user subscribed with a different email in LemonSqueezy, they won't be found. Mitigation: Pass `custom_data.user_id` (Supabase UUID) through checkout (Task 2.4) so the webhook can always match by user ID, not email. This makes the webhook immune to email mismatches.

3. **`customer-portal` URL is a 24-hour pre-signed link, not a persistent URL**
   Unlike Stripe's customer portal session (which is similarly short-lived), the LemonSqueezy `customer_portal` URL is only valid for 24 hours. The current implementation already opens the URL immediately in a new tab, so this is not a problem in practice. Do not cache or store this URL.

4. **`subscription_cancelled` ≠ subscription ended in LemonSqueezy**
   In LemonSqueezy, `cancelled` status means the subscription is on a grace period — the user still has access until `ends_at`. If the webhook sets `subscription_status = 'expired'` immediately on `subscription_cancelled`, users lose access prematurely. Mitigation: On `subscription_cancelled`, check if `ends_at` is in the future. If yes, set status to `active` (or introduce a new `cancelling` status). On `subscription_expired` event (fires when the grace period ends), set to `expired`. The simplest safe approach is: map `cancelled` → `active` and `expired` → `expired`.

5. **`supabase.auth.admin.listUsers()` performance in webhook**
   The current webhook scans all users to find one by email (`supabase/functions/stripe-webhook/index.ts:55-56`). This will degrade as user count grows. Mitigation: Implement Task 5.5 — pass user ID in `checkout_data.custom.user_id` so the webhook can update directly by `user_id = event.meta.custom_data.user_id`.

6. **LemonSqueezy webhook signature verification failure**
   LemonSqueezy uses `X-Signature` (HMAC-SHA256 hex), while Stripe used `stripe-signature` (a more complex format with `t=` timestamp and `v1=` prefix). The verification logic must be completely replaced. If the secret is wrong or the raw body is consumed before verification, all webhooks will return 400 and no subscriptions will update. Mitigation: Log the raw body and computed signature in the first deployment and cross-check against LemonSqueezy's webhook log in the dashboard.

7. **No LemonSqueezy Deno SDK available on esm.sh**
   Unlike Stripe which had `https://esm.sh/stripe@18.5.0`, there is no official LemonSqueezy Deno SDK. All calls must use `fetch()` directly against the REST API. This is straightforward but requires careful JSON:API response parsing. Mitigation: The plan already accounts for this (Tasks 2.1, 3.1, 4.1, 5.2 all use `fetch()`).

---

## Alternative Approaches

1. **Keep `stripe-webhook` function name, add parallel LemonSqueezy webhook function**: Instead of renaming, create `lemonsqueezy-webhook` as a new function alongside the old one, leaving `stripe-webhook` deployed but idle. This avoids any risk of losing Stripe events during the cutover window for existing subscribers. Trade-off: leaves dead code deployed.

2. **Store LemonSqueezy customer/subscription ID in the database**: Add a `lemonsqueezy_subscription_id` column to `connected_accounts` and populate it from the first webhook event. This enables future direct subscription API calls (cancel, pause, update) without email lookups. Trade-off: requires an additional migration. Recommended if you plan to add server-side subscription management beyond the customer portal.

3. **Use the `@lemonsqueezy/lemonsqueezy-js` npm package via esm.sh**: The official JavaScript SDK is available at `https://esm.sh/@lemonsqueezy/lemonsqueezy-js`. This provides typed wrappers but may have compatibility issues with the Deno runtime. Trade-off: adds a CDN dependency; `fetch()`-based approach is more explicit and reliable in this edge function context.
