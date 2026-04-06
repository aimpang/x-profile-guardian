# XGuard

**Instant alerts when your X profile changes.**  
Set once. Protected forever.

A minimal, defensive micro-SaaS that monitors **your own** X account and sends real-time alerts the moment anything changes (username, bio, profile picture, banner, etc.).

Built for creators, influencers, and anyone who wants peace of mind about their X identity.

---

## Core Features

- Real-time detection of profile changes using X’s official Activity API (XAA)
- Instant mobile push notifications + email alerts
- Clear before/after comparison for every change
- One-tap "This was me" to dismiss legitimate changes
- Simple, secure onboarding: Sign up → Connect your X account via OAuth
- We **only monitor the single account you own** — nothing else

### Pricing
- 14-day free trial
- Then **$9/month** or **$89/year** (save ~17%)

---

## How It Works

1. **Sign up** instantly with Google or email.
2. **Connect your X account** via OAuth (we only monitor what you own).
3. **Set it and forget it** — XGuard subscribes to your profile using XAA webhooks.
4. **Get alerted** the moment a change happens (push + email).
5. View details in the dashboard and mark changes as "This was me" if legitimate.

---

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind
- **Backend**: Supabase (Postgres, Auth, Edge Functions)
- **Real-time monitoring**: X Activity API (XAA) webhooks
- **Push notifications**: OneSignal
- **Payments**: Stripe
- **Authentication**: Google/Apple + X OAuth

---

## Architecture
