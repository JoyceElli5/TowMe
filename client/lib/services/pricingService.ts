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
      console.warn('No pricing data found in database. Using fallback pricing.');
      // Return fallback pricing if database is empty
      return [
        { vehicle_type: 'car', base_fee: 30, per_km_fee: 8, min_fee: 60, updated_at: new Date().toISOString() },
        { vehicle_type: 'saloon', base_fee: 35, per_km_fee: 9, min_fee: 70, updated_at: new Date().toISOString() },
        { vehicle_type: 'suv', base_fee: 50, per_km_fee: 12, min_fee: 100, updated_at: new Date().toISOString() },
        { vehicle_type: 'van', base_fee: 60, per_km_fee: 14, min_fee: 120, updated_at: new Date().toISOString() },
      ] as VehiclePricing[];
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

