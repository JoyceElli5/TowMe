# TowMe - Incremental Implementation Plan
## Work with Existing Schema, Add Only What's Needed

---

## ✅ **WHAT WE CAN USE AS-IS**

### **Existing Tables (No Changes Needed):**
1. ✅ **`users`** - Use for profiles (just sync with Supabase auth.users)
2. ✅ **`towing_requests`** - Perfect! Has all fields we need
3. ✅ **`notifications`** - Already exists, just implement the service
4. ✅ **`operator_locations`** - Use for driver matching (instead of `driver_status`)
5. ✅ **`ratings`** - Already exists
6. ✅ **`payments`** - Already exists

---

## 🆕 **MINIMAL ADDITIONS NEEDED**

### **1. Add `user_vehicles` Table** (NEW - Required for vehicle management)
```sql
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

CREATE INDEX idx_user_vehicles_user_id ON user_vehicles(user_id);
```

### **2. Add `vehicle_pricing` Table** (NEW - Required for dynamic pricing)
```sql
CREATE TABLE IF NOT EXISTS vehicle_pricing (
  vehicle_type vehicle_type PRIMARY KEY,
  base_fee DECIMAL(10, 2) NOT NULL,
  per_km_fee DECIMAL(10, 2) NOT NULL,
  min_fee DECIMAL(10, 2) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed with Ghana values
INSERT INTO vehicle_pricing (vehicle_type, base_fee, per_km_fee, min_fee) VALUES
  ('car', 30, 8, 60),
  ('saloon', 35, 9, 70),
  ('suv', 50, 12, 100),
  ('van', 60, 14, 120),
  ('truck', 80, 18, 150),
  ('motorcycle', 20, 5, 40),
  ('others', 70, 16, 130)
ON CONFLICT (vehicle_type) DO NOTHING;
```

### **3. Optional: Add `last_seen` to `operator_locations`** (For matching logic)
```sql
ALTER TABLE operator_locations 
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_operator_locations_last_seen ON operator_locations(last_seen);
```

### **4. Optional: Add `assigned_at` to `towing_requests`** (If you want to track assignment time)
```sql
ALTER TABLE operator_locations 
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_operator_locations_is_available ON operator_locations(is_available);
```

---

## 📋 **IMPLEMENTATION ORDER (Incremental)**

### **Phase 1: Foundation (Minimal DB Changes)**
1. ✅ Add `user_vehicles` table
2. ✅ Add `vehicle_pricing` table + seed data
3. ✅ Add RLS policies for new tables

### **Phase 2: Phone OTP Auth**
4. ✅ Implement phone OTP login (use existing `users` table)
5. ✅ Sync `users` table with Supabase `auth.users` on first login

### **Phase 3: Vehicle Management**
6. ✅ Create `vehicleService.ts` (CRUD for `user_vehicles`)
7. ✅ Create `AddEditVehicleScreen.tsx`
8. ✅ Update `ProfileScreen` to show vehicle list

### **Phase 4: Dynamic Pricing**
9. ✅ Create `pricingService.ts` (fetch from `vehicle_pricing`)
10. ✅ Update price calculation to use DB pricing
11. ✅ Update `HomeScreen` to fetch pricing on mount

### **Phase 5: Enhanced Request Flow**
12. ✅ Add location auto-detection (`expo-location`)
13. ✅ Update request creation to use DB pricing
14. ✅ Real-time price updates

### **Phase 6: Driver Matching**
15. ✅ Use `operator_locations` for matching (add `is_available` if needed)
16. ✅ Create matching function (Edge Function or RPC)
17. ✅ Auto-assign driver on request creation

### **Phase 7: Realtime & Notifications**
18. ✅ Create `realtimeService.ts` (subscribe to `towing_requests`)
19. ✅ Update `RequestStatusScreen` with realtime
20. ✅ Implement `notificationService.ts` (use existing `notifications` table)

### **Phase 8: Storage & Photos**
21. ✅ Create Supabase Storage bucket `vehicle_photos`
22. ✅ Create `storageService.ts` for photo uploads
23. ✅ Integrate photo upload in vehicle management

---

## 🔧 **ADAPTATIONS TO EXISTING CODE**

### **1. Users Table → Works with Supabase Auth**
**Current:** `users` table has its own `id` (UUID)
**Adaptation:** 
- On phone OTP login, create/update `users` row with `id = auth.users.id`
- Use `users` table as profile (no need for separate `profiles` table)

### **2. Towing Requests → Already Perfect**
**Current:** `towing_requests` has all needed fields
**No changes needed!**

### **3. Driver Matching → Use `operator_locations`**
**Current:** `operator_locations` tracks operator positions
**Adaptation:**
- Add `is_available` column (optional)
- Use `operator_locations` to find nearest available driver
- Match based on `latitude`, `longitude`, and `is_available = true`
- Use `last_seen` to filter active operators (within 2 minutes)

### **4. Trip History → Use `towing_requests`**
**Current:** `towing_requests` has `status = 'completed'`
**Adaptation:**
- Query `towing_requests WHERE status = 'completed'` for history
- No need for separate `trip_history` table (unless you want to archive)

### **5. Notifications → Already Exists**
**Current:** `notifications` table exists with RLS
**Just implement the service!**

---

## 📁 **FILE STRUCTURE (Minimal Changes)**

```
client/
├── lib/
│   ├── supabase.ts (already exists ✅)
│   └── api/ (keep existing, add new services)
├── services/ (NEW - but can be in lib/services/)
│   ├── authService.ts (phone OTP)
│   ├── vehicleService.ts (CRUD vehicles)
│   ├── pricingService.ts (fetch pricing)
│   ├── locationService.ts (location helpers)
│   ├── realtimeService.ts (subscriptions)
│   ├── notificationService.ts (notifications)
│   └── storageService.ts (photo uploads)
├── features/ (NEW - optional organization)
│   ├── auth/
│   │   ├── PhoneLoginScreen.tsx
│   │   └── OTPVerifyScreen.tsx
│   └── vehicles/
│       └── AddEditVehicleScreen.tsx
└── app/ (existing screens - update as needed)
    ├── screens/user/home-screen.tsx (add location + pricing)
    ├── screens/user/searching-operator.tsx (add realtime)
    └── (tabs)/profile.tsx (add vehicle list)
```

---

## ✅ **CHECKLIST (Incremental)**

### **Database (Minimal Changes)**
- [ ] Add `user_vehicles` table + RLS
- [ ] Add `vehicle_pricing` table + seed data + RLS
- [ ] Optional: Add `is_available` to `operator_locations`
- [ ] Optional: Add `last_seen` to `operator_locations`

### **Services**
- [ ] `authService.ts` - Phone OTP (sync with `users` table)
- [ ] `vehicleService.ts` - CRUD `user_vehicles`
- [ ] `pricingService.ts` - Fetch from `vehicle_pricing`
- [ ] `locationService.ts` - Location helpers
- [ ] `realtimeService.ts` - Subscribe to `towing_requests`
- [ ] `notificationService.ts` - Use existing `notifications`
- [ ] `storageService.ts` - Photo uploads

### **Screens**
- [ ] `PhoneLoginScreen.tsx` - Phone input
- [ ] `OTPVerifyScreen.tsx` - Code verification
- [ ] `AddEditVehicleScreen.tsx` - Vehicle form
- [ ] Update `ProfileScreen` - Vehicle list
- [ ] Update `HomeScreen` - Location + DB pricing
- [ ] Update `RequestStatusScreen` - Realtime

---

## 🎯 **KEY DIFFERENCES FROM PROMPT**

| Prompt Wants | We'll Use Instead | Reason |
|-------------|-------------------|---------|
| `profiles` table | `users` table | Already exists, just sync with auth |
| `tow_requests` | `towing_requests` | Already exists, perfect structure |
| `driver_status` | `operator_locations` | Already exists, can add `is_available` |
| `assignments` table | `operator_id` in `towing_requests` | Already has `operator_id`, no need for separate table |
| `trip_history` table | `towing_requests` WHERE `status='completed'` | Can query existing table |

---

## 🚀 **START HERE**

1. **Create migration file** with only the 2 new tables (`user_vehicles`, `vehicle_pricing`)
2. **Implement phone OTP auth** (works with existing `users` table)
3. **Build vehicle management** (uses new `user_vehicles` table)
4. **Add dynamic pricing** (uses new `vehicle_pricing` table)
5. **Everything else** builds on existing schema

**No overhaul needed!** 🎉

