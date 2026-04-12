-- ═══════════════════════════════════════════════════════════════
-- Migration 010: Add online status columns to profiles
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Add is_online and last_seen to profiles (base table used by all roles)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_online  BOOLEAN    DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_seen  TIMESTAMPTZ DEFAULT NOW();

-- Fix the existing user who signed in via Google but got role='creator'
-- This updates halimoladimeji9@gmail.com → role='brand' and creates brand_profile
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the user id from auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'halimoladimeji9@gmail.com'
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Update profile role to brand
    UPDATE profiles SET role = 'brand' WHERE id = v_user_id;

    -- Remove wrong creator_profile if it exists with no real data
    DELETE FROM creator_profiles WHERE id = v_user_id AND completed_orders = 0 AND wallet_balance = 0;

    -- Ensure brand_profile exists
    INSERT INTO brand_profiles (id, slug, name)
    VALUES (
      v_user_id,
      'halimoladimeji' || floor(random() * 9000 + 1000)::int,
      'Halim'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Enable realtime on key tables (run these if not already enabled)
-- Note: realtime is enabled via Supabase dashboard or these alter publication statements
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
