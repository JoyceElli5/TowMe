# Remove Hardcoded Data - Make Everything Dynamic

## ✅ Migration File Created
**File:** `backend/database/migration_add_vehicles_and_pricing.sql`

This migration adds:
- `user_vehicles` table (for vehicle management)
- `vehicle_pricing` table (for dynamic pricing)
- Enhanced `operator_locations` (for driver matching)
- RLS policies
- Seed data for pricing

---

## 🔴 Hardcoded Data to Remove

### **1. Client-Side Pricing (`client/constants/pricing.ts`)**

#### ❌ Remove These Constants:
```typescript
export const BASE_FARE = 20;                    // → Get from DB
export const BASE_PRICE_PER_KM = 15;           // → Get from DB
export const MINIMUM_PRICE = 50;               // → Get from DB
export const TIME_RATE_PER_MINUTE = 0.50;     // → Optional: Add to DB or keep as config
export const SERVICE_FEE_PERCENTAGE = 0.10;    // → Optional: Add to DB or keep as config
```

#### ✅ Keep These (UI Only):
```typescript
export const CURRENCY_SYMBOL = 'GH₵';         // ✅ Keep (display only)
export type VehicleType = 'car' | 'suv' | ...; // ✅ Keep (type definition)
```

#### ⚠️ Modify `VEHICLE_OPTIONS`:
```typescript
// Current: Has priceMultiplier (hardcoded)
export const VEHICLE_OPTIONS: VehicleOption[] = [
  { id: 'car', label: 'Car', icon: '🚗', priceMultiplier: 1.0 },
  // ...
];

// New: Remove priceMultiplier, keep only UI data
export interface VehicleOption {
  id: VehicleType;
  label: string;
  icon: string;
  // Remove: priceMultiplier: number;
}

export const VEHICLE_OPTIONS: VehicleOption[] = [
  { id: 'car', label: 'Car', icon: '🚗' },
  { id: 'suv', label: 'SUV', icon: '🚙' },
  { id: 'saloon', label: 'Saloon', icon: '🚘' },
  { id: 'van', label: 'Van', icon: '🚐' },
  { id: 'truck', label: 'Truck', icon: '🛻' },
  { id: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
  { id: 'others', label: 'Others', icon: '🚜' },
];
```

#### ❌ Replace `calculateEstimatedPrice()` Function:
```typescript
// Current: Uses hardcoded values
export function calculateEstimatedPrice(
  distanceKm: number,
  vehicleType: VehicleType | null,
  durationMinutes: number = 0
): number | null {
  // Uses BASE_FARE, BASE_PRICE_PER_KM, MINIMUM_PRICE, priceMultiplier
}

// New: Should fetch pricing from DB
// Formula: max(min_fee, base_fee + per_km_fee * distance_km)
// This will be moved to a service that fetches from vehicle_pricing table
```

---

### **2. Backend Pricing (`backend/src/config/constants.ts`)**

#### ❌ Remove:
```typescript
export const BASE_PRICE_PER_KM = 15;
export const MINIMUM_PRICE = 50;
export const VEHICLE_MULTIPLIERS: Record<string, number> = {
  car: 1.0,
  suv: 1.3,
  // ...
};
```

#### ✅ Keep:
```typescript
export const CURRENCY_SYMBOL = 'GH₵';  // ✅ Keep (display only)
export const REQUEST_STATUS = { ... }; // ✅ Keep (enum values)
export const USER_ROLES = { ... };     // ✅ Keep (enum values)
```

---

### **3. Backend Price Calculator (`backend/src/utils/price.calculator.ts`)**

#### ❌ Replace:
```typescript
// Current: Uses VEHICLE_MULTIPLIERS from constants
export function getVehicleMultiplier(vehicleType: VehicleType): number {
  return VEHICLE_MULTIPLIERS[vehicleType] || 1.0;
}

export function calculateEstimatedPrice(...) {
  // Uses hardcoded BASE_PRICE_PER_KM, MINIMUM_PRICE, multipliers
}
```

#### ✅ New: Fetch from DB
- Create service to fetch `vehicle_pricing` from database
- Use formula: `max(min_fee, base_fee + per_km_fee * distance_km)`
- No multipliers needed - pricing is per vehicle type in DB

---

## 📋 Implementation Steps

### **Step 1: Run Migration**
```sql
-- Run in Supabase SQL Editor
-- File: backend/database/migration_add_vehicles_and_pricing.sql
```

### **Step 2: Create Pricing Service**
**File:** `client/lib/services/pricingService.ts` (or `client/services/pricingService.ts`)
```typescript
// Fetch pricing from vehicle_pricing table
export async function getVehiclePricing(): Promise<VehiclePricing[]>
export async function getPricingForVehicleType(type: VehicleType): Promise<VehiclePricing | null>
export async function calculateEstimatedPrice(
  distanceKm: number,
  vehicleType: VehicleType
): Promise<number | null>
```

### **Step 3: Update Client Code**
1. Remove hardcoded constants from `client/constants/pricing.ts`
2. Update `calculateEstimatedPrice()` to use pricing service
3. Update `VehicleTypeCard` to remove `priceMultiplier`
4. Update `HomeScreen` to fetch pricing on mount

### **Step 4: Update Backend Code**
1. Remove hardcoded constants from `backend/src/config/constants.ts`
2. Update `backend/src/utils/price.calculator.ts` to fetch from DB
3. Update `backend/src/services/requests.service.ts` to use DB pricing

---

## 🎯 What Stays Static (UI/Config Only)

These can remain hardcoded as they're UI/display related:
- ✅ Vehicle type labels ("Car", "SUV", etc.)
- ✅ Vehicle icons (emoji or icon names)
- ✅ Currency symbol ("GH₵")
- ✅ Request status enum values
- ✅ User role enum values
- ✅ UI styling constants

---

## 🚫 What Must Be Dynamic (From DB)

These MUST come from the database:
- ❌ Base fees per vehicle type
- ❌ Per-km fees per vehicle type
- ❌ Minimum fees per vehicle type
- ❌ Any pricing calculations
- ❌ Vehicle data (make, model, color, plate, photo)
- ❌ User vehicle lists

---

## 📝 Next Steps After Migration

1. ✅ Run migration SQL
2. Create `pricingService.ts` to fetch from `vehicle_pricing`
3. Update `calculateEstimatedPrice()` to use service
4. Remove hardcoded pricing constants
5. Test price calculations with DB data
6. Update backend pricing calculator similarly

