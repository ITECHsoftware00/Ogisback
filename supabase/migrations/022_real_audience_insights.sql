-- Migration 022: Real audience insights via platform OAuth
--
-- Adds per-platform audience columns so we can persist results from
-- Instagram Graph Insights API, YouTube Analytics API, and TikTok sampling.
-- Each platform gets its own cities/countries, age/gender, and last_sync timestamp
-- so the UI can render real demographics and show freshness.

ALTER TABLE creator_profiles
  -- Instagram insights (via Facebook Business OAuth + Graph API v19)
  ADD COLUMN IF NOT EXISTS instagram_audience_cities      JSONB       DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS instagram_audience_countries   JSONB       DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS instagram_audience_age_gender  JSONB       DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS instagram_audience_last_sync   TIMESTAMPTZ,

  -- YouTube Analytics (via Google OAuth with yt-analytics.readonly scope)
  ADD COLUMN IF NOT EXISTS youtube_refresh_token          TEXT,
  ADD COLUMN IF NOT EXISTS youtube_audience_countries     JSONB       DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS youtube_audience_age_gender    JSONB       DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS youtube_audience_last_sync     TIMESTAMPTZ,

  -- TikTok sampling freshness (audience_locations already exists from 008)
  ADD COLUMN IF NOT EXISTS tiktok_audience_last_sync      TIMESTAMPTZ;
