-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Enums
-- -----------------------------------------------------------------------------
CREATE TYPE public.user_role AS ENUM ('user', 'driver', 'admin');
CREATE TYPE public.vehicle_type AS ENUM ('car', 'suv', 'saloon', 'van');
CREATE TYPE public.request_status AS ENUM ('pending', 'matched', 'driver_enroute', 'towing', 'completed', 'cancelled');

-- -----------------------------------------------------------------------------
-- 2. Tables
-- -----------------------------------------------------------------------------

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT UNIQUE,
  role public.user_role DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  avatar_url TEXT
);

-- User Vehicles
CREATE TABLE public.user_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  vehicle_type public.vehicle_type NOT NULL,
  make TEXT,
  model TEXT,
  color TEXT,
  plate_number TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_user_vehicles_user_id ON public.user_vehicles(user_id);

-- Vehicle Pricing configuration
CREATE TABLE public.vehicle_pricing (
  vehicle_type public.vehicle_type PRIMARY KEY,
  base_fee NUMERIC NOT NULL,
  per_km_fee NUMERIC NOT NULL,
  min_fee NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tow Requests
CREATE TABLE public.tow_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION,
  pickup_address TEXT,
  dest_lat DOUBLE PRECISION,
  dest_lng DOUBLE PRECISION,
  dest_address TEXT,
  vehicle_type public.vehicle_type NOT NULL,
  estimated_distance_km NUMERIC,
  estimated_cost NUMERIC,
  status public.request_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tow_requests_user_id ON public.tow_requests(user_id);
CREATE INDEX idx_tow_requests_status ON public.tow_requests(status);
CREATE INDEX idx_tow_requests_created_at ON public.tow_requests(created_at);

-- Driver Status
CREATE TABLE public.driver_status (
  driver_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT FALSE,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  last_seen TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_driver_status_available ON public.driver_status(is_available);
CREATE INDEX idx_driver_status_last_seen ON public.driver_status(last_seen);

-- Assignments
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.tow_requests(id) ON DELETE CASCADE UNIQUE,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_assignments_driver_id ON public.assignments(driver_id);

-- Trip History
CREATE TABLE public.trip_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.tow_requests(id) ON DELETE CASCADE UNIQUE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  final_distance_km NUMERIC,
  final_cost NUMERIC,
  rating INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_trip_history_user_id ON public.trip_history(user_id);
CREATE INDEX idx_trip_history_created_at ON public.trip_history(created_at);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  body TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- -----------------------------------------------------------------------------
-- 3. Row Level Security (RLS)
-- -----------------------------------------------------------------------------

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: User can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
  
-- Allow users to view limited info of driver (implementation detail handled in app logic or specific RPC usually, but basic read needed if we join) 
-- For now, keep it strictly own profile pending specific needs.

-- User Vehicles: CRUD own
CREATE POLICY "Users can view own vehicles" ON public.user_vehicles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vehicles" ON public.user_vehicles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicles" ON public.user_vehicles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vehicles" ON public.user_vehicles
  FOR DELETE USING (auth.uid() = user_id);

-- Vehicle Pricing: Read only for authenticated
CREATE POLICY "Pricing is viewable by everyone" ON public.vehicle_pricing
  FOR SELECT USING (auth.role() = 'authenticated');

-- Tow Requests: CRUD own
CREATE POLICY "Users can view own requests" ON public.tow_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own requests" ON public.tow_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update own requests" ON public.tow_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- Driver Status: Users cannot read other drivers directly (handled via matching RPC)
-- Exception: Driver can manage their own status
CREATE POLICY "Drivers can view own status" ON public.driver_status
  FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "Drivers can update own status" ON public.driver_status
  FOR UPDATE USING (auth.uid() = driver_id);
CREATE POLICY "Drivers can insert own status" ON public.driver_status
  FOR INSERT WITH CHECK (auth.uid() = driver_id);

-- Assignments: 
-- Drivers can see assignments assigned to them.
-- Users can see assignments for their requests (need join or simpler policy)
CREATE POLICY "Users can view assignments for their requests" ON public.assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tow_requests tr
      WHERE tr.id = request_id AND tr.user_id = auth.uid()
    )
  );
  
CREATE POLICY "Drivers can view their assignments" ON public.assignments
  FOR SELECT USING (driver_id = auth.uid());

-- Trip History: Users can view own
CREATE POLICY "Users can view own history" ON public.trip_history
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Drivers can view own trip history" ON public.trip_history
  FOR SELECT USING (driver_id = auth.uid());

-- Notifications: User can view own
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 4. Seed Data
-- -----------------------------------------------------------------------------
INSERT INTO public.vehicle_pricing (vehicle_type, base_fee, per_km_fee, min_fee) VALUES
('car', 30, 8, 60),
('saloon', 35, 9, 70),
('suv', 50, 12, 100),
('van', 60, 14, 120)
ON CONFLICT (vehicle_type) DO UPDATE
SET base_fee = EXCLUDED.base_fee, 
    per_km_fee = EXCLUDED.per_km_fee,
    min_fee = EXCLUDED.min_fee;

-- -----------------------------------------------------------------------------
-- 5. Storage Buckets (Script for Supabase Storage)
-- -----------------------------------------------------------------------------
-- Note: This usually needs to be run in the Storage section, but we can define policy if the bucket exists.
-- Assumption: 'vehicle_photos' bucket is created manually or via client.
-- Policy example for 'vehicle_photos':
-- INSERT INTO storage.buckets (id, name, public) VALUES ('vehicle_photos', 'vehicle_photos', true);
-- CREATE POLICY "Give user access to own folder" ON storage.objects FOR ALL USING (bucket_id = 'vehicle_photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- -----------------------------------------------------------------------------
-- 6. RPC Functions
-- -----------------------------------------------------------------------------

-- Match Driver Function
CREATE OR REPLACE FUNCTION match_driver(request_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request public.tow_requests%ROWTYPE;
  v_driver_id UUID;
  v_driver_lat DOUBLE PRECISION;
  v_driver_lng DOUBLE PRECISION;
  v_distance DOUBLE PRECISION;
BEGIN
  -- Get Request
  SELECT * INTO v_request FROM public.tow_requests WHERE id = request_id;
  
  IF v_request.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Request not found');
  END IF;

  -- Find nearest available driver active in last 10 mins
  -- Simple Euclidean distance for approximation (or use specific geo extensions if enabled)
  SELECT 
    driver_id 
  INTO v_driver_id
  FROM public.driver_status
  WHERE is_available = true 
    AND last_seen > NOW() - INTERVAL '10 minutes'
  ORDER BY 
    ((current_lat - v_request.pickup_lat)^2 + (current_lng - v_request.pickup_lng)^2) ASC
  LIMIT 1;

  IF v_driver_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'No drivers available');
  END IF;

  -- Assign Driver
  INSERT INTO public.assignments (request_id, driver_id)
  VALUES (request_id, v_driver_id);

  -- Update Request Status
  UPDATE public.tow_requests
  SET status = 'matched'
  WHERE id = request_id;

  -- Create Notification for User
  -- (Trigger logic usually handles this, but simple approach here)
  
  RETURN jsonb_build_object(
    'success', true, 
    'driver_id', v_driver_id,
    'message', 'Driver matched successfully'
  );
END;
$$;
