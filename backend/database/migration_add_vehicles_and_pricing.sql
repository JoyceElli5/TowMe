-- Migration: Add user_vehicles and vehicle_pricing tables
-- Run this SQL in your Supabase SQL Editor
-- Date: 2026-01-19

-- ============================================================================
-- 1. USER_VEHICLES TABLE
-- ============================================================================
-- Stores vehicle information for each user
CREATE TABLE IF NOT EXISTS user_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type vehicle_type NOT NULL,
  make TEXT,
  model TEXT,
  color TEXT,
  plate_number TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user_vehicles
CREATE INDEX IF NOT EXISTS idx_user_vehicles_user_id ON user_vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vehicles_vehicle_type ON user_vehicles(vehicle_type);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_user_vehicles_updated_at
  BEFORE UPDATE ON user_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. VEHICLE_PRICING TABLE
-- ============================================================================
-- Stores dynamic pricing configuration for each vehicle type
-- This replaces hardcoded pricing constants
CREATE TABLE IF NOT EXISTS vehicle_pricing (
  vehicle_type vehicle_type PRIMARY KEY,
  base_fee DECIMAL(10, 2) NOT NULL,
  per_km_fee DECIMAL(10, 2) NOT NULL,
  min_fee DECIMAL(10, 2) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_vehicle_pricing_updated_at
  BEFORE UPDATE ON vehicle_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed initial pricing data (Ghana market values)
-- These can be edited in the database later - no hardcoding in app code
INSERT INTO vehicle_pricing (vehicle_type, base_fee, per_km_fee, min_fee) VALUES
  ('car', 30.00, 8.00, 60.00),
  ('saloon', 35.00, 9.00, 70.00),
  ('suv', 50.00, 12.00, 100.00),
  ('van', 60.00, 14.00, 120.00),
  ('truck', 80.00, 18.00, 150.00),
  ('motorcycle', 20.00, 5.00, 40.00),
  ('others', 70.00, 16.00, 130.00)
ON CONFLICT (vehicle_type) DO UPDATE SET
  base_fee = EXCLUDED.base_fee,
  per_km_fee = EXCLUDED.per_km_fee,
  min_fee = EXCLUDED.min_fee,
  updated_at = NOW();

-- ============================================================================
-- 3. OPTIONAL: ENHANCE OPERATOR_LOCATIONS FOR MATCHING
-- ============================================================================
-- Add is_available flag for driver matching logic
ALTER TABLE operator_locations 
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT FALSE;

-- Add last_seen timestamp for filtering active drivers
ALTER TABLE operator_locations 
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Indexes for driver matching queries
CREATE INDEX IF NOT EXISTS idx_operator_locations_is_available ON operator_locations(is_available);
CREATE INDEX IF NOT EXISTS idx_operator_locations_last_seen ON operator_locations(last_seen);
-- Composite index for efficient querying (filter by is_available and last_seen in WHERE clause)
CREATE INDEX IF NOT EXISTS idx_operator_locations_available_last_seen ON operator_locations(is_available, last_seen);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE user_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_pricing ENABLE ROW LEVEL SECURITY;

-- User Vehicles Policies
-- Service role can manage all vehicles (for backend operations)
CREATE POLICY "Service role can manage user vehicles" ON user_vehicles
  FOR ALL USING (auth.role() = 'service_role');

-- Users can view their own vehicles
CREATE POLICY "Users can view their own vehicles" ON user_vehicles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own vehicles
CREATE POLICY "Users can create their own vehicles" ON user_vehicles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own vehicles
CREATE POLICY "Users can update their own vehicles" ON user_vehicles
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own vehicles
CREATE POLICY "Users can delete their own vehicles" ON user_vehicles
  FOR DELETE USING (auth.uid() = user_id);

-- Vehicle Pricing Policies
-- Service role can manage pricing (for admin operations)
CREATE POLICY "Service role can manage vehicle pricing" ON vehicle_pricing
  FOR ALL USING (auth.role() = 'service_role');

-- All authenticated users can read pricing (for price calculations)
CREATE POLICY "Authenticated users can read pricing" ON vehicle_pricing
  FOR SELECT USING (auth.role() = 'authenticated');

-- Note: Regular users cannot modify pricing (admin only via service role)

-- ============================================================================
-- 5. GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON user_vehicles TO authenticated;
GRANT SELECT ON vehicle_pricing TO authenticated;

-- Grant all permissions to service role (for backend/admin operations)
GRANT ALL ON user_vehicles TO service_role;
GRANT ALL ON vehicle_pricing TO service_role;

-- ============================================================================
-- 6. ENABLE REALTIME (Optional - for live updates)
-- ============================================================================
-- Uncomment if you want realtime updates for vehicle pricing changes
-- ALTER PUBLICATION supabase_realtime ADD TABLE vehicle_pricing;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Update pricing calculation functions to fetch from vehicle_pricing table
-- 2. Remove hardcoded pricing constants from client code
-- 3. Implement vehicle management UI using user_vehicles table
-- 4. Update driver matching logic to use operator_locations.is_available

