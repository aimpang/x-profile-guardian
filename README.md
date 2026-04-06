# XGuard

**Instant alerts when your X profile changes.**  
Set once. Protected forever.

A minimal, defensive micro-SaaS that monitors your own X account and notifies you in real-time if anything changes (username, bio, profile picture, banner, etc.).

Built to protect creators, influencers, and power users from account takeovers and unauthorized changes.

---

## The Problem

Hackers frequently take over X accounts by changing the handle, bio, or profile picture. Most owners only notice hours or days later — often after damage has already been done.

XGuard solves this by giving you **instant alerts** the moment any public profile change occurs.

---

## How It Works (User Flow)

1. **Sign up** — Instantly with Google or email.
2. **Connect your X account** — Authorize via OAuth (we only monitor the account you own).
3. **Set it and forget it** — XGuard subscribes to your profile using X’s official Activity API (XAA).
4. **Get alerted** — Receive instant mobile push + email notifications with clear before/after details when anything changes.
5. **Quick action** — Tap “This was me” to dismiss legitimate changes.

---

## Architecture & Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS (Vite)
- **Backend**: Supabase (Postgres, Auth, Edge Functions, Realtime)
- **Real-time monitoring**: X Activity API (XAA) webhooks
- **Push notifications**: OneSignal (mobile + web)
- **Payments**: Stripe (14-day free trial → $9/month)
- **Deployment**: Supabase + Vercel (planned)

### Key Components

- `connected_accounts` – Stores the user’s linked X account + last known snapshot
- `alerts` – History of all detected profile changes with before/after data
- `xaa-webhook` – Edge Function that receives real-time events from X and creates alerts
- OAuth flow for secure X account connection

---

## Design Philosophy

- **Minimal & Calm** — “Set it and forget it” experience
- **Honest** — We do not prevent hacks; we detect and alert you immediately
- **Privacy-first** — We only monitor the single X account you explicitly authorize
- **Trustworthy** — Clear before/after diffs and one-tap “This was me” dismissal

---

## Current Status (April 2026)

- Dark X-themed UI completed
- Dashboard with connected / not-connected states
- Landing page with clear value proposition
- Supabase schema + basic webhook structure
- Stripe integration in progress
- OneSignal push setup started

**Next priorities:**
1. Full X OAuth flow
2. Production-ready XAA webhook with proper signature verification
3. Stripe subscription + billing portal
4. Real OneSignal mobile push notifications
5. Cleanup of leftover template routes

---

## Tech & Architecture Diagram (Planned)
