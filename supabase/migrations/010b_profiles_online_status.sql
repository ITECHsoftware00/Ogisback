-- Add online status tracking columns to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_online  BOOLEAN     DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_seen  TIMESTAMPTZ DEFAULT NOW();
