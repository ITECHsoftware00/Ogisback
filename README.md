# OgisBack

**The content-first influencer marketplace.** Creators post content. Brands discover them. They connect, agree on deals, and pay securely through escrow.

---

## What is OgisBack?

OgisBack bridges the gap between content creators and brands. Creators build their portfolio, set their rates, and get discovered. Brands browse verified creators, launch campaigns, and hire talent — all with payments protected by escrow.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 8 |
| Styling | Tailwind CSS + Framer Motion |
| Backend | Supabase (Postgres + Auth + Edge Functions) |
| Payments | Stripe (Checkout, Customer Portal, Webhooks) |
| SEO | react-helmet-async + JSON-LD structured data |

---

## Features

### For Creators
- Portfolio feed with content posts
- Public profile page (indexed by Google)
- Browse & apply to brand campaigns
- Order management with revision tracking
- Wallet, earnings dashboard & withdrawals
- Subscription plans (Free / Mini / Max)

### For Brands
- Discover and filter creators by niche, platform, follower count
- Launch campaigns with budget, deliverables & deadlines
- Wallet top-up via Stripe
- Escrow-protected payments — funds release only on approval
- Full order and payment history

### Platform
- Google OAuth + Facebook/Instagram OAuth
- Role picker (Creator vs Brand) before sign-in
- Supabase Row Level Security on all tables
- Atomic escrow: `release_escrow()` / `refund_escrow()` SQL functions
- Stripe webhook → Supabase DB sync (subscription plan, wallet top-up)
- Sitemap, robots.txt, Open Graph + Twitter Card tags on every page

---

## Project Structure

```
src/
├── components/
│   ├── layout/          # Navbar, Sidebar, DashboardLayout
│   ├── Logo.jsx         # SVG logo with gradient wordmark
│   ├── SubscriptionBilling.jsx
│   └── SEO.jsx
├── context/
│   └── AuthContext.jsx  # Auth state, OAuth, profile fetch
├── lib/
│   ├── db.js            # All Supabase query functions
│   ├── normalize.js     # DB row → UI shape adapters
│   ├── payments.js      # Stripe + escrow helpers
│   └── storage.js       # File upload helpers
├── pages/
│   ├── brand/           # Brand dashboard pages
│   ├── creator/         # Creator dashboard pages
│   ├── Landing.jsx
│   ├── Login.jsx / Signup.jsx
│   ├── CreatorPublicProfile.jsx
│   ├── CampaignPublicDetail.jsx
│   └── Pricing.jsx
supabase/
├── migrations/
│   ├── 001_main.sql     # Core schema: profiles, campaigns, orders, messages
│   └── 002_payments.sql # Subscriptions, escrow, wallet, Stripe prices
└── functions/
    ├── create-checkout-session/
    ├── create-top-up-session/
    ├── create-portal-session/
    ├── cancel-subscription/
    └── stripe-webhook/
```

---

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/ITECHsoftware00/Ogisback.git
cd Ogisback/ogisback
npm install
```

### 2. Environment variables

Create `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run database migrations

In Supabase SQL Editor, run in order:
1. `supabase/migrations/001_main.sql`
2. `supabase/migrations/002_payments.sql`

### 4. Deploy Edge Functions

```bash
supabase link --project-ref your_project_ref
supabase functions deploy create-checkout-session
supabase functions deploy create-top-up-session
supabase functions deploy create-portal-session
supabase functions deploy cancel-subscription
supabase functions deploy stripe-webhook
```

Set secrets in Supabase Dashboard → Edge Functions → Secrets:
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 5. Start dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Auth Setup

### Google OAuth
1. Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID
2. Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`
3. Paste Client ID + Secret in Supabase Dashboard → Auth → Providers → Google

### Facebook / Instagram OAuth
1. Meta Developer Console → Create App → "Authenticate and request data from users"
2. Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`
3. Paste App ID + Secret in Supabase Dashboard → Auth → Providers → Facebook

---

## Subscription Plans

| Plan | Creator | Brand |
|------|---------|-------|
| Free | 20% fee, 5 posts/mo | Basic access |
| Mini | 18% fee, 50 posts/mo | $49/mo |
| Max  | 15% fee, unlimited | $149/mo |

7-day free trial on first subscription. Managed via Stripe Customer Portal.

---

## Payment Flow

```
Brand tops up wallet (Stripe)
       ↓
Brand places order → funds move to Escrow
       ↓
Creator delivers content
       ↓
Brand approves → release_escrow() → Creator wallet credited
       ↓
Creator withdraws to bank
```

---

## License

MIT
