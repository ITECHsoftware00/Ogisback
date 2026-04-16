-- Migration 017: Add demographic and map location fields to creator_profiles

ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS age        INTEGER      CHECK (age >= 13 AND age <= 100),
  ADD COLUMN IF NOT EXISTS gender     TEXT         CHECK (gender IN ('male','female','non_binary','prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS latitude   NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS longitude  NUMERIC(10,7);

-- Existing RLS UPDATE policy on creator_profiles already allows creators
-- to update their own row, so no new policy is needed.
