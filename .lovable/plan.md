

# X OAuth Integration — Important Limitation

## The Problem

Lovable Cloud natively supports only **Email & Password, Phone, Google, and Apple** for OAuth. **X/Twitter is not a supported OAuth provider** in Lovable Cloud, so we cannot use `supabase.auth.signInWithOAuth("twitter")`.

## Proposed Alternative: Edge Function OAuth Flow

We can implement X OAuth 2.0 manually using an edge function:

1. **Create `supabase/functions/x-oauth-start/index.ts`** — Generates the X OAuth 2.0 authorization URL with PKCE, stores the `code_verifier` in a temporary table, and returns the redirect URL to the client.

2. **Create `supabase/functions/x-oauth-callback/index.ts`** — Receives the OAuth callback code, exchanges it for an access token, fetches the user's X profile (`/2/users/me`), and inserts into `connected_accounts`.

3. **Create a callback page `src/pages/XCallback.tsx`** — Handles the redirect from X, calls the callback edge function, then redirects to dashboard.

4. **Update `src/pages/Dashboard.tsx`** — Replace the placeholder `handleConnectX` with a real flow that calls the start edge function and redirects to X.

## Required Secrets

Before implementation, you'll need to provide:
- **`X_CLIENT_ID`** — Your X/Twitter OAuth 2.0 Client ID
- **`X_CLIENT_SECRET`** — Your X/Twitter OAuth 2.0 Client Secret

These are obtained from the [X Developer Portal](https://developer.x.com/en/portal/dashboard). You need an app with **OAuth 2.0** enabled and the callback URL set to your edge function URL.

## Database Changes

- Add a new table `x_oauth_states` to temporarily store PKCE `code_verifier` values (with auto-expiry)

## Flow Summary

```text
User clicks "Connect" → Edge Function generates auth URL → User redirects to X
→ X redirects back to /x-callback → Callback edge function exchanges code
→ Fetches X profile → Inserts connected_accounts row → Redirect to /dashboard
```

## Files

| File | Action |
|------|--------|
| `supabase/functions/x-oauth-start/index.ts` | Create — generate OAuth URL |
| `supabase/functions/x-oauth-callback/index.ts` | Create — exchange code, fetch profile, insert DB |
| `src/pages/XCallback.tsx` | Create — handle redirect |
| `src/pages/Dashboard.tsx` | Edit — wire up real connect flow |
| `src/App.tsx` | Edit — add `/x-callback` route |
| Migration | Create `x_oauth_states` table |

**Do you want to proceed?** You'll need to provide your X Developer credentials first.

