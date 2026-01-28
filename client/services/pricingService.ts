/**
 * Pricing Service
 * Handles vehicle pricing from database
 */

import { supabase } from '@/lib/supabase';

export type VehicleType = 'car' | 'suv' | 'saloon' | 'van';

export interface VehiclePricing {
  vehicle_type: VehicleType;
  base_fee: number;
  per_km_fee: number;
  min_fee: number;
  updated_at: string;
}

// Cache for pricing data
let pricingCache: Map<VehicleType, VehiclePricing> = new Map();
let lastFetch: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all vehicle pricing from database
 */
export async function fetchVehiclePricing(): Promise<VehiclePricing[]> {
  const now = Date.now();
  
  // Return cached data if recent
  if (pricingCache.size > 0 && now - lastFetch < CACHE_DURATION) {
    return Array.from(pricingCache.values());
  }

  const { data, error } = await supabase
    .from('vehicle_pricing')
    .select('*');

  if (error) {
    throw error;
  }

  // Update cache
  pricingCache.clear();
  data?.forEach((pricing) => {
    pricingCache.set(pricing.vehicle_type, pricing);
  });
  lastFetch = now;

  return data || [];
}

/**
 * Get pricing for a specific vehicle type
 */
export async function getPricingForVehicle(
  vehicleType: VehicleType
): Promise<VehiclePricing | null> {
  // Check cache first
  if (pricingCache.has(vehicleType) && Date.now() - lastFetch < CACHE_DURATION) {
    return pricingCache.get(vehicleType) || null;
  }

  // Fetch from database
  const { data, error } = await supabase
    .from('vehicle_pricing')
    .select('*')
    .eq('vehicle_type', vehicleType)
    .single();

  if (error) {
    console.error('Error fetching pricing:', error);
    return null;
  }

  // Update cache
  if (data) {
    pricingCache.set(vehicleType, data);
    lastFetch = Date.now();
  }

  return data;
}

/**
 * Calculate estimated cost for a tow request
 * Formula: max(min_fee, base_fee + (distance_km * per_km_fee))
 */
export function calculateCost(
  distanceKm: number,
  pricing: VehiclePricing
): number {
  const calculatedCost = pricing.base_fee + distanceKm * pricing.per_km_fee;
  return Math.max(pricing.min_fee, calculatedCost);
}

/**
 * Calculate estimated cost with vehicle type lookup
 */
export async function calculateEstimatedCost(
  distanceKm: number,
  vehicleType: VehicleType
): Promise<number | null> {
  const pricing = await getPricingForVehicle(vehicleType);
  if (!pricing) {
    return null;
  }

  return calculateCost(distanceKm, pricing);
}

/**
 * Clear pricing cache (useful for testing or force refresh)
 */
export function clearPricingCache(): void {
  pricingCache.clear();
  lastFetch = 0;
}
