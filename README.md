# OgisBack — Influencer Marketing Platform

A full-stack marketplace that connects **content creators** with **brands**. Creators sync their social stats, post content, and get hired. Brands discover creators, launch campaigns, and pay securely through escrow.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, Framer Motion |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Serverless | Supabase Edge Functions (Deno runtime) |
| Payments | Stripe (Checkout, Webhooks, Customer Portal) |
| Social APIs | YouTube Data API v3, YouTube Analytics API v2, TikTok (ScrapeCreators), Facebook Graph API |

---

## Platform Roles

### Creator (Influencer)
- Syncs Instagram, TikTok, and YouTube follower/engagement stats
- Publishes content posts (images/videos) to the platform feed
- Browses brand campaigns and submits pitches
- Receives orders from brands, delivers work, collects payment via escrow
- Connects YouTube Analytics and Facebook/Instagram for real audience demographics
- Withdraws earnings via bank transfer or mobile money
- Subscribes to a paid plan to reduce platform fees

### Brand
- Discovers creators with filters (niche, platform, follower count, engagement rate)
- Posts campaigns with budget and deliverables for creators to apply to
- Places direct orders with creators (funds held in escrow until approved)
- Tops up a wallet via Stripe and pays creators from it
- Reviews deliveries and releases escrow to pay the creator
- Chats with creators directly

### Admin
- Full visibility over all users, orders, campaigns, subscriptions, and revenue
- Approves or rejects creator withdrawal requests
- Verifies creator accounts (adds verified badge)
- Views platform revenue and escrow balances

---

## Project Structure

```
ogisback/
├── src/
│   ├── pages/
│   │   ├── Landing.jsx                  # Public homepage
│   │   ├── Pricing.jsx                  # Subscription plans
│   │   ├── Login.jsx / Signup.jsx       # Auth pages
│   │   ├── CreatorPublicProfile.jsx     # Public creator profile (SEO indexed)
│   │   ├── CampaignPublicDetail.jsx     # Public campaign detail page
│   │   ├── Explore.jsx                  # Public creator discovery
│   │   ├── Forum.jsx                    # Community forum
│   │   ├── creator/
│   │   │   ├── Dashboard.jsx            # Creator home with stats
│   │   │   ├── ProfileEdit.jsx          # Edit profile + sync social accounts
│   │   │   ├── Analytics.jsx            # Follower/engagement/audience charts
│   │   │   ├── Feed.jsx                 # Content feed
│   │   │   ├── NewPost.jsx              # Upload images/videos
│   │   │   ├── Campaigns.jsx            # Browse + apply to campaigns
│   │   │   ├── Orders.jsx               # Active/completed orders
│   │   │   ├── Earnings.jsx             # Wallet + pending balance
│   │   │   ├── Withdraw.jsx             # Request withdrawal
│   │   │   ├── Billing.jsx              # Subscription + invoice history
│   │   │   └── Messages.jsx             # Chat with brands
│   │   ├── brand/
│   │   │   ├── Dashboard.jsx            # Brand home with spend overview
│   │   │   ├── Discover.jsx             # Search creators
│   │   │   ├── Campaigns.jsx            # Create/manage campaigns
│   │   │   ├── NewCampaign.jsx          # Campaign creation form
│   │   │   ├── Orders.jsx               # Orders with creators
│   │   │   ├── Payments.jsx             # Spend chart + transaction history
│   │   │   ├── AddFunds.jsx             # Top up wallet via Stripe
│   │   │   ├── Saved.jsx                # Bookmarked creators
│   │   │   └── Messages.jsx             # Chat with creators
│   │   └── admin/
│   │       ├── Dashboard.jsx            # Platform revenue + stats
│   │       ├── Users.jsx                # Manage/verify/ban users
│   │       ├── Orders.jsx               # All platform orders
│   │       ├── Escrow.jsx               # Escrow management
│   │       ├── Withdrawals.jsx          # Approve/reject withdrawals
│   │       └── Subscriptions.jsx        # All subscriptions
│   ├── lib/
│   │   ├── db.js          # All Supabase database queries
│   │   ├── payments.js    # Stripe checkout, subscriptions, escrow helpers
│   │   ├── socialApi.js   # YouTube, TikTok, Facebook/Instagram API calls
│   │   ├── storage.js     # Supabase Storage upload helpers
│   │   ├── normalize.js   # DB row → UI shape mappers + number formatters
│   │   └── admin.js       # Admin-only DB queries
│   ├── context/
│   │   ├── AuthContext.jsx                # Auth state, user profile, roles
│   │   └── MessageNotificationContext.jsx # Real-time message badge + sound
│   └── hooks/
│       ├── useRealtime.js       # Live notifications, messages, order updates
│       └── useInstagramData.js  # Live Instagram profile fetch
├── supabase/
│   ├── migrations/              # Run these in order to build the database
│   └── functions/
│       ├── create-checkout-session   # Starts Stripe subscription checkout
│       ├── create-portal-session     # Opens Stripe customer portal
│       ├── create-top-up-session     # Starts Stripe wallet top-up
│       ├── cancel-subscription       # Cancels subscription at period end
│       ├── stripe-webhook            # Handles all Stripe payment events
│       ├── facebook-auth             # Facebook OAuth token exchange
│       ├── instagram-audience        # Fetches IG audience demographics
│       ├── instagram-profile         # Fetches public IG profile + posts
│       ├── instagram-stats           # Fetches IG follower/engagement stats
│       ├── tiktok-auth               # TikTok OAuth token exchange
│       ├── tiktok-followers          # Fetches TikTok followers + country breakdown
│       ├── tiktok-stats              # Fetches TikTok profile stats
│       ├── youtube-auth              # Google OAuth (Analytics scope)
│       └── youtube-audience          # Fetches YouTube audience via Analytics API
└── .env                         # Your environment variables (never commit this)
```

---

## Database Tables

| Table | What it stores |
|---|---|
| `profiles` | One row per user — role (`creator`/`brand`/`admin`), plan, profile complete flag |
| `creator_profiles` | Creator data: social handles, follower counts, rates, audience data, wallet balance |
| `brand_profiles` | Brand data: industry, logo, wallet balance |
| `campaigns` | Brand-created campaign listings (title, budget, niche, platforms) |
| `campaign_applications` | Creator applications/pitches to campaigns |
| `orders` | Confirmed deals between brands and creators |
| `escrow` | Escrow record per order — tracks held/released/refunded state |
| `wallet_transactions` | Every money movement (top-ups, payments, credits, withdrawals) |
| `withdrawals` | Creator withdrawal requests (pending → completed/failed) |
| `subscriptions` | Stripe subscription records per user |
| `conversations` | Messaging threads (one per creator ↔ brand pair) |
| `messages` | Individual messages within a conversation |
| `notifications` | In-app notifications for all users |
| `content_posts` | Creator-published posts (images/videos with captions) |
| `post_likes` / `post_comments` | Engagement on content posts |
| `follows` / `saved_creators` | Social graph (follow creators, bookmark for brands) |
| `forum_posts` / `forum_replies` | Community forum |
| `order_reviews` | Brand reviews on completed orders |

---

## Payment Flow

```
Brand tops up wallet
  → Stripe Checkout → stripe-webhook credits brand wallet

Brand places order with creator
  → escrow record created, funds locked from brand wallet

Creator delivers work
  → brand reviews delivery

Brand approves
  → release_escrow() SQL function pays creator wallet (minus platform fee)

Creator requests withdrawal
  → admin reviews → marks completed → funds sent externally
```

Platform fee is deducted at escrow release. Fee rate is set per plan in `src/lib/payments.js → getFeeRate()`.

---

## Subscription Plans

| Plan | Creator | Brand |
|---|---|---|
| Free | 20% platform fee, limited posts | Basic access |
| Mini | 18% platform fee, more posts | $49/month |
| Max | 15% platform fee, unlimited | $149/month |

7-day free trial on first subscription. Users manage billing via Stripe Customer Portal.

After a successful Stripe payment, the `stripe-webhook` edge function automatically updates `profiles.plan` in the database.

---

## Setup Guide

### Step 1 — Install dependencies

```bash
cd ogisback
npm install
```

### Step 2 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your **Project URL** and **anon public key** from Settings → API

### Step 3 — Environment variables

Create a `.env` file in the `ogisback/` folder:

```env
# Supabase (required)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# YouTube Data API v3 (for syncing subscriber/view counts)
VITE_YOUTUBE_API_KEY=your_youtube_api_key

# TikTok Developer App (for TikTok OAuth)
VITE_TIKTOK_CLIENT_KEY=your_tiktok_client_key

# Google OAuth Client (for YouTube Analytics audience data)
VITE_GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id

# Facebook App (for Instagram audience data)
VITE_FACEBOOK_APP_ID=your_facebook_app_id
```

### Step 4 — Run database migrations

In the **Supabase SQL Editor**, run each migration file from `supabase/migrations/` in order (001, 002, 003... up to the latest number).

### Step 5 — Deploy Edge Functions

```bash
npx supabase link --project-ref your-project-ref
npx supabase functions deploy --project-ref your-project-ref
```

### Step 6 — Set Edge Function secrets

In **Supabase Dashboard → Edge Functions → Manage secrets**, add:

```
STRIPE_SECRET_KEY          = sk_live_...
STRIPE_WEBHOOK_SECRET      = whsec_...
TIKTOK_CLIENT_SECRET       = your_tiktok_client_secret
FACEBOOK_APP_SECRET        = your_facebook_app_secret
GOOGLE_CLIENT_SECRET       = your_google_oauth_client_secret
SCRAPECREATORS_API_KEY     = your_scrapecreators_key
SUPABASE_SERVICE_ROLE_KEY  = your_supabase_service_role_key
```

### Step 7 — Configure Stripe webhook

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://your-project-ref.supabase.co/functions/v1/stripe-webhook`
3. Enable these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`
4. Copy the **Signing secret** → paste as `STRIPE_WEBHOOK_SECRET` above

### Step 8 — Update Stripe price IDs

After creating products in the Stripe Dashboard, update the price IDs in `src/lib/payments.js → STRIPE_PRICES` to match your Stripe product IDs.

### Step 9 — Run locally

```bash
npm run dev
```

App runs at `http://localhost:5173`

---

## Social API Setup

### YouTube (subscriber + view counts)

1. [Google Cloud Console](https://console.cloud.google.com) → Create project
2. Enable **YouTube Data API v3**
3. APIs & Services → Credentials → Create API Key → paste as `VITE_YOUTUBE_API_KEY`

### YouTube Analytics (audience demographics)

1. Same Google Cloud project — also enable **YouTube Analytics API**
2. Create an **OAuth 2.0 Client ID** (Web application type)
3. Add authorized redirect URI: `http://localhost:5173/auth/youtube` (and your production URL)
4. Copy Client ID → `VITE_GOOGLE_OAUTH_CLIENT_ID`
5. Copy Client Secret → Supabase secret `GOOGLE_CLIENT_SECRET`

### TikTok (follower counts + audience)

1. Register at [developers.tiktok.com](https://developers.tiktok.com)
2. Create an app, add redirect URI: `http://localhost:5173/auth/tiktok`
3. Copy **Client Key** → `VITE_TIKTOK_CLIENT_KEY`
4. Copy **Client Secret** → Supabase secret `TIKTOK_CLIENT_SECRET`
5. For follower sampling (audience country breakdown): sign up at [ScrapeCreators](https://scrapecreators.com) → copy API key → Supabase secret `SCRAPECREATORS_API_KEY`

### Instagram / Facebook (audience demographics)

1. [Meta for Developers](https://developers.facebook.com) → Create App → type: "Business"
2. Add **Facebook Login** product
3. Add redirect URI: `http://localhost:5173/auth/facebook`
4. Request permissions: `pages_show_list`, `pages_read_engagement`, `instagram_basic`, `instagram_manage_insights`
5. Copy **App ID** → `VITE_FACEBOOK_APP_ID`
6. Copy **App Secret** → Supabase secret `FACEBOOK_APP_SECRET`

> Note: Instagram audience data requires the creator to have a **Facebook Business Page** linked to their Instagram Professional account.

---

## Google & Facebook OAuth (Login)

These are for **user authentication** (sign in with Google / Facebook), separate from the social API keys above.

1. **Supabase Dashboard → Auth → Providers → Google** — paste your Google OAuth Client ID + Secret
2. **Supabase Dashboard → Auth → Providers → Facebook** — paste your Facebook App ID + Secret
3. Authorized redirect URI for both: `https://your-project-ref.supabase.co/auth/v1/callback`

---

## Making a User an Admin

Run this in the Supabase SQL Editor (replace the email):

```sql
UPDATE profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'youremail@example.com'
);
```

---

## Key Files for Customization

| What to change | File |
|---|---|
| Plan names, prices, feature list | `src/pages/Pricing.jsx` |
| Stripe price IDs and fee rates | `src/lib/payments.js` |
| Brand colors and fonts | `tailwind.config.js` |
| Logo | `src/components/Logo.jsx` |
| SEO meta tags | `src/components/SEO.jsx` |
| Auth redirect URLs | `src/context/AuthContext.jsx` |
| Email templates (verification, reset) | Supabase Dashboard → Auth → Email Templates |
| Withdrawal methods shown to creators | `src/pages/creator/Withdraw.jsx` |

---

## Deployment (Production)

### Frontend
Deploy to **Vercel** or **Netlify**:
```bash
npm run build
# deploy the dist/ folder
```
Add all `VITE_*` environment variables in your hosting provider's dashboard.

### Edge Functions
Already deployed to Supabase — no extra hosting needed.

### Database
Runs on Supabase — no extra hosting needed.

Make sure to update all redirect URIs in Google/Facebook/TikTok developer consoles to use your production domain.
