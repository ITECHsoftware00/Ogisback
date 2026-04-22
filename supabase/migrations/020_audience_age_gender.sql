-- Add audience age/gender breakdown column to creator_profiles
ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS audience_age_gender JSONB DEFAULT '[]'::jsonb;
