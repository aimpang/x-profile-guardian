# XGuard

**Instant alerts when your X profile changes.**  
Set once. Protected forever.

A minimal, defensive micro-SaaS that monitors **your own** X account and sends real-time alerts the moment anything changes (username, bio, profile picture, banner, etc.).

Built for creators, influencers, and anyone who wants peace of mind about their X identity.

---

## Core Features (v1)

- Real-time detection of profile changes using X’s official Activity API (XAA)
- Instant mobile push notifications + email alerts
- Clear before/after comparison for every change
- One-tap "This was me" to mark legitimate changes
- Simple onboarding: Sign up → Connect your X account via OAuth
- We **only monitor the single account you own**

### Pricing
- 14-day free trial
- Then **$9/month** or **$89/year**

---

## How It Works

1. **Sign up** instantly with Google or email.
2. **Connect your X account** via OAuth (we only monitor what you own).
3. **Set it and forget it** — XGuard subscribes to your profile using XAA webhooks.
4. **Get alerted** the moment a change happens (push + email).
5. View details in the dashboard and mark changes as "This was me" if legitimate.

---

## Optional Grok Features (v1.5)

After receiving an alert, users can manually trigger smart assistance:

- **"Analyze with Grok"** — Grok provides a clear explanation and risk assessment of the change.
- **"Generate report for X"** — Grok creates a polished, ready-to-use support ticket draft with before/after evidence.

**Important:** These Grok features are **user-initiated only**. The user must click the button for each specific alert. Grok does not run automatically.

---

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind
- **Backend**: Supabase (Postgres, Auth, Edge Functions)
- **Real-time monitoring**: X Activity API (XAA) webhooks
- **Push notifications**: OneSignal
- **Payments**: Stripe
- **Optional AI layer**: Grok via XMCP (manual/user-triggered only)

---

## Architecture
User → Frontend (React)
↓
Supabase Auth
↓
X OAuth → connected_accounts table
↓
XAA Webhook (Edge Function) → alerts table
↓
OneSignal Push + Email → User
(Optional) User clicks → Grok Analysis (via XMCP) → Shows draft/report


---

## Philosophy

- Minimal and calm ("set it and forget it")
- Honest: We detect and alert — we do not prevent hacks
- Privacy-first: Only monitor the account you explicitly authorize
- Compliant: Grok features are manual and user-initiated

---

## Status

Actively building. Core alert system + dashboard nearly complete.

**Next priorities:**
- Complete X OAuth flow
- Stripe billing integration
- OneSignal mobile push
- Polish & cleanup

---

## License

MIT
