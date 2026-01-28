-- TowMe Supabase Migration - USER Side Features
-- This migration converts the Express backend schema to Supabase-native with RLS
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Role enum: user (vehicle owner) or driver (tow operator)
DO $$ BEGIN
  CREATE TYPE role AS ENUM ('user', 'driver');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Vehicle types for towing
DO $$ BEGIN
  CREATE TYPE vehicle_type AS ENUM ('car', 'suv', 'saloon', 'van');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Request status workflow
DO $$ BEGIN
  CREATE TYPE request_status AS ENUM (
    'pending',           -- User created, awaiting driver match
    'matched',          -- Driver assigned
    'driver_enroute',   -- Driver heading to pickup
    'towing',           -- Vehicle being towed
    'completed',        -- Trip finished
    'cancelled'         -- Request cancelled
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Profiles table (extends auth.users)
-- This table stores additional user information beyond Supabase auth
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT UNIQUE,
  role role DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User vehicles table
-- Stores vehicle information for users (with photos)
CREATE TABLE IF NOT EXISTS user_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_type vehicle_type NOT NULL,
  make TEXT,
  model TEXT,
  color TEXT,
  plate_number TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicle pricing table
-- Stores pricing configuration per vehicle type
CREATE TABLE IF NOT EXISTS vehicle_pricing (
  vehicle_type vehicle_type PRIMARY KEY,
  base_fee NUMERIC NOT NULL,
  per_km_fee NUMERIC NOT NULL,
  min_fee NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tow requests table
-- Main table for towing service requests
CREATE TABLE IF NOT EXISTS tow_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pickup_lat DOUBLE PRECISION NOT NULL,
  pickup_lng DOUBLE PRECISION NOT NULL,
  pickup_address TEXT,
  dest_lat DOUBLE PRECISION NOT NULL,
  dest_lng DOUBLE PRECISION NOT NULL,
  dest_address TEXT,
  vehicle_type vehicle_type NOT NULL,
  estimated_distance_km NUMERIC,
  estimated_cost NUMERIC,
  status request_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Driver status table
-- Tracks driver availability and location
CREATE TABLE IF NOT EXISTS driver_status (
  driver_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT FALSE,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- Assignments table
-- Links requests to drivers
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES tow_requests(id) ON DELETE CASCADE UNIQUE,
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trip history table
-- Stores completed trip information
CREATE TABLE IF NOT EXISTS trip_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES tow_requests(id) ON DELETE CASCADE UNIQUE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  final_distance_km NUMERIC,
  final_cost NUMERIC,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
-- Stores user notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- User vehicles indexes
CREATE INDEX IF NOT EXISTS idx_user_vehicles_user_id ON user_vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vehicles_vehicle_type ON user_vehicles(vehicle_type);

-- Tow requests indexes
CREATE INDEX IF NOT EXISTS idx_tow_requests_user_id ON tow_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_tow_requests_status ON tow_requests(status);
CREATE INDEX IF NOT EXISTS idx_tow_requests_created_at ON tow_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_tow_requests_user_status ON tow_requests(user_id, status);

-- Driver status indexes
CREATE INDEX IF NOT EXISTS idx_driver_status_available ON driver_status(is_available, last_seen);

-- Assignments indexes
CREATE INDEX IF NOT EXISTS idx_assignments_driver_id ON assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_assignments_request_id ON assignments(request_id);

-- Trip history indexes
CREATE INDEX IF NOT EXISTS idx_trip_history_user_id ON trip_history(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_trip_history_request_id ON trip_history(request_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, is_read, created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE tow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User vehicles policies
-- Users can CRUD only their own vehicles
CREATE POLICY "Users can view own vehicles"
  ON user_vehicles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vehicles"
  ON user_vehicles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicles"
  ON user_vehicles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vehicles"
  ON user_vehicles FOR DELETE
  USING (auth.uid() = user_id);

-- Vehicle pricing policies
-- Everyone (authenticated) can read pricing
CREATE POLICY "Authenticated users can read pricing"
  ON vehicle_pricing FOR SELECT
  USING (auth.role() = 'authenticated');

-- Tow requests policies
-- Users can view their own requests
CREATE POLICY "Users can view own requests"
  ON tow_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create own requests"
  ON tow_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own requests
CREATE POLICY "Users can update own requests"
  ON tow_requests FOR UPDATE
  USING (auth.uid() = user_id);

-- Trip history policies
-- Users can read their own trip history
CREATE POLICY "Users can view own trip history"
  ON trip_history FOR SELECT
  USING (auth.uid() = user_id);

-- Notifications policies
-- Users can read their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Driver status policies (limited access for users)
-- Note: Users generally don't need direct access to driver_status
-- Access is controlled via service functions

-- Assignments policies (limited access for users)
-- Note: Users don't need direct access to assignments
-- Access is controlled via service functions

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_vehicles_updated_at
  BEFORE UPDATE ON user_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tow_requests_updated_at
  BEFORE UPDATE ON tow_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- REALTIME
-- ============================================================================

-- Enable realtime for tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE tow_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================================================
-- SEED DATA: Vehicle Pricing (Ghana values)
-- ============================================================================

INSERT INTO vehicle_pricing (vehicle_type, base_fee, per_km_fee, min_fee) VALUES
  ('car', 30, 8, 60),
  ('saloon', 35, 9, 70),
  ('suv', 50, 12, 100),
  ('van', 60, 14, 120)
ON CONFLICT (vehicle_type) DO UPDATE SET
  base_fee = EXCLUDED.base_fee,
  per_km_fee = EXCLUDED.per_km_fee,
  min_fee = EXCLUDED.min_fee,
  updated_at = NOW();

-- ============================================================================
-- MATCHING FUNCTION (Server-side)
-- ============================================================================

-- Function to match a tow request with the nearest available driver
CREATE OR REPLACE FUNCTION match_driver(request_id UUID)
RETURNS JSON AS $$
DECLARE
  request_record RECORD;
  nearest_driver RECORD;
  assignment_id UUID;
  result JSON;
BEGIN
  -- Get the request details
  SELECT * INTO request_record
  FROM tow_requests
  WHERE id = request_id AND status = 'pending';

  IF request_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Request not found or not in pending status'
    );
  END IF;

  -- Find nearest available driver using Haversine formula for accurate distance
  -- This provides better accuracy than simple Pythagorean distance
  SELECT 
    ds.driver_id,
    ds.current_lat,
    ds.current_lng,
    -- Haversine formula for distance in kilometers
    (
      6371 * acos(
        cos(radians(request_record.pickup_lat)) * 
        cos(radians(ds.current_lat)) * 
        cos(radians(ds.current_lng) - radians(request_record.pickup_lng)) + 
        sin(radians(request_record.pickup_lat)) * 
        sin(radians(ds.current_lat))
      )
    ) AS distance
  INTO nearest_driver
  FROM driver_status ds
  WHERE ds.is_available = true
    AND ds.last_seen > NOW() - INTERVAL '2 minutes'
    AND ds.current_lat IS NOT NULL
    AND ds.current_lng IS NOT NULL
  ORDER BY distance ASC
  LIMIT 1;

  IF nearest_driver IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No available drivers found nearby'
    );
  END IF;

  -- Create assignment
  INSERT INTO assignments (request_id, driver_id)
  VALUES (request_id, nearest_driver.driver_id)
  RETURNING id INTO assignment_id;

  -- Update request status
  UPDATE tow_requests
  SET status = 'matched', updated_at = NOW()
  WHERE id = request_id;

  -- Create notification for user
  INSERT INTO notifications (user_id, title, body)
  VALUES (
    request_record.user_id,
    'Driver Assigned',
    'A driver has been assigned to your tow request'
  );

  -- Return success with driver info
  RETURN json_build_object(
    'success', true,
    'driver_id', nearest_driver.driver_id,
    'assignment_id', assignment_id,
    'status', 'matched'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION match_driver(UUID) TO authenticated;

-- ============================================================================
-- STORAGE BUCKET SETUP (Run in Supabase Storage UI or via SQL)
-- ============================================================================

-- Note: Storage bucket creation is typically done via Supabase UI
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create bucket named: vehicle_photos
-- 3. Set to PUBLIC or add appropriate policies
-- 4. Add RLS policy for uploads (example below)

-- Storage policy example (adjust bucket name if needed):
-- Policy: Users can upload to their own folder
-- Path pattern: {user_id}/*
-- INSERT policy on storage.objects where:
-- bucket_id = 'vehicle_photos' AND (storage.foldername(name))[1] = auth.uid()::text

COMMENT ON TABLE profiles IS 'User profiles extending auth.users';
COMMENT ON TABLE user_vehicles IS 'User-owned vehicles with photos';
COMMENT ON TABLE vehicle_pricing IS 'Pricing configuration per vehicle type';
COMMENT ON TABLE tow_requests IS 'Towing service requests';
COMMENT ON TABLE driver_status IS 'Real-time driver availability and location';
COMMENT ON TABLE assignments IS 'Request-to-driver assignments';
COMMENT ON TABLE trip_history IS 'Completed trip records';
COMMENT ON TABLE notifications IS 'User notifications';
COMMENT ON FUNCTION match_driver IS 'Matches a pending request to nearest available driver';
