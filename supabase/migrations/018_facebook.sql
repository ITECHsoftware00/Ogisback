-- Migration 018: Add Facebook page fields to creator_profiles

ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS facebook_page      TEXT,
  ADD COLUMN IF NOT EXISTS facebook_followers INTEGER DEFAULT 0;
