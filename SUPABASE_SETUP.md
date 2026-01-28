# TowMe Supabase Setup Guide

This guide will help you set up Supabase for the TowMe application (USER side).

## Prerequisites

- Supabase account ([sign up at supabase.com](https://supabase.com))
- Node.js 18+ installed
- Expo CLI installed (`npm install -g expo-cli`)

## 1. Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in project details:
   - **Name**: TowMe
   - **Database Password**: Choose a strong password (save it securely)
   - **Region**: Choose closest to Ghana (e.g., EU West - Ireland)
4. Click "Create new project" (takes ~2 minutes to provision)

## 2. Run Database Migration

1. In your Supabase project dashboard, navigate to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy the entire contents of `backend/database/supabase-migration.sql`
4. Paste into the SQL Editor
5. Click **Run** (bottom right)
6. Verify success - you should see "Success. No rows returned"

This migration creates:
- ✅ Enums (role, vehicle_type, request_status)
- ✅ Tables (profiles, user_vehicles, vehicle_pricing, tow_requests, driver_status, assignments, trip_history, notifications)
- ✅ Indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Seed data for vehicle pricing
- ✅ `match_driver` RPC function

## 3. Enable Phone Authentication (OTP)

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Phone** provider
3. Enable it
4. Configure SMS provider:
   - **Recommended**: Twilio
   - Follow Supabase's guide to set up Twilio credentials
   - Add your Twilio credentials to the Phone Auth settings
5. Configure phone number format:
   - For Ghana: `+233` prefix
   - Example: `+233241234567`

**Important Notes:**
- Twilio provides a free trial with $15 credit
- Each SMS costs ~$0.0075
- For development, you can use Twilio test credentials
- For production, upgrade to a paid Twilio account

## 4. Create Storage Bucket

1. In Supabase dashboard, go to **Storage** (left sidebar)
2. Click **Create a new bucket**
3. Set bucket name: `vehicle_photos`
4. Set to **Public** (so users can view photos)
5. Click **Create bucket**

### Set up Storage Policies

1. Click on the `vehicle_photos` bucket
2. Go to **Policies** tab
3. Create **INSERT** policy:
   - Name: `Users can upload to own folder`
   - Policy definition:
   ```sql
   (bucket_id = 'vehicle_photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
   ```
   - Target roles: `authenticated`
   
4. Create **SELECT** policy:
   - Name: `Public can view photos`
   - Policy definition:
   ```sql
   (bucket_id = 'vehicle_photos'::text)
   ```
   - Target roles: `public`

5. Create **DELETE** policy:
   - Name: `Users can delete own photos`
   - Policy definition:
   ```sql
   (bucket_id = 'vehicle_photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
   ```
   - Target roles: `authenticated`

## 5. Get API Keys

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGc...` (this is safe to expose in your app)
   - **service_role**: `eyJhbGc...` (⚠️ NEVER expose this in client code)

## 6. Configure Expo App

1. In the `client` directory, create `.env` file:

```env
# Supabase Configuration (Client-side - SAFE to expose)
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Backend API URL (if you still have backend running)
EXPO_PUBLIC_API_URL=http://localhost:3001/api
```

2. Replace `YOUR_PROJECT_ID` with your actual project ID
3. Replace `your_anon_key_here` with your actual anon key

**Important**: Only use `EXPO_PUBLIC_` prefix for environment variables in Expo. These are accessible in your React Native code but safe to expose (unlike service_role key).

## 7. Test Database Setup

Run these queries in the SQL Editor to verify your setup:

### Check Tables Created
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see: assignments, driver_status, notifications, profiles, tow_requests, trip_history, user_vehicles, vehicle_pricing

### Check Vehicle Pricing Data
```sql
SELECT * FROM vehicle_pricing;
```

You should see 4 rows with pricing for: car, saloon, suv, van

### Check RLS Policies
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

You should see multiple policies for each table.

## 8. Enable Realtime

1. In Supabase dashboard, go to **Database** → **Replication**
2. Find tables: `tow_requests` and `notifications`
3. Enable realtime for both tables (toggle switch on the right)

## 9. Test OTP Authentication Flow

1. Start your Expo app:
   ```bash
   cd client
   npm start
   ```

2. Navigate to Phone Login screen
3. Enter a test phone number (format: +233241234567)
4. Check your phone for OTP code
5. Enter code to verify

**Troubleshooting**:
- If SMS doesn't arrive, check Twilio logs in your Twilio dashboard
- Ensure phone number is in international format (+233...)
- Check Supabase Auth logs: **Authentication** → **Users** → **Logs**

## 10. Verify Database Functions

Test the `match_driver` function:

```sql
-- This should return an error (no available drivers yet)
SELECT match_driver('00000000-0000-0000-0000-000000000000');
```

Expected result: `{"success": false, "error": "Request not found or not in pending status"}`

## Database Schema Overview

### Core Tables

#### `profiles`
Extends Supabase auth.users with additional user information.
```
id (uuid) → auth.users.id
full_name (text)
phone (text, unique)
role (enum: 'user' | 'driver')
created_at, updated_at
```

#### `user_vehicles`
Stores user vehicle information with photos.
```
id (uuid)
user_id (uuid) → profiles.id
vehicle_type (enum: 'car' | 'suv' | 'saloon' | 'van')
make, model, color, plate_number (text)
photo_url (text)
created_at, updated_at
```

#### `vehicle_pricing`
Configurable pricing per vehicle type.
```
vehicle_type (enum, primary key)
base_fee, per_km_fee, min_fee (numeric)
updated_at
```

#### `tow_requests`
Main table for towing service requests.
```
id (uuid)
user_id (uuid) → profiles.id
pickup_lat, pickup_lng (double precision)
pickup_address (text)
dest_lat, dest_lng (double precision)
dest_address (text)
vehicle_type (enum)
estimated_distance_km, estimated_cost (numeric)
status (enum: 'pending' | 'matched' | 'driver_enroute' | 'towing' | 'completed' | 'cancelled')
created_at, updated_at
```

#### `driver_status`
Tracks driver availability and location (for DRIVER side, coming later).
```
driver_id (uuid, primary key) → profiles.id
is_available (boolean)
current_lat, current_lng (double precision)
last_seen (timestamptz)
```

#### `assignments`
Links requests to drivers.
```
id (uuid)
request_id (uuid, unique) → tow_requests.id
driver_id (uuid) → profiles.id
assigned_at (timestamptz)
```

#### `trip_history`
Stores completed trip information.
```
id (uuid)
request_id (uuid, unique) → tow_requests.id
user_id (uuid) → profiles.id
driver_id (uuid, nullable) → profiles.id
final_distance_km, final_cost (numeric)
rating (int, 1-5)
created_at
```

#### `notifications`
Stores user notifications.
```
id (uuid)
user_id (uuid) → profiles.id
title, body (text)
is_read (boolean)
created_at
```

## Security & RLS

Row Level Security (RLS) is enabled on all tables to ensure users can only access their own data:

- **profiles**: Users can read/update only their own profile
- **user_vehicles**: Users can CRUD only their own vehicles
- **tow_requests**: Users can CRUD only their own requests
- **trip_history**: Users can read only their own trips
- **notifications**: Users can read/update only their own notifications
- **vehicle_pricing**: All authenticated users can read (no client writes)

## Pricing Formula

The app calculates estimated costs using:

```
estimated_cost = max(min_fee, base_fee + (distance_km * per_km_fee))
```

Example for SUV (50km trip):
- base_fee: GH₵50
- per_km_fee: GH₵12
- distance: 50km
- Calculation: max(100, 50 + (50 * 12)) = GH₵650

## Common Issues

### Issue: "Could not connect to Supabase"
**Solution**: Check your `.env` file has correct `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Issue: "Row Level Security policy violation"
**Solution**: Ensure RLS policies are correctly set up. Re-run the migration SQL if needed.

### Issue: "SMS not sending"
**Solution**: 
1. Check Twilio configuration in Supabase Auth settings
2. Verify phone number format (+233...)
3. Check Twilio balance/credits
4. Review Twilio logs

### Issue: "Cannot insert into table"
**Solution**: Check RLS policies allow INSERT. For testing, you can temporarily disable RLS:
```sql
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;
```
(Don't forget to re-enable after testing!)

### Issue: "Function match_driver not found"
**Solution**: Re-run the migration SQL. The function is defined at the end of the migration file.

## Next Steps

1. ✅ Complete setup following this guide
2. Test OTP authentication flow
3. Test creating a tow request
4. Test realtime updates
5. Add test drivers (DRIVER side implementation coming next)

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth with Phone](https://supabase.com/docs/guides/auth/phone-login)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## Support

For issues or questions:
1. Check Supabase logs: Dashboard → Logs
2. Review this guide carefully
3. Check GitHub Issues
4. Contact development team

---

**Built with ❤️ for Ghana 🇬🇭**
