# TowMe - Implementation Plan
## Functionalities to Implement (Filtered from Prompt)

---

## 📋 **CORE FUNCTIONALITIES TO IMPLEMENT**

### **1. DATABASE SCHEMA MIGRATION** ⚠️ **CRITICAL**
**Status:** Needs complete rebuild to match prompt requirements

**Current State:**
- Existing schema uses `users` table (separate from auth.users)
- Uses `towing_requests` with different structure
- No `vehicle_pricing`, `user_vehicles`, `driver_status`, `assignments`, `trip_history` tables
- Pricing is hardcoded in constants

**Required Changes:**
- Create new schema aligned with prompt:
  - `profiles` table (references `auth.users(id)`)
  - `user_vehicles` table (with photo_url)
  - `vehicle_pricing` table (editable pricing per vehicle type)
  - `tow_requests` table (renamed, different structure)
  - `driver_status` table (for driver availability tracking)
  - `assignments` table (links requests to drivers)
  - `trip_history` table (completed trips)
  - `notifications` table (already exists, verify structure)
- Update enums: `role`, `vehicle_type`, `request_status`
- Implement Row Level Security (RLS) policies
- Seed `vehicle_pricing` with Ghana values

**Deliverable:** SQL migration file with tables, enums, indexes, RLS policies, and seed data

---

### **2. AUTHENTICATION - PHONE OTP** 🔐
**Status:** Currently email/password only → Need phone OTP

**Current State:**
- Email/password auth via backend API
- Supabase client exists but not used for auth
- No phone OTP implementation

**Required Implementation:**
- **Screen:** `PhoneLoginScreen` (phone number input)
- **Screen:** `OTPVerifyScreen` (6-digit code input)
- Use `supabase.auth.signInWithOtp({ phone })`
- Use `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`
- Auto-create `profiles` row on first login:
  - `id` = `session.user.id`
  - `phone` from auth
  - `role` = 'user'
- Persist session and navigate to home

**Deliverable:** 
- `src/services/authService.ts` (phone OTP functions)
- `src/features/auth/PhoneLoginScreen.tsx`
- `src/features/auth/OTPVerifyScreen.tsx`
- Update navigation guards

---

### **3. SUPABASE STORAGE - VEHICLE PHOTOS** 📸
**Status:** Not implemented (TODO comment exists in profile.tsx)

**Current State:**
- Profile picture upload exists but uses placeholder URL
- No Supabase Storage bucket configured
- No vehicle photo upload functionality

**Required Implementation:**
- Create bucket: `vehicle_photos` in Supabase
- RLS policy: Users can upload only to `{userId}/{filename}.jpg`
- **Function:** `pickImage()` - Use `expo-image-picker`
- **Function:** `uploadVehiclePhoto(userId, fileUri)` → returns `photoUrl`
- Store public URL in `user_vehicles.photo_url`

**Deliverable:**
- `src/services/storageService.ts` (upload functions)
- Update vehicle service to use storage
- Bucket configuration & RLS policies

---

### **4. VEHICLE MANAGEMENT** 🚗
**Status:** Not implemented

**Current State:**
- No `user_vehicles` table
- Profile screen shows user info only
- No vehicle CRUD functionality

**Required Implementation:**
- **Service:** `src/services/vehicleService.ts`
  - `getUserVehicles(userId)` - List all vehicles
  - `createVehicle(userId, data)` - Add new vehicle
  - `updateVehicle(vehicleId, data)` - Edit vehicle
  - `deleteVehicle(vehicleId)` - Remove vehicle
  - `uploadVehiclePhoto(userId, fileUri)` - Upload photo
- **Screen:** Update `ProfileScreen` to show vehicle list
- **Screen:** `AddEditVehicleScreen` (form for vehicle details)
- Vehicle fields: `vehicle_type`, `make`, `model`, `color`, `plate_number`, `photo_url`

**Deliverable:**
- `src/services/vehicleService.ts`
- `src/features/vehicles/AddEditVehicleScreen.tsx`
- Update `ProfileScreen` with vehicle management UI

---

### **5. DYNAMIC PRICING FROM DATABASE** 💰
**Status:** Currently hardcoded → Need DB-driven pricing

**Current State:**
- Pricing in `client/constants/pricing.ts` (hardcoded multipliers)
- No `vehicle_pricing` table
- Price calculation uses hardcoded values

**Required Implementation:**
- **Service:** `src/services/pricingService.ts`
  - `getVehiclePricing()` - Fetch all pricing from `vehicle_pricing` table
  - Cache pricing in state (fetch once on app start)
- **Update:** `calculateEstimatedPrice()` function:
  - Formula: `max(min_fee, base_fee + per_km_fee * distance_km)`
  - Use pricing from DB instead of hardcoded values
- **Update:** `PriceEstimatorCard` to use dynamic pricing
- **Update:** `HomeScreen` to fetch and use pricing

**Deliverable:**
- `src/services/pricingService.ts`
- Update `calculateEstimatedPrice()` in `constants/pricing.ts` or move to service
- Update `HomeScreen` to fetch pricing on mount

---

### **6. REQUEST A TOW - ENHANCED FLOW** 🗺️
**Status:** Partially implemented → Needs location auto-detect & DB integration

**Current State:**
- Basic request creation exists
- Manual address input
- Uses hardcoded pricing
- No automatic location detection

**Required Implementation:**
- **Location Auto-Detection:**
  - Request location permission (`expo-location`)
  - `getCurrentPositionAsync()` on mount
  - Set pickup lat/lng automatically
  - Reverse geocode to address (`reverseGeocodeAsync`)
  - Fallback: "Lat,Lng" if geocoding fails
- **Destination:**
  - Keep manual input OR map press selection
  - Store lat/lng + address
- **Vehicle Types:**
  - Fetch from enum/constant (keep UI)
  - Pricing comes from DB (see #5)
- **Pricing Calculation:**
  - Fetch pricing from DB (cached)
  - Calculate distance using haversine
  - Formula: `max(min_fee, base_fee + per_km_fee * distance_km)`
  - Update in realtime when vehicle type or destination changes
- **Submit Request:**
  - Create `tow_requests` row with `status='pending'`
  - Call matching function (see #7)
  - Navigate to `RequestStatusScreen`

**Deliverable:**
- Update `src/features/home/RequestTowScreen.tsx` (or `HomeScreen`)
- `src/services/locationService.ts` (location helpers)
- `src/services/requestService.ts` (enhanced request creation)

---

### **7. AUTOMATIC DRIVER MATCHING** 🚛
**Status:** Currently manual accept → Need automatic matching

**Current State:**
- Operators manually accept requests
- No automatic matching
- No `driver_status` or `assignments` tables

**Required Implementation:**
- **Server-Side Function (Choose ONE):**
  - **Option A:** Supabase Edge Function `match_driver`
  - **Option B:** Postgres RPC function `match_driver(request_id uuid)`
- **Matching Logic:**
  - Find nearest `driver_status` where:
    - `is_available = true`
    - `last_seen` within last 2 minutes
  - Compute distance using SQL (haversine or simple math)
  - Pick nearest driver
  - Create `assignments` row
  - Update `tow_requests.status = 'matched'`
  - Create notification for user ("Driver assigned")
- **Client Integration:**
  - After creating `tow_request`, call `match_driver(request_id)`
  - Start realtime subscription (see #8)

**Deliverable:**
- `supabase/functions/match_driver/index.ts` (Edge Function) OR
- `backend/database/functions/match_driver.sql` (RPC)
- Update `requestService.ts` to call matching after request creation

---

### **8. REALTIME UPDATES** 🔄
**Status:** Not implemented

**Current State:**
- No realtime subscriptions
- Manual polling or refresh needed

**Required Implementation:**
- **Service:** `src/services/realtimeService.ts`
  - `subscribeToRequest(requestId)` - Listen to `tow_requests` changes
  - `subscribeToUserRequests(userId)` - Listen to all user requests
  - `subscribeToNotifications(userId)` - Listen to notifications
- **Update UI:**
  - `RequestStatusScreen` - Update when status changes:
    - `pending` → `matched` → `driver_enroute` → `towing` → `completed`
  - `HomeScreen` - Show active session updates
  - `NotificationsScreen` - Real-time notification updates

**Deliverable:**
- `src/services/realtimeService.ts`
- Update `RequestStatusScreen` with realtime subscription
- Update `HomeScreen` to listen for active request changes

---

### **9. TRIP HISTORY** 📜
**Status:** Partially exists → Needs proper `trip_history` table integration

**Current State:**
- `history.tsx` screen exists
- Queries `towing_requests` where `status='completed'`
- No `trip_history` table

**Required Implementation:**
- **Service:** `src/services/tripHistoryService.ts`
  - `getTripHistory(userId)` - Query `trip_history` table
  - Include driver details, final cost, rating
- **Update:** `history.tsx` to use `trip_history` table
- **Backend:** Create `trip_history` entry when trip completes:
  - Copy data from `tow_requests`
  - Include `final_distance_km`, `final_cost`, `rating`

**Deliverable:**
- `src/services/tripHistoryService.ts`
- Update `history.tsx` to use new service
- Backend logic to create `trip_history` on completion

---

### **10. NOTIFICATIONS SYSTEM** 🔔
**Status:** Table exists → Needs full implementation

**Current State:**
- `notifications` table exists in schema
- `messages.tsx` screen exists but may not be fully functional

**Required Implementation:**
- **Service:** `src/services/notificationService.ts`
  - `getNotifications(userId)` - Fetch user notifications
  - `markAsRead(notificationId)` - Mark notification as read
  - `markAllAsRead(userId)` - Mark all as read
- **Update:** `messages.tsx` to:
  - Fetch notifications from DB
  - Show unread count
  - Mark as read on view
- **Backend:** Create notifications for:
  - Driver assigned
  - Driver enroute
  - Trip started
  - Trip completed
  - Rating received

**Deliverable:**
- `src/services/notificationService.ts`
- Update `messages.tsx` with full functionality
- Backend notification creation logic

---

### **11. PROFILE SCREEN - VEHICLE MANAGEMENT** 👤
**Status:** Basic profile exists → Add vehicle management

**Current State:**
- Profile screen shows user info, settings, logout
- No vehicle list or management

**Required Implementation:**
- Add "My Vehicles" section to `ProfileScreen`
- Show list of `user_vehicles` for current user
- "Add Vehicle" button → Navigate to `AddEditVehicleScreen`
- Edit/Delete vehicle actions
- Display vehicle photo, type, make, model, plate number

**Deliverable:**
- Update `ProfileScreen` with vehicle management UI
- Integrate with `vehicleService`

---

## 📁 **FILE STRUCTURE TO CREATE**

```
client/
├── src/
│   ├── lib/
│   │   └── supabase.ts (already exists, verify)
│   ├── services/
│   │   ├── authService.ts (NEW - phone OTP)
│   │   ├── vehicleService.ts (NEW)
│   │   ├── pricingService.ts (NEW)
│   │   ├── requestService.ts (NEW - enhanced)
│   │   ├── locationService.ts (NEW)
│   │   ├── realtimeService.ts (NEW)
│   │   ├── tripHistoryService.ts (NEW)
│   │   ├── notificationService.ts (NEW)
│   │   └── storageService.ts (NEW)
│   ├── features/
│   │   ├── auth/
│   │   │   ├── PhoneLoginScreen.tsx (NEW)
│   │   │   └── OTPVerifyScreen.tsx (NEW)
│   │   ├── vehicles/
│   │   │   └── AddEditVehicleScreen.tsx (NEW)
│   │   └── requests/
│   │       └── RequestStatusScreen.tsx (UPDATE - add realtime)
│   └── models/
│       ├── Vehicle.ts (NEW - types)
│       ├── Pricing.ts (NEW - types)
│       └── Request.ts (NEW - types)
```

---

## 🎯 **IMPLEMENTATION PRIORITY ORDER**

1. **Database Schema Migration** (Foundation)
2. **Phone OTP Auth** (Core auth flow)
3. **Vehicle Management** (User can add vehicles)
4. **Dynamic Pricing** (Pricing from DB)
5. **Enhanced Request Flow** (Location + DB pricing)
6. **Driver Matching** (Automatic assignment)
7. **Realtime Updates** (Live status tracking)
8. **Trip History** (Completed trips)
9. **Notifications** (User alerts)
10. **Storage Integration** (Vehicle photos)

---

## ✅ **CHECKLIST SUMMARY**

- [ ] 1. Database schema migration (SQL + RLS)
- [ ] 2. Phone OTP authentication screens + service
- [ ] 3. Supabase Storage bucket + upload service
- [ ] 4. Vehicle CRUD service + screens
- [ ] 5. Pricing service (fetch from DB)
- [ ] 6. Enhanced request flow (location + pricing)
- [ ] 7. Driver matching function (server-side)
- [ ] 8. Realtime subscriptions service
- [ ] 9. Trip history service + screen update
- [ ] 10. Notifications service + screen update
- [ ] 11. Profile screen vehicle management UI

---

## 📝 **NOTES**

- **Remove ALL hardcoded data** - Everything must come from Supabase
- **Use Supabase JS client directly** - Not backend API for user-side features
- **Follow existing file structure** - Use `src/` organization if it exists, otherwise `client/`
- **Add loading/error/empty states** - All screens need proper state handling
- **RLS is critical** - Users can only access their own data

