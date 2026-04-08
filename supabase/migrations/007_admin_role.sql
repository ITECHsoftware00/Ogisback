-- Add admin role support
-- Run this in Supabase SQL Editor after 006_storage_buckets.sql

-- Allow 'admin' as a valid role in profiles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('creator', 'brand', 'admin'));

-- Admin bypass RLS policies (admin can read everything)
DROP POLICY IF EXISTS "Admin read all profiles"      ON profiles;
DROP POLICY IF EXISTS "Admin read all creators"      ON creator_profiles;
DROP POLICY IF EXISTS "Admin read all brands"        ON brand_profiles;
DROP POLICY IF EXISTS "Admin read all campaigns"     ON campaigns;
DROP POLICY IF EXISTS "Admin read all orders"        ON orders;
DROP POLICY IF EXISTS "Admin read all escrow"        ON escrow;
DROP POLICY IF EXISTS "Admin read all withdrawals"   ON withdrawals;
DROP POLICY IF EXISTS "Admin read all transactions"  ON wallet_transactions;
DROP POLICY IF EXISTS "Admin read all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admin read all conversations" ON conversations;
DROP POLICY IF EXISTS "Admin read all applications"  ON campaign_applications;
DROP POLICY IF EXISTS "Admin update profiles"        ON profiles;
DROP POLICY IF EXISTS "Admin update creators"        ON creator_profiles;
DROP POLICY IF EXISTS "Admin update withdrawals"     ON withdrawals;
DROP POLICY IF EXISTS "Admin update orders"          ON orders;

CREATE POLICY "Admin read all profiles"        ON profiles             FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admin read all creators"        ON creator_profiles     FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admin read all brands"          ON brand_profiles       FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admin read all campaigns"       ON campaigns            FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admin read all orders"          ON orders               FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admin read all escrow"          ON escrow               FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admin read all withdrawals"     ON withdrawals          FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admin read all transactions"    ON wallet_transactions  FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admin read all subscriptions"   ON subscriptions        FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admin read all conversations"   ON conversations        FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admin read all applications"    ON campaign_applications FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Admin write policies
CREATE POLICY "Admin update profiles"          ON profiles             FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admin update creators"          ON creator_profiles     FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admin update withdrawals"       ON withdrawals          FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Admin update orders"            ON orders               FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Promote a user to admin (run manually after creating the account):
-- UPDATE profiles SET role = 'admin' WHERE id = '<your-admin-user-uuid>';
