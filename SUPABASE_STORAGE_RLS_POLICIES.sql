-- ============================================
-- SUPABASE STORAGE RLS POLICIES
-- ============================================
-- Run this SQL in Supabase SQL Editor
-- Make sure RLS is enabled on all buckets first!
-- ============================================

-- ============================================
-- OPERATOR DOCUMENTS BUCKET POLICIES
-- ============================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Operators can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Operators can read own files" ON storage.objects;
DROP POLICY IF EXISTS "Operators can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read all operator documents" ON storage.objects;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Operators can upload to own folder" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'operator_documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to read their own files
CREATE POLICY "Operators can read own files" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'operator_documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to delete their own files
CREATE POLICY "Operators can delete own files" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'operator_documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Note: Admin access policy removed since 'admin' role doesn't exist in user_role enum
-- If you need admin functionality later, add 'admin' to the user_role enum first

-- ============================================
-- VEHICLE PHOTOS BUCKET POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload vehicle photos to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own vehicle photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read vehicle photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own vehicle photos" ON storage.objects;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload vehicle photos to own folder" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'vehicle_photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to read their own vehicle photos
CREATE POLICY "Users can read own vehicle photos" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'vehicle_photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read access (since bucket is public)
CREATE POLICY "Public can read vehicle photos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'vehicle_photos');

-- Allow authenticated users to delete their own vehicle photos
CREATE POLICY "Users can delete own vehicle photos" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'vehicle_photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================
-- PROFILE PHOTOS BUCKET POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload profile photos to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Public can read profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile photos" ON storage.objects;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload profile photos to own folder" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile_photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read access (since bucket is public)
CREATE POLICY "Public can read profile photos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'profile_photos');

-- Allow authenticated users to update their own profile photos (upsert)
CREATE POLICY "Users can update own profile photos" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile_photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to delete their own profile photos
CREATE POLICY "Users can delete own profile photos" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile_photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

