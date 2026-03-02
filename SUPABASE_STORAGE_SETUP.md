# Supabase Storage Buckets Setup Guide

## 📦 **Required Storage Buckets**

Your application requires **3 storage buckets** to be created in Supabase:

1. **`operator_documents`** - For operator verification documents (Ghana card, driver's license, etc.)
2. **`vehicle_photos`** - For vehicle photos uploaded by users
3. **`profile_photos`** - For user profile avatars

---

## 🚀 **Step-by-Step Setup Instructions**

### **1. Create Storage Buckets**

Go to your Supabase Dashboard → **Storage** → **New bucket**

#### **Bucket 1: `operator_documents`**
- **Name:** `operator_documents`
- **Public:** ❌ **No** (Private bucket - sensitive documents)
- **File size limit:** 10MB
- **Allowed MIME types:** `image/jpeg, image/png, image/jpg`

#### **Bucket 2: `vehicle_photos`**
- **Name:** `vehicle_photos`
- **Public:** ✅ **Yes** (Public bucket - photos need to be accessible)
- **File size limit:** 5MB
- **Allowed MIME types:** `image/jpeg, image/png, image/jpg`

#### **Bucket 3: `profile_photos`**
- **Name:** `profile_photos`
- **Public:** ✅ **Yes** (Public bucket - profile photos need to be accessible)
- **File size limit:** 5MB
- **Allowed MIME types:** `image/jpeg, image/png, image/jpg`

---

## 🔒 **2. Set Up Row Level Security (RLS) Policies**

After creating the buckets, you need to set up RLS policies. Go to **Storage** → Select each bucket → **Policies** tab.

### **For `operator_documents` bucket:**

**IMPORTANT:** Make sure RLS is enabled on the bucket first:
1. Go to Storage → `operator_documents` bucket → Settings
2. Enable "RLS enabled" toggle

Then run this SQL in Supabase SQL Editor:

```sql
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
-- The user_role enum only has: 'vehicle_owner' and 'tow_operator'
-- If you need admin functionality, first add 'admin' to the user_role enum
```

### **For `vehicle_photos` bucket:**

**IMPORTANT:** Make sure RLS is enabled on the bucket first:
1. Go to Storage → `vehicle_photos` bucket → Settings
2. Enable "RLS enabled" toggle

Then run this SQL in Supabase SQL Editor:

```sql
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
```

### **For `profile_photos` bucket:**

**IMPORTANT:** Make sure RLS is enabled on the bucket first:
1. Go to Storage → `profile_photos` bucket → Settings
2. Enable "RLS enabled" toggle

Then run this SQL in Supabase SQL Editor:

```sql
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
```

---

## ✅ **Verification Checklist**

After setup, verify:

- [ ] All 3 buckets created in Supabase Storage
- [ ] `operator_documents` is **Private**
- [ ] `vehicle_photos` is **Public**
- [ ] `profile_photos` is **Public**
- [ ] RLS policies applied to all buckets
- [ ] Test upload from the app

---

## 🧪 **Testing**

1. **Test Operator Document Upload:**
   - Go to Profile Setup screen
   - Try uploading a Ghana card photo
   - Should upload successfully without "Bucket not found" error

2. **Test Vehicle Photo Upload:**
   - Go to Add/Edit Vehicle screen
   - Try uploading a vehicle photo
   - Should upload successfully

3. **Test Profile Photo Upload:**
   - Go to Profile screen
   - Try uploading a profile photo
   - Should upload successfully

---

## 📝 **Notes**

- **Private buckets** (`operator_documents`) require authentication to access
- **Public buckets** (`vehicle_photos`, `profile_photos`) can be accessed via public URLs
- File paths follow pattern: `{userId}/{filename}`
- RLS policies ensure users can only access their own files

---

## 🔧 **Troubleshooting**

### **Error: "new row violates row-level security policy"**

This error means the RLS policies are blocking the upload. Follow these steps:

1. **Enable RLS on the bucket:**
   - Go to Supabase Dashboard → **Storage** → Select bucket (e.g., `operator_documents`)
   - Click **Settings** tab
   - Toggle **"RLS enabled"** to **ON** ✅
   - Repeat for all 3 buckets

2. **Run the SQL policies:**
   - Open **SQL Editor** in Supabase Dashboard
   - Copy and paste the entire SQL from `SUPABASE_STORAGE_RLS_POLICIES.sql`
   - Click **Run** to execute all policies
   - Verify policies were created (check Storage → Bucket → Policies tab)

3. **Verify user is authenticated:**
   - Make sure the user is logged in
   - Check that `auth.uid()` returns a valid user ID
   - The file path must be `{userId}/{filename}` where `userId` matches the logged-in user

4. **Check policy syntax:**
   - All policies must include `TO authenticated`
   - The `WITH CHECK` clause is required for INSERT policies
   - The `USING` clause is required for SELECT/DELETE policies

### **Error: "Bucket not found"**

1. **Check bucket names** - Must match exactly:
   - `operator_documents` (not `operator-documents` or `operatorDocuments`)
   - `vehicle_photos` (not `vehicle-photos` or `vehiclePhotos`)
   - `profile_photos` (not `profile-photos` or `profilePhotos`)

2. **Check bucket visibility:**
   - `operator_documents` = Private
   - `vehicle_photos` = Public
   - `profile_photos` = Public

3. **Verify buckets exist:**
   - Go to Storage → Check all 3 buckets are listed
   - If missing, create them following Step 1 above

### **Quick Fix Checklist**

If uploads are still failing:

- [ ] RLS enabled on all buckets (Settings → "RLS enabled" = ON)
- [ ] SQL policies executed successfully (check for errors in SQL Editor)
- [ ] User is logged in (check `auth.uid()` is not null)
- [ ] File path format is correct (`{userId}/{filename}`)
- [ ] Bucket names match exactly (case-sensitive)
- [ ] User has proper authentication session

