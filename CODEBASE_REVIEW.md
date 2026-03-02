# TowMe Codebase Review
## Comprehensive Analysis of Missing Features and Logic Issues

**Date:** Review conducted on current codebase  
**Status:** Critical issues identified requiring immediate attention

---

## 🔴 **CRITICAL ISSUES**

### 1. **Backend Pricing Still Uses Hardcoded Values** ⚠️
**Location:** `backend/src/utils/price.calculator.ts`, `backend/src/config/constants.ts`

**Issue:**
- Backend price calculator uses hardcoded constants (`BASE_PRICE_PER_KM`, `VEHICLE_MULTIPLIERS`) instead of fetching from `vehicle_pricing` table
- Frontend has been updated to use database pricing (`client/lib/services/pricingService.ts`), but backend still uses constants
- This creates inconsistency between frontend estimates and backend calculations

**Impact:**
- Price estimates shown to users may differ from actual prices calculated by backend
- Cannot update pricing without code changes
- Database `vehicle_pricing` table exists but is not used by backend

**Fix Required:**
- Update `backend/src/utils/price.calculator.ts` to fetch pricing from `vehicle_pricing` table
- Remove hardcoded pricing constants from `backend/src/config/constants.ts`
- Ensure backend and frontend use same pricing source

---

### 2. **Hardcoded Operator Location in Track Request** 🚨
**Location:** `backend/src/controllers/requests.controller.ts:212-217`

**Issue:**
```typescript
// Placeholder for operator location
operatorLocation: request.operator ? {
  latitude: 5.6050,  // HARDCODED
  longitude: -0.1860, // HARDCODED
  heading: 180,      // HARDCODED
  timestamp: new Date().toISOString(),
} : null,
```

**Impact:**
- Live tracking feature shows fake/static location
- Users cannot see actual operator location during trips
- Real-time tracking is completely broken

**Fix Required:**
- Fetch actual location from `operator_locations` table
- Query latest location for the operator associated with the request
- Return real-time location data

---

### 3. **Missing Automatic Driver Matching** 🚛
**Location:** `backend/src/services/requests.service.ts`

**Issue:**
- No automatic driver matching logic implemented
- Operators must manually accept requests
- No distance-based matching algorithm
- No `driver_status` or `assignments` tables (mentioned in implementation plan but not in schema)

**Current Flow:**
1. User creates request → Status: `pending`
2. Operator manually views and accepts → Status: `accepted`

**Expected Flow (per implementation plan):**
1. User creates request → Status: `pending`
2. System automatically finds nearest available operator
3. System assigns operator → Status: `accepted` or `matched`
4. Notification sent to user

**Impact:**
- Poor user experience (waiting for manual acceptance)
- No optimization for distance/proximity
- Slower response times

**Fix Required:**
- Implement automatic matching function (Postgres RPC or Edge Function)
- Find nearest available operator based on pickup location
- Auto-assign operator to request
- Create notification for user

---

## 🟡 **HIGH PRIORITY ISSUES**

### 4. **Missing Vehicle Management UI** 🚗
**Location:** `client/lib/services/vehicleService.ts` exists, but no UI

**Issue:**
- `user_vehicles` table exists in database
- Service functions exist (`getUserVehicles`, `createVehicle`, etc.)
- No UI screens to manage vehicles
- Profile screen has TODO comment for image upload

**Impact:**
- Users cannot add/manage their vehicles
- Cannot select vehicle when creating request
- Vehicle photos cannot be uploaded

**Fix Required:**
- Create vehicle management screens (list, add, edit, delete)
- Integrate with profile screen
- Implement image upload to Supabase Storage
- Allow vehicle selection during request creation

---

### 5. **Incomplete Email Service** 📧
**Location:** `backend/src/services/email.service.ts`

**Issue:**
- All email functions have `// TODO: Implement actual email sending`
- Functions return success but don't actually send emails
- Password reset, verification, and notifications won't work

**Impact:**
- Password reset flow is broken
- Email verification doesn't work
- Users won't receive important notifications

**Fix Required:**
- Integrate email service (SendGrid, AWS SES, or similar)
- Implement actual email sending
- Test all email flows

---

### 6. **PDF Receipt Generation Not Implemented** 📄
**Location:** `backend/src/services/receipt.service.ts:163-168`

**Issue:**
```typescript
// TODO: Implement PDF generation using a library like pdfkit
```

**Impact:**
- Receipt download feature is broken
- Users cannot get trip receipts
- No documentation for completed trips

**Fix Required:**
- Integrate PDF generation library (pdfkit, puppeteer, etc.)
- Generate formatted receipts with trip details
- Return PDF as download

---

### 7. **Contact Support Has Placeholder Data** 📞
**Location:** `client/app/screens/user/contact-support-screen.tsx`

**Issue:**
- Phone number: `+233 XX XXX XXXX` (placeholder)
- Email: `support@towme.com` (may not be configured)
- No actual support integration

**Impact:**
- Users cannot contact support
- Support requests go nowhere

**Fix Required:**
- Add real support contact information
- Implement support ticket system or integrate with support platform

---

## 🟢 **MEDIUM PRIORITY ISSUES**

### 8. **Schema Mismatch with Implementation Plan** 📊
**Location:** Database schema vs. implementation plan

**Issue:**
- Implementation plan mentions `profiles` table, but schema uses `users` table
- Plan mentions `driver_status` and `assignments` tables, but they don't exist
- Plan mentions `trip_history` table, but schema uses `towing_requests` with status filter

**Impact:**
- Confusion about data structure
- Some planned features may not be implementable as designed

**Fix Required:**
- Align schema with implementation plan OR update plan to match schema
- Add missing tables if needed for features
- Document actual schema structure

---

### 9. **Incomplete Error Handling** ⚠️
**Location:** Multiple files

**Issues Found:**
- Some API calls have silent failures
- Error messages not always user-friendly
- Some try-catch blocks don't handle all error types

**Examples:**
- `home-screen.tsx:117` - Silent fail for location detection
- Some services don't propagate errors properly

**Fix Required:**
- Review all error handling
- Ensure all errors are logged
- Provide user-friendly error messages
- Handle edge cases

---

### 10. **Phone OTP Authentication Integration** 📱
**Location:** Auth screens and services

**Status:**
- Phone OTP service exists (`client/lib/services/authService.ts`)
- OTP screens exist (`phone-login-screen.tsx`, `otp-verify-screen.tsx`)
- But email/password auth may still be default

**Issue:**
- Need to verify phone OTP is the primary auth method
- May need to deprecate email/password flow
- SMS provider configuration may be missing

**Fix Required:**
- Verify phone OTP is default auth method
- Ensure SMS provider is configured in Supabase
- Test complete OTP flow
- Remove or deprecate email/password if not needed

---

### 11. **Real-time Location Tracking Implementation** 📍
**Location:** `backend/src/controllers/requests.controller.ts:trackRequest`

**Issue:**
- Location tracking service exists on frontend
- Backend has `updateOperatorLocation` function
- But `trackRequest` endpoint returns hardcoded location (see issue #2)

**Status:**
- Frontend implementation looks complete
- Backend location update works
- But tracking endpoint doesn't use it

**Fix Required:**
- Fix `trackRequest` to fetch from `operator_locations` table
- Ensure real-time updates work end-to-end

---

### 12. **Missing Profile Image Upload** 🖼️
**Location:** `client/app/(tabs)/profile.tsx:241`

**Issue:**
```typescript
// TODO: Implement actual image upload to Supabase Storage or similar
```

**Impact:**
- Users cannot upload profile pictures
- Avatar functionality is incomplete

**Fix Required:**
- Implement Supabase Storage integration
- Add image picker component
- Handle image upload and URL storage

---

## 📋 **SUMMARY OF MISSING FEATURES**

### Not Implemented:
1. ❌ Automatic driver matching
2. ❌ Vehicle management UI
3. ❌ Email service (actual sending)
4. ❌ PDF receipt generation
5. ❌ Profile image upload
6. ❌ Support contact integration

### Partially Implemented:
1. ⚠️ Backend pricing (uses hardcoded values)
2. ⚠️ Real-time location tracking (backend returns hardcoded data)
3. ⚠️ Phone OTP (exists but may not be default)
4. ⚠️ Error handling (incomplete in some areas)

### Logic Issues:
1. 🔴 Backend and frontend pricing mismatch
2. 🔴 Hardcoded operator location breaks tracking
3. 🔴 No automatic matching delays response times
4. 🟡 Schema doesn't match implementation plan

---

## 🎯 **RECOMMENDED FIX PRIORITY**

### **Phase 1: Critical Fixes (Immediate)**
1. Fix backend pricing to use database
2. Fix operator location tracking (remove hardcoded values)
3. Implement automatic driver matching

### **Phase 2: High Priority (This Sprint)**
4. Implement vehicle management UI
5. Complete email service implementation
6. Implement PDF receipt generation

### **Phase 3: Medium Priority (Next Sprint)**
7. Fix contact support placeholder
8. Complete profile image upload
9. Align schema with implementation plan
10. Improve error handling throughout

---

## 📝 **NOTES**

- Frontend pricing service is correctly implemented and uses database
- Real-time subscriptions are properly set up
- Database schema has all necessary tables (except `driver_status`/`assignments` if needed)
- Phone OTP implementation looks complete, just needs verification
- Most core features are implemented, but some critical logic is incomplete

---

## ✅ **WHAT'S WORKING WELL**

- Frontend pricing service correctly uses database
- Real-time subscriptions are properly implemented
- Database schema is mostly complete
- Phone OTP service is well-structured
- Error handling exists in most places
- Code organization is good
- TypeScript types are well-defined

---

**Next Steps:**
1. Address critical issues first (pricing, location tracking)
2. Implement automatic matching
3. Complete high-priority features
4. Test end-to-end flows
5. Update documentation

