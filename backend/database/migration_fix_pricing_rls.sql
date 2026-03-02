-- Fix RLS policy for vehicle_pricing
-- The previous policy used auth.role() = 'authenticated' which is incorrect
-- This should check if the user is authenticated using auth.uid() IS NOT NULL

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Authenticated users can read pricing" ON vehicle_pricing;

-- Create the correct policy
CREATE POLICY "Authenticated users can read pricing" ON vehicle_pricing
  FOR SELECT USING (auth.uid() IS NOT NULL);

