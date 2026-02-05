# TowMe - Detailed Implementation Prompt
## Complete Feature Implementation Guide

**Status:** Database migration completed ✅  
**Next:** Implement all features incrementally

---

## 🎯 **IMPLEMENTATION OVERVIEW**

Transform TowMe into a fully dynamic, Supabase-backed application with:
- Phone OTP authentication
- Vehicle management with photo uploads
- Dynamic pricing from database
- Automatic driver matching
- Real-time status updates
- Complete notification system

---

## 📋 **PHASE 1: AUTHENTICATION - PHONE OTP**

### **1.1 Create Auth Service**

**File:** `client/lib/services/authService.ts` (create new)

```typescript
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface PhoneAuthResult {
  success: boolean;
  error?: string;
  user?: User;
}

/**
 * Send OTP to phone number
 */
export async function sendOTP(phone: string): Promise<PhoneAuthResult> {
  try {
    // Format phone number (ensure it includes country code)
    const formattedPhone = phone.startsWith('+') ? phone : `+233${phone.replace(/^0/, '')}`;
    
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
      options: {
        channel: 'sms',
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to send OTP' };
  }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(
  phone: string,
  token: string
): Promise<PhoneAuthResult> {
  try {
    const formattedPhone = phone.startsWith('+') ? phone : `+233${phone.replace(/^0/, '')}`;
    
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token,
      type: 'sms',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'No user returned from verification' };
    }

    // Create or update user profile in users table
    await createOrUpdateUserProfile(data.user, formattedPhone);

    return { success: true, user: data.user };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to verify OTP' };
  }
}

/**
 * Create or update user profile in users table after OTP verification
 */
async function createOrUpdateUserProfile(
  authUser: User,
  phone: string
): Promise<void> {
  try {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', authUser.id)
      .single();

    if (!existingUser) {
      // Create new user profile
      const { error } = await supabase.from('users').insert({
        id: authUser.id,
        email: authUser.email || null,
        phone: phone,
        full_name: phone, // Default to phone, user can update later
        role: 'vehicle_owner',
        is_verified: true,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Error creating user profile:', error);
        // Don't throw - auth succeeded, profile can be created later
      }
    } else {
      // Update existing user (mark as verified)
      await supabase
        .from('users')
        .update({ is_verified: true })
        .eq('id', authUser.id);
    }
  } catch (error) {
    console.error('Error syncing user profile:', error);
    // Non-fatal - continue with auth
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
```

---

### **1.2 Create Phone Login Screen**

**File:** `client/app/screens/auth/phone-login-screen.tsx` (create new)

```typescript
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useToast } from '@/hooks/use-toast';
import { sendOTP } from '@/lib/services/authService';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';

export default function PhoneLoginScreen() {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');
  const buttonColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');

  const handleSendOTP = async () => {
    if (!phone.trim()) {
      showToast('Please enter your phone number', 'error');
      return;
    }

    // Basic phone validation (Ghana format)
    const phoneRegex = /^(0|\+233)[0-9]{9}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      showToast('Please enter a valid Ghana phone number', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendOTP(phone);
      if (result.success) {
        showToast('OTP sent successfully!', 'success');
        router.push({
          pathname: '/screens/auth/otp-verify-screen',
          params: { phone },
        });
      } else {
        showToast(result.error || 'Failed to send OTP', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'An error occurred', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText style={styles.title}>Welcome to TowMe</ThemedText>
          <ThemedText style={styles.subtitle}>
            Enter your phone number to get started
          </ThemedText>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Phone Number</ThemedText>
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              placeholder="024 123 4567"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              autoFocus
            />
            <ThemedText style={styles.hint}>
              Enter your Ghana phone number (e.g., 0241234567)
            </ThemedText>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: buttonColor }]}
            onPress={handleSendOTP}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>Send OTP</ThemedText>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.semiBold,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    marginBottom: 32,
    textAlign: 'center',
    opacity: 0.7,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  hint: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 6,
    opacity: 0.6,
  },
  button: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
});
```

---

### **1.3 Create OTP Verify Screen**

**File:** `client/app/screens/auth/otp-verify-screen.tsx` (create new)

```typescript
import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useToast } from '@/hooks/use-toast';
import { verifyOTP, sendOTP } from '@/lib/services/authService';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';

export default function OTPVerifyScreen() {
  const params = useLocalSearchParams<{ phone: string }>();
  const phone = params.phone || '';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { showToast } = useToast();
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');
  const buttonColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      showToast('Please enter the complete 6-digit code', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyOTP(phone, code);
      if (result.success) {
        showToast('Login successful!', 'success');
        router.replace('/(tabs)');
      } else {
        showToast(result.error || 'Invalid OTP code', 'error');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      showToast(error.message || 'An error occurred', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const result = await sendOTP(phone);
      if (result.success) {
        showToast('OTP resent successfully!', 'success');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        showToast(result.error || 'Failed to resend OTP', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'An error occurred', 'error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText style={styles.title}>Enter Verification Code</ThemedText>
          <ThemedText style={styles.subtitle}>
            We sent a 6-digit code to {phone}
          </ThemedText>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.otpInput,
                  { borderColor, color: textColor },
                  digit && { borderColor: buttonColor },
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: buttonColor },
              otp.join('').length !== 6 && styles.buttonDisabled,
            ]}
            onPress={handleVerify}
            disabled={isLoading || otp.join('').length !== 6}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>Verify</ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResend}
            disabled={isResending}
          >
            {isResending ? (
              <ActivityIndicator size="small" />
            ) : (
              <ThemedText style={styles.resendText}>Resend Code</ThemedText>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.semiBold,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    marginBottom: 32,
    textAlign: 'center',
    opacity: 0.7,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  otpInput: {
    flex: 1,
    height: 64,
    borderWidth: 2,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontFamily: Fonts.semiBold,
  },
  button: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  resendButton: {
    alignItems: 'center',
    padding: 16,
  },
  resendText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    opacity: 0.7,
  },
});
```

---

### **1.4 Update Navigation**

**File:** `client/app/index.tsx` (update existing)

Add logic to check auth state and redirect:
- If authenticated → `/(tabs)`
- If not authenticated → `/screens/auth/phone-login-screen`

---

## 📋 **PHASE 2: PRICING SERVICE - DYNAMIC PRICING**

### **2.1 Create Pricing Service**

**File:** `client/lib/services/pricingService.ts` (create new)

```typescript
import { supabase } from '@/lib/supabase';

export type VehicleType = 'car' | 'suv' | 'saloon' | 'van' | 'truck' | 'motorcycle' | 'others';

export interface VehiclePricing {
  vehicle_type: VehicleType;
  base_fee: number;
  per_km_fee: number;
  min_fee: number;
  updated_at: string;
}

// Cache pricing data in memory
let pricingCache: VehiclePricing[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all vehicle pricing from database
 */
export async function getVehiclePricing(): Promise<VehiclePricing[]> {
  // Check cache first
  const now = Date.now();
  if (pricingCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return pricingCache;
  }

  try {
    const { data, error } = await supabase
      .from('vehicle_pricing')
      .select('*')
      .order('vehicle_type');

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('No pricing data found');
    }

    // Update cache
    pricingCache = data as VehiclePricing[];
    cacheTimestamp = now;

    return pricingCache;
  } catch (error: any) {
    console.error('Error fetching vehicle pricing:', error);
    throw new Error(`Failed to fetch pricing: ${error.message}`);
  }
}

/**
 * Get pricing for a specific vehicle type
 */
export async function getPricingForVehicleType(
  vehicleType: VehicleType
): Promise<VehiclePricing | null> {
  const allPricing = await getVehiclePricing();
  return allPricing.find((p) => p.vehicle_type === vehicleType) || null;
}

/**
 * Calculate estimated price based on distance and vehicle type
 * Formula: max(min_fee, base_fee + per_km_fee * distance_km)
 */
export async function calculateEstimatedPrice(
  distanceKm: number,
  vehicleType: VehicleType
): Promise<number | null> {
  try {
    const pricing = await getPricingForVehicleType(vehicleType);
    
    if (!pricing) {
      console.error(`No pricing found for vehicle type: ${vehicleType}`);
      return null;
    }

    // Calculate: base_fee + (per_km_fee * distance)
    const calculatedPrice = pricing.base_fee + pricing.per_km_fee * distanceKm;
    
    // Apply minimum fee
    const finalPrice = Math.max(calculatedPrice, pricing.min_fee);

    return Math.round(finalPrice * 100) / 100; // Round to 2 decimal places
  } catch (error: any) {
    console.error('Error calculating estimated price:', error);
    return null;
  }
}

/**
 * Clear pricing cache (useful after pricing updates)
 */
export function clearPricingCache(): void {
  pricingCache = null;
  cacheTimestamp = 0;
}
```

---

### **2.2 Update Pricing Constants**

**File:** `client/constants/pricing.ts` (update existing)

Remove hardcoded pricing, keep only UI constants:

```typescript
/** Default currency symbol */
export const CURRENCY_SYMBOL = 'GH₵';

/** Vehicle type identifier */
export type VehicleType = 'car' | 'suv' | 'saloon' | 'van' | 'truck' | 'motorcycle' | 'others';

/** Vehicle option configuration (UI only - no pricing) */
export interface VehicleOption {
  id: VehicleType;
  label: string;
  icon: string;
}

/** Available vehicle options (UI display only) */
export const VEHICLE_OPTIONS: VehicleOption[] = [
  { id: 'car', label: 'Car', icon: '🚗' },
  { id: 'suv', label: 'SUV', icon: '🚙' },
  { id: 'saloon', label: 'Saloon', icon: '🚘' },
  { id: 'van', label: 'Van', icon: '🚐' },
  { id: 'truck', label: 'Truck', icon: '🛻' },
  { id: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
  { id: 'others', label: 'Others', icon: '🚜' },
];

// Remove calculateEstimatedPrice - use pricingService instead
```

---

### **2.3 Update Vehicle Type Card**

**File:** `client/components/vehicle-type-card.tsx` (update existing)

Remove `priceMultiplier` from interface:

```typescript
// Update import
import { VEHICLE_OPTIONS, VehicleType } from '@/constants/pricing';

// Remove priceMultiplier from VehicleOption interface usage
// The component should work as-is since it only uses id, label, icon
```

---

## 📋 **PHASE 3: VEHICLE MANAGEMENT**

### **3.1 Create Vehicle Service**

**File:** `client/lib/services/vehicleService.ts` (create new)

```typescript
import { supabase } from '@/lib/supabase';
import type { VehicleType } from '@/constants/pricing';

export interface UserVehicle {
  id: string;
  user_id: string;
  vehicle_type: VehicleType;
  make: string | null;
  model: string | null;
  color: string | null;
  plate_number: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateVehicleData {
  vehicle_type: VehicleType;
  make?: string;
  model?: string;
  color?: string;
  plate_number?: string;
  photo_url?: string;
}

export interface UpdateVehicleData extends Partial<CreateVehicleData> {}

/**
 * Get all vehicles for current user
 */
export async function getUserVehicles(userId: string): Promise<UserVehicle[]> {
  try {
    const { data, error } = await supabase
      .from('user_vehicles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []) as UserVehicle[];
  } catch (error: any) {
    console.error('Error fetching user vehicles:', error);
    throw new Error(`Failed to fetch vehicles: ${error.message}`);
  }
}

/**
 * Create a new vehicle
 */
export async function createVehicle(
  userId: string,
  data: CreateVehicleData
): Promise<UserVehicle> {
  try {
    const { data: vehicle, error } = await supabase
      .from('user_vehicles')
      .insert({
        user_id: userId,
        ...data,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return vehicle as UserVehicle;
  } catch (error: any) {
    console.error('Error creating vehicle:', error);
    throw new Error(`Failed to create vehicle: ${error.message}`);
  }
}

/**
 * Update a vehicle
 */
export async function updateVehicle(
  vehicleId: string,
  data: UpdateVehicleData
): Promise<UserVehicle> {
  try {
    const { data: vehicle, error } = await supabase
      .from('user_vehicles')
      .update(data)
      .eq('id', vehicleId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return vehicle as UserVehicle;
  } catch (error: any) {
    console.error('Error updating vehicle:', error);
    throw new Error(`Failed to update vehicle: ${error.message}`);
  }
}

/**
 * Delete a vehicle
 */
export async function deleteVehicle(vehicleId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_vehicles')
      .delete()
      .eq('id', vehicleId);

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting vehicle:', error);
    throw new Error(`Failed to delete vehicle: ${error.message}`);
  }
}
```

---

### **3.2 Create Storage Service**

**File:** `client/lib/services/storageService.ts` (create new)

```typescript
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';

const BUCKET_NAME = 'vehicle_photos';

/**
 * Upload vehicle photo to Supabase Storage
 */
export async function uploadVehiclePhoto(
  userId: string,
  fileUri: string
): Promise<string> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${userId}/${timestamp}.jpg`;
    const filePath = `${BUCKET_NAME}/${filename}`;

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to blob
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);

    return urlData.publicUrl;
  } catch (error: any) {
    console.error('Error uploading vehicle photo:', error);
    throw new Error(`Failed to upload photo: ${error.message}`);
  }
}

/**
 * Delete vehicle photo from Supabase Storage
 */
export async function deleteVehiclePhoto(photoUrl: string): Promise<void> {
  try {
    // Extract filename from URL
    const urlParts = photoUrl.split('/');
    const filename = urlParts[urlParts.length - 2] + '/' + urlParts[urlParts.length - 1];

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filename]);

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting vehicle photo:', error);
    // Don't throw - photo deletion is not critical
  }
}
```

---

### **3.3 Create Add/Edit Vehicle Screen**

**File:** `client/app/screens/user/add-edit-vehicle-screen.tsx` (create new)

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useToast } from '@/hooks/use-toast';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { VEHICLE_OPTIONS, VehicleType } from '@/constants/pricing';
import {
  createVehicle,
  updateVehicle,
  deleteVehicle,
  type UserVehicle,
} from '@/lib/services/vehicleService';
import { uploadVehiclePhoto } from '@/lib/services/storageService';
import { getCurrentUser } from '@/lib/services/authService';

export default function AddEditVehicleScreen() {
  const params = useLocalSearchParams<{ vehicleId?: string }>();
  const isEditing = !!params.vehicleId;
  
  const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const { showToast } = useToast();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');
  const buttonColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');

  // Load vehicle data if editing
  useEffect(() => {
    if (isEditing && params.vehicleId) {
      // Load vehicle data (implement fetchVehicleById if needed)
      // For now, assume we pass data via params or fetch it
    }
  }, [isEditing, params.vehicleId]);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('Permission to access camera roll is required', 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error: any) {
      showToast('Failed to pick image', 'error');
    }
  };

  const handleSave = async () => {
    if (!vehicleType) {
      showToast('Please select a vehicle type', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        showToast('Please login first', 'error');
        router.back();
        return;
      }

      let finalPhotoUrl = photoUrl;

      // Upload photo if new one selected
      if (photoUri && !photoUrl) {
        setIsUploading(true);
        finalPhotoUrl = await uploadVehiclePhoto(user.id, photoUri);
        setPhotoUrl(finalPhotoUrl);
        setIsUploading(false);
      }

      const vehicleData = {
        vehicle_type: vehicleType,
        make: make || null,
        model: model || null,
        color: color || null,
        plate_number: plateNumber || null,
        photo_url: finalPhotoUrl,
      };

      if (isEditing && params.vehicleId) {
        await updateVehicle(params.vehicleId, vehicleData);
        showToast('Vehicle updated successfully', 'success');
      } else {
        await createVehicle(user.id, vehicleData);
        showToast('Vehicle added successfully', 'success');
      }

      router.back();
    } catch (error: any) {
      showToast(error.message || 'Failed to save vehicle', 'error');
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const handleDelete = () => {
    if (!params.vehicleId) return;

    Alert.alert(
      'Delete Vehicle',
      'Are you sure you want to delete this vehicle?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVehicle(params.vehicleId!);
              showToast('Vehicle deleted successfully', 'success');
              router.back();
            } catch (error: any) {
              showToast(error.message || 'Failed to delete vehicle', 'error');
            }
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Vehicle Type Selection */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Vehicle Type *</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {VEHICLE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.typeOption,
                  {
                    backgroundColor: vehicleType === option.id ? buttonColor : backgroundColor,
                    borderColor: vehicleType === option.id ? buttonColor : borderColor,
                  },
                ]}
                onPress={() => setVehicleType(option.id)}
              >
                <ThemedText style={styles.typeIcon}>{option.icon}</ThemedText>
                <ThemedText style={styles.typeLabel}>{option.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Vehicle Details */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Make</ThemedText>
          <TextInput
            style={[styles.input, { borderColor, color: textColor }]}
            placeholder="e.g., Toyota"
            placeholderTextColor="#9ca3af"
            value={make}
            onChangeText={setMake}
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.label}>Model</ThemedText>
          <TextInput
            style={[styles.input, { borderColor, color: textColor }]}
            placeholder="e.g., Camry"
            placeholderTextColor="#9ca3af"
            value={model}
            onChangeText={setModel}
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.label}>Color</ThemedText>
          <TextInput
            style={[styles.input, { borderColor, color: textColor }]}
            placeholder="e.g., Red"
            placeholderTextColor="#9ca3af"
            value={color}
            onChangeText={setColor}
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.label}>Plate Number</ThemedText>
          <TextInput
            style={[styles.input, { borderColor, color: textColor }]}
            placeholder="e.g., GR 1234-20"
            placeholderTextColor="#9ca3af"
            value={plateNumber}
            onChangeText={setPlateNumber}
          />
        </View>

        {/* Photo Upload */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Vehicle Photo</ThemedText>
          <TouchableOpacity
            style={[styles.photoButton, { borderColor }]}
            onPress={handlePickImage}
          >
            {photoUri || photoUrl ? (
              <Image
                source={{ uri: photoUri || photoUrl || undefined }}
                style={styles.photo}
              />
            ) : (
              <ThemedText style={styles.photoPlaceholder}>
                Tap to add photo
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: buttonColor }]}
          onPress={handleSave}
          disabled={isLoading || isUploading}
        >
          {isLoading || isUploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.saveButtonText}>
              {isEditing ? 'Update Vehicle' : 'Add Vehicle'}
            </ThemedText>
          )}
        </TouchableOpacity>

        {/* Delete Button (only when editing) */}
        {isEditing && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <ThemedText style={styles.deleteButtonText}>Delete Vehicle</ThemedText>
          </TouchableOpacity>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    marginBottom: 8,
  },
  typeOption: {
    alignItems: 'center',
    padding: 12,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 80,
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  photoButton: {
    height: 200,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    opacity: 0.6,
  },
  saveButton: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  deleteButton: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    backgroundColor: '#ef4444',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
});
```

---

## 📋 **PHASE 4: UPDATE HOME SCREEN - LOCATION & PRICING**

### **4.1 Create Location Service**

**File:** `client/lib/services/locationService.ts` (create new)

```typescript
import * as Location from 'expo-location';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationData {
  coordinates: Coordinates;
  address: string;
}

/**
 * Request location permissions
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
}

/**
 * Get current device location
 */
export async function getCurrentLocation(): Promise<Coordinates | null> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    };
  } catch (error: any) {
    console.error('Error getting current location:', error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(
  coordinates: Coordinates
): Promise<string> {
  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude: coordinates.lat,
      longitude: coordinates.lng,
    });

    if (addresses && addresses.length > 0) {
      const addr = addresses[0];
      const parts = [
        addr.street,
        addr.district,
        addr.city,
        addr.region,
        addr.country,
      ].filter(Boolean);
      return parts.join(', ') || `${coordinates.lat}, ${coordinates.lng}`;
    }

    return `${coordinates.lat}, ${coordinates.lng}`;
  } catch (error: any) {
    console.error('Error reverse geocoding:', error);
    return `${coordinates.lat}, ${coordinates.lng}`;
  }
}

/**
 * Get current location with address
 */
export async function getCurrentLocationWithAddress(): Promise<LocationData | null> {
  try {
    const coordinates = await getCurrentLocation();
    if (!coordinates) {
      return null;
    }

    const address = await reverseGeocode(coordinates);
    return { coordinates, address };
  } catch (error: any) {
    console.error('Error getting location with address:', error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
```

---

### **4.2 Update Home Screen**

**File:** `client/app/screens/user/home-screen.tsx` (update existing)

Key changes:
1. Auto-detect current location on mount
2. Fetch pricing from database
3. Calculate price using pricing service
4. Update price in real-time when vehicle type or destination changes

```typescript
// Add imports
import { getCurrentLocationWithAddress, calculateDistance } from '@/lib/services/locationService';
import { calculateEstimatedPrice, getVehiclePricing } from '@/lib/services/pricingService';
import { getCurrentUser } from '@/lib/services/authService';

// In component:
useEffect(() => {
  // Auto-detect current location
  const detectLocation = async () => {
    const location = await getCurrentLocationWithAddress();
    if (location) {
      setPickupCoords(location.coordinates);
      setPickupAddress(location.address);
    }
  };
  detectLocation();
}, []);

// Update price calculation
useEffect(() => {
  const updatePrice = async () => {
    if (!selectedVehicle || !pickupCoords || !destinationCoords) {
      setEstimatedPrice(null);
      return;
    }

    const distance = calculateDistance(
      pickupCoords.lat,
      pickupCoords.lng,
      destinationCoords.lat,
      destinationCoords.lng
    );

    const price = await calculateEstimatedPrice(distance, selectedVehicle);
    setEstimatedPrice(price);
  };

  updatePrice();
}, [selectedVehicle, pickupCoords, destinationCoords]);
```

---

## 📋 **PHASE 5: REALTIME SERVICE**

### **5.1 Create Realtime Service**

**File:** `client/lib/services/realtimeService.ts` (create new)

```typescript
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Subscribe to changes on a specific towing request
 */
export function subscribeToRequest(
  requestId: string,
  callback: (payload: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`request:${requestId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'towing_requests',
        filter: `id=eq.${requestId}`,
      },
      callback
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to all requests for a user
 */
export function subscribeToUserRequests(
  userId: string,
  callback: (payload: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`user_requests:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'towing_requests',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to notifications for a user
 */
export function subscribeToNotifications(
  userId: string,
  callback: (payload: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from a channel
 */
export function unsubscribe(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}
```

---

## 📋 **PHASE 6: NOTIFICATION SERVICE**

### **6.1 Create Notification Service**

**File:** `client/lib/services/notificationService.ts` (create new)

```typescript
import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'request' | 'status_update' | 'rating' | 'payment';
  is_read: boolean;
  metadata: any;
  created_at: string;
}

/**
 * Get all notifications for current user
 */
export async function getNotifications(userId: string): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []) as Notification[];
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    throw new Error(`Failed to fetch notifications: ${error.message}`);
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    throw new Error(`Failed to mark notification as read: ${error.message}`);
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    throw new Error(`Failed to mark all notifications as read: ${error.message}`);
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      throw error;
    }

    return count || 0;
  } catch (error: any) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}
```

---

## 📋 **PHASE 7: UPDATE PROFILE SCREEN**

### **7.1 Add Vehicle List to Profile**

**File:** `client/app/(tabs)/profile.tsx` (update existing)

Add vehicle management section:

```typescript
// Add imports
import { getUserVehicles, type UserVehicle } from '@/lib/services/vehicleService';
import { getCurrentUser } from '@/lib/services/authService';

// Add state
const [vehicles, setVehicles] = useState<UserVehicle[]>([]);
const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);

// Load vehicles
useEffect(() => {
  const loadVehicles = async () => {
    const user = await getCurrentUser();
    if (user) {
      setIsLoadingVehicles(true);
      try {
        const userVehicles = await getUserVehicles(user.id);
        setVehicles(userVehicles);
      } catch (error) {
        console.error('Error loading vehicles:', error);
      } finally {
        setIsLoadingVehicles(false);
      }
    }
  };
  loadVehicles();
}, []);

// Add vehicle list UI in render
<View style={styles.section}>
  <View style={styles.sectionHeader}>
    <ThemedText style={styles.sectionTitle}>My Vehicles</ThemedText>
    <TouchableOpacity
      onPress={() => router.push('/screens/user/add-edit-vehicle-screen')}
    >
      <ThemedText style={styles.addButton}>+ Add</ThemedText>
    </TouchableOpacity>
  </View>
  
  {isLoadingVehicles ? (
    <ActivityIndicator />
  ) : vehicles.length === 0 ? (
    <ThemedText style={styles.emptyText}>No vehicles added yet</ThemedText>
  ) : (
    vehicles.map((vehicle) => (
      <TouchableOpacity
        key={vehicle.id}
        style={styles.vehicleItem}
        onPress={() =>
          router.push({
            pathname: '/screens/user/add-edit-vehicle-screen',
            params: { vehicleId: vehicle.id },
          })
        }
      >
        {/* Vehicle display */}
      </TouchableOpacity>
    ))
  )}
</View>
```

---

## 📋 **PHASE 8: SUPABASE STORAGE SETUP**

### **8.1 Create Storage Bucket**

In Supabase Dashboard:
1. Go to **Storage**
2. Click **New Bucket**
3. Name: `vehicle_photos`
4. Public: **No** (private bucket)
5. File size limit: 5MB
6. Allowed MIME types: `image/jpeg, image/png`

### **8.2 Set Storage Policies**

Run this SQL in Supabase SQL Editor:

```sql
-- Allow users to upload to their own folder
CREATE POLICY "Users can upload to own folder" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'vehicle_photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to read their own files
CREATE POLICY "Users can read own files" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'vehicle_photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'vehicle_photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

## ✅ **IMPLEMENTATION CHECKLIST**

### **Phase 1: Authentication**
- [ ] Create `authService.ts`
- [ ] Create `phone-login-screen.tsx`
- [ ] Create `otp-verify-screen.tsx`
- [ ] Update `app/index.tsx` for auth routing

### **Phase 2: Pricing**
- [ ] Create `pricingService.ts`
- [ ] Update `constants/pricing.ts` (remove hardcoded values)
- [ ] Update `vehicle-type-card.tsx`

### **Phase 3: Vehicles**
- [ ] Create `vehicleService.ts`
- [ ] Create `storageService.ts`
- [ ] Create `add-edit-vehicle-screen.tsx`
- [ ] Set up Supabase Storage bucket
- [ ] Update `profile.tsx` with vehicle list

### **Phase 4: Location & Request**
- [ ] Create `locationService.ts`
- [ ] Update `home-screen.tsx` with location detection
- [ ] Update `home-screen.tsx` with dynamic pricing

### **Phase 5: Realtime**
- [ ] Create `realtimeService.ts`
- [ ] Update request status screens with realtime

### **Phase 6: Notifications**
- [ ] Create `notificationService.ts`
- [ ] Update `messages.tsx` with notifications

---

## 🚀 **START IMPLEMENTATION**

Begin with **Phase 1** (Authentication) and work through each phase sequentially. Each phase builds on the previous one.

**Priority Order:**
1. Auth (Phase 1) - Users can login
2. Pricing (Phase 2) - Dynamic pricing works
3. Vehicles (Phase 3) - Users can manage vehicles
4. Location (Phase 4) - Auto-detect location
5. Realtime (Phase 5) - Live updates
6. Notifications (Phase 6) - User alerts

Good luck! 🎉

