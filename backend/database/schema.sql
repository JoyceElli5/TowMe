-- TowMe Database Schema
-- Run this SQL in your Supabase SQL Editor to create all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types (enums)
CREATE TYPE user_role AS ENUM ('vehicle_owner', 'tow_operator');
CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');
CREATE TYPE vehicle_type AS ENUM ('car', 'suv', 'saloon', 'van', 'truck', 'motorcycle', 'others');
CREATE TYPE vehicle_condition AS ENUM ('good', 'damaged', 'needs_attention');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE notification_type AS ENUM ('request', 'status_update', 'rating', 'payment');

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role user_role NOT NULL,
  avatar_url TEXT,
  average_rating DECIMAL(2,1) DEFAULT 0,
  total_trips INTEGER DEFAULT 0,
  is_online BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Towing requests table
CREATE TABLE IF NOT EXISTS towing_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  pickup_address TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  pickup_lat DECIMAL(10, 8) NOT NULL,
  pickup_lng DECIMAL(11, 8) NOT NULL,
  destination_lat DECIMAL(10, 8) NOT NULL,
  destination_lng DECIMAL(11, 8) NOT NULL,
  vehicle_type vehicle_type NOT NULL,
  estimated_price DECIMAL(10, 2) NOT NULL,
  final_price DECIMAL(10, 2),
  distance_km DECIMAL(10, 2) NOT NULL,
  status request_status DEFAULT 'pending',
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES towing_requests(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(request_id, from_user_id, to_user_id)
);

-- Inspections table
CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID UNIQUE NOT NULL REFERENCES towing_requests(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photos TEXT[] NOT NULL,
  vehicle_condition vehicle_condition NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Operator locations table (for real-time tracking)
CREATE TABLE IF NOT EXISTS operator_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id UUID REFERENCES towing_requests(id) ON DELETE SET NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  heading DECIMAL(5, 2),
  speed DECIMAL(5, 2),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID UNIQUE NOT NULL REFERENCES towing_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status payment_status DEFAULT 'pending',
  payment_method TEXT NOT NULL,
  transaction_reference TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_online ON users(is_online);

CREATE INDEX IF NOT EXISTS idx_requests_user_id ON towing_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_operator_id ON towing_requests(operator_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON towing_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON towing_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_ratings_request_id ON ratings(request_id);
CREATE INDEX IF NOT EXISTS idx_ratings_to_user_id ON ratings(to_user_id);

CREATE INDEX IF NOT EXISTS idx_operator_locations_operator_id ON operator_locations(operator_id);
CREATE INDEX IF NOT EXISTS idx_operator_locations_timestamp ON operator_locations(timestamp);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_payments_request_id ON payments(request_id);
CREATE INDEX IF NOT EXISTS idx_payments_operator_id ON payments(operator_id);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE towing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Towing requests policies
CREATE POLICY "Users can view their own requests" ON towing_requests
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = operator_id);

CREATE POLICY "Users can create requests" ON towing_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Operators can view pending requests" ON towing_requests
  FOR SELECT USING (status = 'pending');

CREATE POLICY "Participants can update requests" ON towing_requests
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = operator_id);

-- Ratings policies
CREATE POLICY "Anyone can view ratings" ON ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can create ratings" ON ratings
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Inspections policies
CREATE POLICY "Participants can view inspections" ON inspections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM towing_requests 
      WHERE towing_requests.id = inspections.request_id 
      AND (towing_requests.user_id = auth.uid() OR towing_requests.operator_id = auth.uid())
    )
  );

CREATE POLICY "Operators can create inspections" ON inspections
  FOR INSERT WITH CHECK (auth.uid() = operator_id);

-- Operator locations policies
CREATE POLICY "Users can view operator location for their request" ON operator_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM towing_requests 
      WHERE towing_requests.id = operator_locations.request_id 
      AND towing_requests.user_id = auth.uid()
    )
  );

CREATE POLICY "Operators can update their location" ON operator_locations
  FOR INSERT WITH CHECK (auth.uid() = operator_id);

CREATE POLICY "Operators can update their location data" ON operator_locations
  FOR UPDATE USING (auth.uid() = operator_id);

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Participants can view payments" ON payments
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = operator_id);

CREATE POLICY "Users can create payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_towing_requests_updated_at
  BEFORE UPDATE ON towing_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE towing_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE operator_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Grant permissions to authenticated users
GRANT ALL ON users TO authenticated;
GRANT ALL ON towing_requests TO authenticated;
GRANT ALL ON ratings TO authenticated;
GRANT ALL ON inspections TO authenticated;
GRANT ALL ON operator_locations TO authenticated;
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON payments TO authenticated;

-- Grant permissions to service role for admin operations
GRANT ALL ON users TO service_role;
GRANT ALL ON towing_requests TO service_role;
GRANT ALL ON ratings TO service_role;
GRANT ALL ON inspections TO service_role;
GRANT ALL ON operator_locations TO service_role;
GRANT ALL ON notifications TO service_role;
GRANT ALL ON payments TO service_role;
