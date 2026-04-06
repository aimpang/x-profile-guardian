# XSentinel - Real-Time X Account Protection

XSentinel is a defensive monitoring service designed to protect personal X (formerly Twitter) accounts from unauthorized changes. It sends instant alerts when your X profile is modified, helping creators and influencers detect potential account compromises immediately.

## Key Features

- **Real-Time Detection** – Monitors profile changes including username, bio, picture, and banner using X's official Activity API
- **Instant Notifications** – Push notifications and email alerts sent immediately upon any change detection
- **Before/After Comparison** – View side-by-side comparisons of profile changes for complete transparency
- **Quick Verification** – Dismiss legitimate changes with a single tap ("This was me")
- **Simple Setup** – Fast onboarding via Google/email signup followed by X OAuth authentication
- **Single-Account Monitoring** – Focused protection for the specific account you authorize
- **Flexible Pricing** – 14-day free trial, then $9/month or $89/year

## Tech Stack

- **Frontend**: React 18 + TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Payments**: Stripe integration
- **Notifications**: OneSignal for push notifications
- **Deployment**: Vite + Supabase

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will start on `http://localhost:8080`

### Build

```bash
npm run build
```

### Testing

```bash
npm run test           # Run tests once
npm run test:watch    # Run tests in watch mode
```

## Project Structure

```
src/
├── pages/             # Page components (Login, Signup, Dashboard, etc.)
├── components/        # Reusable components and UI
├── contexts/          # React Context (Auth)
├── integrations/      # External services (Supabase)
├── hooks/             # Custom React hooks
├── lib/               # Utilities
└── main.tsx           # App entry point

supabase/
└── functions/         # Edge functions for Stripe and X webhooks
```

## Database Schema

### connected_accounts
Stores X account connection info and subscription details
- user_id, x_user_id, x_username
- subscription_status, trial_ends_at
- push_enabled, push_token

### alerts
Stores profile change alerts
- user_id, event_type, old_data, new_data
- is_legitimate, created_at

## Environment Variables

Create a `.env.local` file:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

© 2026 XSentinel. All rights reserved.
