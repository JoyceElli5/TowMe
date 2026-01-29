-- Migration: Add operator verification fields
-- Run this SQL in your Supabase SQL Editor
-- Date: 2026-01-19

-- ============================================================================
-- 1. ADD OPERATOR VERIFICATION FIELDS TO USERS TABLE
-- ============================================================================
-- Add fields for operator verification documents and profile completion

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS ghana_card_number TEXT,
ADD COLUMN IF NOT EXISTS ghana_card_photo_url TEXT,
ADD COLUMN IF NOT EXISTS drivers_license_number TEXT,
ADD COLUMN IF NOT EXISTS drivers_license_photo_url TEXT,
ADD COLUMN IF NOT EXISTS operator_photo_url TEXT,
ADD COLUMN IF NOT EXISTS vehicle_registration_number TEXT,
ADD COLUMN IF NOT EXISTS vehicle_registration_photo_url TEXT,
ADD COLUMN IF NOT EXISTS insurance_policy_number TEXT,
ADD COLUMN IF NOT EXISTS insurance_photo_url TEXT,
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'under_review', 'approved', 'rejected'));

-- Index for verification status
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);
CREATE INDEX IF NOT EXISTS idx_users_profile_completed ON users(profile_completed);

-- ============================================================================
-- 2. UPDATE RLS POLICIES
-- ============================================================================
-- Operators can update their own verification fields
CREATE POLICY "Operators can update own verification" ON users
  FOR UPDATE 
  USING (
    auth.uid() = id AND 
    role = 'tow_operator'
  )
  WITH CHECK (
    auth.uid() = id AND 
    role = 'tow_operator'
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- ✅ All implementation complete:
-- 1. ✅ Operator profile setup screen: client/app/screens/operator/profile-setup-screen.tsx
-- 2. ✅ Operator service for document uploads: 
--    - client/lib/services/operatorService.ts
--    - client/lib/services/operatorStorageService.ts
-- 3. ✅ Auth flow updated to redirect operators to profile setup if incomplete:
--    - client/app/screens/auth/otp-verify-screen.tsx
--    - client/app/index.tsx

