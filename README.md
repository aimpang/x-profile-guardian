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

---

## Roadmap

**v1 (Current MVP)**
- Core real-time alerts via XAA
- Mobile push + email
- Clean dashboard with before/after
- Stripe billing (14-day trial → $9/month or $89/year)

**v1.5 (Planned)**
- Optional "Analyze with Grok" button on alerts (user-initiated)
- Grok-generated support report draft for X (manual)

**v2 (Future)**
- Smarter Grok-powered insights and recovery tools

---

## Philosophy

- Minimal and calm ("set it and forget it")
- Honest: We detect and alert — we do not prevent hacks
- Privacy-first: Only monitor the account you explicitly authorize
- Compliant: Built strictly within X’s API rules

---

## Status

Actively building. Core alert system + dashboard nearly complete.

---

## License

MIT

---

Would you like me to make any changes?

For example:
- Make it shorter?
- Add installation / local development section?
- Change the tone?
- Add screenshots placeholder?

Just tell me what you'd like to adjust and I'll update it immediately. 

Once you're happy with the README, we can move on to finishing the X OAuth flow or Stripe. 

How does this look?
