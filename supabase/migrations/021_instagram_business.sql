-- Migration 021: Store Instagram Business Account credentials for Insights API
ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS instagram_business_id TEXT,
  ADD COLUMN IF NOT EXISTS instagram_page_token  TEXT;
