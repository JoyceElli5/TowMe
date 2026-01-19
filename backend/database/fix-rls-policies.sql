-- Fix RLS Policies for Service Role
-- Run this SQL in your Supabase SQL Editor to fix the 401 errors
-- This allows the backend (using service_role key) to bypass RLS

-- Users table
CREATE POLICY IF NOT EXISTS "Service role can manage users" ON users
  FOR ALL USING (auth.role() = 'service_role');

-- Towing requests table
CREATE POLICY IF NOT EXISTS "Service role can manage requests" ON towing_requests
  FOR ALL USING (auth.role() = 'service_role');

-- Ratings table
CREATE POLICY IF NOT EXISTS "Service role can manage ratings" ON ratings
  FOR ALL USING (auth.role() = 'service_role');

-- Inspections table
CREATE POLICY IF NOT EXISTS "Service role can manage inspections" ON inspections
  FOR ALL USING (auth.role() = 'service_role');

-- Operator locations table
CREATE POLICY IF NOT EXISTS "Service role can manage operator locations" ON operator_locations
  FOR ALL USING (auth.role() = 'service_role');

-- Notifications table
CREATE POLICY IF NOT EXISTS "Service role can manage notifications" ON notifications
  FOR ALL USING (auth.role() = 'service_role');

-- Payments table
CREATE POLICY IF NOT EXISTS "Service role can manage payments" ON payments
  FOR ALL USING (auth.role() = 'service_role');

-- Email verification tokens table
CREATE POLICY IF NOT EXISTS "Service role can manage email verification tokens" ON email_verification_tokens
  FOR ALL USING (auth.role() = 'service_role');

-- Password reset tokens table
CREATE POLICY IF NOT EXISTS "Service role can manage password reset tokens" ON password_reset_tokens
  FOR ALL USING (auth.role() = 'service_role');
