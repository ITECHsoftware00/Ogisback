# Facebook + Instagram OAuth Auto-Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let creators connect their Facebook account via OAuth to automatically sync both their Facebook Page follower count and linked Instagram Business follower count into their creator profile.

**Architecture:** User clicks "Connect Facebook/Instagram" in ProfileEdit → redirected to Facebook OAuth dialog → Facebook redirects back to `/auth/facebook` with a code → FacebookCallback page sends the code to a Supabase edge function → edge function exchanges code for a user token, fetches Facebook Pages and linked Instagram Business account via Graph API → returns follower counts → saved to `creator_profiles`. Pattern mirrors the existing TikTok OAuth flow.

**Tech Stack:** React 19, Vite, Supabase Edge Functions (Deno), Facebook Graph API v19.0

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `supabase/migrations/018_facebook.sql` | Add `facebook_page` + `facebook_followers` columns |
| Create | `supabase/functions/facebook-auth/index.ts` | Server-side token exchange + Graph API calls |
| Modify | `src/lib/socialApi.js` | Add `getFacebookAuthUrl()` + `exchangeFacebookCode()` |
| Create | `src/pages/FacebookCallback.jsx` | Handle `/auth/facebook` redirect, save data |
| Modify | `src/App.jsx` | Register `/auth/facebook` route |
| Modify | `src/pages/creator/ProfileEdit.jsx` | Add Facebook platform row + connect buttons for Instagram & Facebook |
| Modify | `ogisback/.env` | Add `VITE_FACEBOOK_APP_ID` |

---

## Task 1: Database Migration — Add Facebook Columns

**Files:**
- Create: `supabase/migrations/018_facebook.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- Migration 018: Add Facebook page fields to creator_profiles

ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS facebook_page      TEXT,
  ADD COLUMN IF NOT EXISTS facebook_followers INTEGER DEFAULT 0;
```

Save to `supabase/migrations/018_facebook.sql`.

- [ ] **Step 2: Run in Supabase SQL Editor**

Go to your Supabase project → SQL Editor → paste and run the SQL above.

Expected: "Success. No rows returned."

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/018_facebook.sql
git commit -m "feat: add facebook_page and facebook_followers columns to creator_profiles"
```

---

## Task 2: Facebook Developer App Setup

- [ ] **Step 1: Create a Facebook App**

1. Go to https://developers.facebook.com/apps/
2. Click **Create App** → choose **Business** type
3. App name: `OgisBack` (or your brand name)
4. Once created, note your **App ID** and **App Secret** (Settings → Basic)

- [ ] **Step 2: Add Facebook Login product**

In your app dashboard → Add Product → **Facebook Login** → Web.
Set the **Valid OAuth Redirect URIs** to:
```
http://localhost:5173/auth/facebook
https://your-production-domain.com/auth/facebook
```

- [ ] **Step 3: Add `VITE_FACEBOOK_APP_ID` to `.env`**

Open `ogisback/.env` and add:
```
VITE_FACEBOOK_APP_ID=YOUR_FACEBOOK_APP_ID_HERE
```
Replace `YOUR_FACEBOOK_APP_ID_HERE` with the App ID from step 1.

- [ ] **Step 4: Add secrets to Supabase edge function environment**

Run these two commands (replace values with your real credentials):
```bash
cd ogisback
npx supabase secrets set FACEBOOK_APP_ID=YOUR_FACEBOOK_APP_ID_HERE
npx supabase secrets set FACEBOOK_APP_SECRET=YOUR_FACEBOOK_APP_SECRET_HERE
```

---

## Task 3: Supabase Edge Function — `facebook-auth`

**Files:**
- Create: `supabase/functions/facebook-auth/index.ts`

- [ ] **Step 1: Create the edge function file**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const APP_ID     = Deno.env.get('FACEBOOK_APP_ID')     || '';
const APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET') || '';
const GRAPH      = 'https://graph.facebook.com/v19.0';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { code, redirectUri } = await req.json();
    if (!code || !redirectUri) {
      return new Response(JSON.stringify({ error: 'Missing code or redirectUri' }), { status: 400, headers: CORS });
    }

    // 1. Exchange code for user access token
    const tokenUrl = new URL(`${GRAPH}/oauth/access_token`);
    tokenUrl.searchParams.set('client_id',     APP_ID);
    tokenUrl.searchParams.set('client_secret', APP_SECRET);
    tokenUrl.searchParams.set('redirect_uri',  redirectUri);
    tokenUrl.searchParams.set('code',          code);

    const tokenRes  = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return new Response(JSON.stringify({ error: 'Token exchange failed', detail: tokenData }), { status: 400, headers: CORS });
    }
    const userToken = tokenData.access_token;

    // 2. Get user's Facebook Pages (fan_count = followers)
    const pagesRes  = await fetch(`${GRAPH}/me/accounts?fields=name,fan_count,access_token&access_token=${userToken}`);
    const pagesData = await pagesRes.json();
    const pages     = pagesData?.data || [];

    // Pick the page with the most fans
    const topPage = pages.sort((a: any, b: any) => (b.fan_count || 0) - (a.fan_count || 0))[0];

    let instagramUsername  = '';
    let instagramFollowers = 0;
    let facebookPageName   = topPage?.name   || '';
    let facebookFollowers  = topPage?.fan_count || 0;

    // 3. Get Instagram Business Account linked to the top page
    if (topPage?.id && topPage?.access_token) {
      const igLinkRes  = await fetch(`${GRAPH}/${topPage.id}?fields=instagram_business_account&access_token=${topPage.access_token}`);
      const igLinkData = await igLinkRes.json();
      const igId       = igLinkData?.instagram_business_account?.id;

      if (igId) {
        const igRes  = await fetch(`${GRAPH}/${igId}?fields=username,followers_count&access_token=${topPage.access_token}`);
        const igData = await igRes.json();
        instagramUsername  = igData?.username       || '';
        instagramFollowers = igData?.followers_count || 0;
      }
    }

    return new Response(JSON.stringify({
      facebookPageName,
      facebookFollowers,
      instagramUsername,
      instagramFollowers,
    }), { headers: { ...CORS, 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: CORS });
  }
});
```

Save to `supabase/functions/facebook-auth/index.ts`.

- [ ] **Step 2: Deploy the edge function**

```bash
cd ogisback
npx supabase functions deploy facebook-auth
```

Expected output: `Deployed Function facebook-auth`

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/facebook-auth/index.ts
git commit -m "feat: add facebook-auth edge function for token exchange and Graph API calls"
```

---

## Task 4: Frontend — `getFacebookAuthUrl` + `exchangeFacebookCode` in socialApi.js

**Files:**
- Modify: `src/lib/socialApi.js`

Current file already has `getTikTokAuthUrl`, `exchangeTikTokCode`, `fetchYouTubeStats`. Add two new exports at the bottom.

- [ ] **Step 1: Add Facebook functions to `src/lib/socialApi.js`**

Open `src/lib/socialApi.js` and append after the last line:

```js
const FB_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;

export function getFacebookAuthUrl(redirectUri) {
  const state = crypto.randomUUID();
  sessionStorage.setItem('fb_oauth_state', state);
  const params = new URLSearchParams({
    client_id:     FB_APP_ID,
    redirect_uri:  redirectUri,
    scope:         'pages_show_list,pages_read_engagement,instagram_basic',
    state,
    response_type: 'code',
  });
  return `https://www.facebook.com/v19.0/dialog/oauth?${params}`;
}

export async function exchangeFacebookCode(code, redirectUri) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/facebook-auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirectUri }),
  });
  if (!res.ok) return null;
  return await res.json();
}
```

Note: `SUPABASE_URL` is already declared at the top of this file — no new import needed.

- [ ] **Step 2: Verify the file compiles**

```bash
cd ogisback
npm run build 2>&1 | tail -5
```

Expected: build succeeds (no errors about socialApi.js).

- [ ] **Step 3: Commit**

```bash
git add src/lib/socialApi.js
git commit -m "feat: add getFacebookAuthUrl and exchangeFacebookCode to socialApi"
```

---

## Task 5: FacebookCallback Page

**Files:**
- Create: `src/pages/FacebookCallback.jsx`

- [ ] **Step 1: Create the callback page**

```jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeFacebookCode } from '../lib/socialApi';
import { updateCreatorProfile } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function FacebookCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState('Connecting Facebook…');

  useEffect(() => {
    const code  = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (error) {
      toast.error('Facebook connection cancelled');
      navigate('/creator/profile/edit');
      return;
    }

    const savedState = sessionStorage.getItem('fb_oauth_state');
    if (!code || state !== savedState) {
      toast.error('Invalid Facebook callback');
      navigate('/creator/profile/edit');
      return;
    }

    const redirectUri = `${window.location.origin}/auth/facebook`;

    exchangeFacebookCode(code, redirectUri).then(async (data) => {
      if (!data || data.error) {
        setStatus('Failed to connect Facebook');
        toast.error('Could not connect Facebook. Try again.');
        navigate('/creator/profile/edit');
        return;
      }

      if (user?.id) {
        const updates = {
          facebook_page:      data.facebookPageName   || null,
          facebook_followers: data.facebookFollowers  || 0,
        };
        if (data.instagramUsername) {
          updates.instagram          = data.instagramUsername;
          updates.instagram_followers = data.instagramFollowers || 0;
        }
        await updateCreatorProfile(user.id, updates);
      }

      sessionStorage.removeItem('fb_oauth_state');

      const parts = [];
      if (data.facebookFollowers) parts.push(`${(data.facebookFollowers).toLocaleString()} Facebook followers`);
      if (data.instagramFollowers) parts.push(`${(data.instagramFollowers).toLocaleString()} Instagram followers`);
      toast.success(parts.length ? `Connected! ${parts.join(' · ')} synced.` : 'Facebook connected.');

      navigate('/creator/profile/edit');
    });
  }, []); // eslint-disable-line

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0A0A0F]">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 font-medium">{status}</p>
      </div>
    </div>
  );
}
```

Save to `src/pages/FacebookCallback.jsx`.

- [ ] **Step 2: Commit**

```bash
git add src/pages/FacebookCallback.jsx
git commit -m "feat: add FacebookCallback page for OAuth redirect handling"
```

---

## Task 6: Register the `/auth/facebook` Route in App.jsx

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add the import at line 17 (after TikTokCallback import)**

In `src/App.jsx`, find:
```jsx
import TikTokCallback from './pages/TikTokCallback';
```

Replace with:
```jsx
import TikTokCallback from './pages/TikTokCallback';
import FacebookCallback from './pages/FacebookCallback';
```

- [ ] **Step 2: Add the route (after the TikTok callback route)**

Find:
```jsx
<Route path="/auth/tiktok" element={<TikTokCallback />} />
```

Replace with:
```jsx
<Route path="/auth/tiktok" element={<TikTokCallback />} />
<Route path="/auth/facebook" element={<FacebookCallback />} />
```

- [ ] **Step 3: Verify build**

```bash
cd ogisback
npm run build 2>&1 | tail -5
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: register /auth/facebook route"
```

---

## Task 7: ProfileEdit — Add Facebook Platform + Connect Buttons

**Files:**
- Modify: `src/pages/creator/ProfileEdit.jsx`

- [ ] **Step 1: Add `getFacebookAuthUrl` import**

Find (line 9):
```js
import { fetchYouTubeStats, getTikTokAuthUrl } from '../../lib/socialApi';
```

Replace with:
```js
import { fetchYouTubeStats, getTikTokAuthUrl, getFacebookAuthUrl } from '../../lib/socialApi';
```

- [ ] **Step 2: Add Facebook to the `platforms` array**

Find the closing brace of the YouTube entry in the `platforms` array (around line 69):
```js
  },
];
```

Replace with:
```js
  },
  {
    key: 'facebook',
    followerKey: 'facebookFollowers',
    label: 'Facebook',
    placeholder: 'Page name',
    hint: 'Facebook Page reach for your brand deals.',
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/10',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
];
```

- [ ] **Step 3: Add `facebook` and `facebookFollowers` to form state**

Find in `useState` initializer (around line 136):
```js
    youtube: '',
```

Replace with:
```js
    youtube: '',
    facebook: '',
```

Find:
```js
    youtubeFollowers: '',
```

Replace with:
```js
    youtubeFollowers: '',
    facebookFollowers: '',
```

- [ ] **Step 4: Pre-populate Facebook fields from existing profile**

Find in the `useEffect` profile loader (around line 204):
```js
          youtubeFollowers: profile.youtube_followers || '',
```

Replace with:
```js
          youtubeFollowers: profile.youtube_followers || '',
          facebookFollowers: profile.facebook_followers || '',
          facebook: profile.facebook_page || '',
```

- [ ] **Step 5: Save Facebook fields in `handleSave`**

Find in `handleSave` (around line 313):
```js
        youtube_followers: parseInt(form.youtubeFollowers) || 0,
```

Replace with:
```js
        youtube_followers: parseInt(form.youtubeFollowers) || 0,
        facebook_page:      form.facebook || null,
        facebook_followers: parseInt(form.facebookFollowers) || 0,
```

- [ ] **Step 6: Add "Connect Facebook/Instagram" buttons to Instagram and Facebook rows**

Find the block that renders the TikTok connect button (around line 708):
```jsx
                    {p.key === 'tiktok' && (
                      <button
                        type="button"
                        onClick={async () => {
                          const redirectUri = `${window.location.origin}/auth/tiktok`;
                          window.location.href = await getTikTokAuthUrl(redirectUri);
                        }}
                        className="mt-1.5 flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        ↻ Connect TikTok to sync
                      </button>
                    )}
```

Replace with:
```jsx
                    {p.key === 'tiktok' && (
                      <button
                        type="button"
                        onClick={async () => {
                          const redirectUri = `${window.location.origin}/auth/tiktok`;
                          window.location.href = await getTikTokAuthUrl(redirectUri);
                        }}
                        className="mt-1.5 flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        ↻ Connect TikTok to sync
                      </button>
                    )}
                    {(p.key === 'instagram' || p.key === 'facebook') && (
                      <button
                        type="button"
                        onClick={() => {
                          const redirectUri = `${window.location.origin}/auth/facebook`;
                          window.location.href = getFacebookAuthUrl(redirectUri);
                        }}
                        className="mt-1.5 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        ↻ Connect Facebook/Instagram to sync
                      </button>
                    )}
```

- [ ] **Step 7: Verify build**

```bash
cd ogisback
npm run build 2>&1 | tail -5
```

Expected: build succeeds with no errors.

- [ ] **Step 8: Commit**

```bash
git add src/pages/creator/ProfileEdit.jsx
git commit -m "feat: add Facebook platform row and connect buttons to ProfileEdit"
```

---

## Task 8: End-to-End Verification

- [ ] **Step 1: Start dev server**

```bash
cd ogisback
npm run dev
```

- [ ] **Step 2: Test Facebook OAuth flow**

1. Log in as a creator
2. Go to `/creator/profile/edit`
3. Scroll to Social Platforms → Instagram row
4. Click "Connect Facebook/Instagram to sync"
5. Expected: redirected to `https://www.facebook.com/v19.0/dialog/oauth?...`
6. Log in with a Facebook account that has a Page linked to an Instagram Business account
7. Expected: redirected to `http://localhost:5173/auth/facebook?code=...`
8. Expected: spinner shows "Connecting Facebook…"
9. Expected: toast success shows follower counts
10. Expected: redirected back to `/creator/profile/edit` with Instagram handle + followers auto-filled, Facebook page + followers auto-filled

- [ ] **Step 3: Test with no linked Instagram Business account**

Repeat with a Facebook account that has a Page but NO linked Instagram Business account.
Expected: Facebook followers synced, Instagram fields unchanged, toast says "Connected! X Facebook followers synced."

- [ ] **Step 4: Test state mismatch (security check)**

Manually visit `/auth/facebook?code=fakecode&state=wrongstate` in the browser.
Expected: toast error "Invalid Facebook callback", redirect to `/creator/profile/edit`.

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: Facebook + Instagram OAuth auto-sync complete"
git push
```

---

## Setup Checklist for Going Live

Before testing end-to-end, confirm:

| Item | Status |
|------|--------|
| Migration 018 run in Supabase SQL Editor | ☐ |
| Facebook Developer App created | ☐ |
| Redirect URI `http://localhost:5173/auth/facebook` added in Facebook Login settings | ☐ |
| `VITE_FACEBOOK_APP_ID` added to `ogisback/.env` | ☐ |
| `FACEBOOK_APP_ID` secret set via `npx supabase secrets set` | ☐ |
| `FACEBOOK_APP_SECRET` secret set via `npx supabase secrets set` | ☐ |
| `facebook-auth` edge function deployed | ☐ |

> **Note on Instagram Graph API limitation:** The Instagram follower count only syncs if the creator's Instagram account is a **Business** or **Creator** account linked to a Facebook Page in their Facebook Business Suite. Personal Instagram accounts cannot be accessed via the Graph API — this is a Meta restriction, not a code issue. If Instagram fields don't populate, advise the creator to switch their Instagram to a Professional account and link it to a Facebook Page.
