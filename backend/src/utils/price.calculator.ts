/**
 * Price Calculator Utility
 * Calculates estimated and final prices for towing services
 * Uses dynamic pricing from vehicle_pricing table
 */

import { CURRENCY_SYMBOL } from '../config/constants';
import { getSupabaseAdmin } from '../config/database';
import type { VehicleType } from '../types/database.types';
import logger from './logger';

interface VehiclePricing {
  vehicle_type: VehicleType;
  base_fee: number;
  per_km_fee: number;
  min_fee: number;
}

// Cache pricing data in memory
let pricingCache: Map<VehicleType, VehiclePricing> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch pricing data from database
 */
async function getPricingFromDatabase(): Promise<Map<VehicleType, VehiclePricing>> {
  // Check cache first
  const now = Date.now();
  if (pricingCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return pricingCache;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('vehicle_pricing')
    .select('vehicle_type, base_fee, per_km_fee, min_fee');

  if (error) {
    logger.error('Error fetching vehicle pricing:', error);
    throw new Error(`Failed to fetch pricing: ${error.message}`);
  }

  if (!data || data.length === 0) {
    logger.warn('No pricing data found in database. Using fallback pricing.');
    // Return fallback pricing if database is empty
    const fallbackPricing = new Map<VehicleType, VehiclePricing>([
      ['car', { vehicle_type: 'car', base_fee: 30, per_km_fee: 8, min_fee: 60 }],
      ['saloon', { vehicle_type: 'saloon', base_fee: 35, per_km_fee: 9, min_fee: 70 }],
      ['suv', { vehicle_type: 'suv', base_fee: 50, per_km_fee: 12, min_fee: 100 }],
      ['van', { vehicle_type: 'van', base_fee: 60, per_km_fee: 14, min_fee: 120 }],
      ['truck', { vehicle_type: 'truck', base_fee: 80, per_km_fee: 18, min_fee: 150 }],
      ['motorcycle', { vehicle_type: 'motorcycle', base_fee: 20, per_km_fee: 5, min_fee: 40 }],
      ['others', { vehicle_type: 'others', base_fee: 70, per_km_fee: 16, min_fee: 130 }],
    ]);
    pricingCache = fallbackPricing;
    cacheTimestamp = now;
    return fallbackPricing;
  }

  // Convert array to Map for efficient lookup
  const pricingMap = new Map<VehicleType, VehiclePricing>();
  for (const item of data) {
    pricingMap.set(item.vehicle_type as VehicleType, {
      vehicle_type: item.vehicle_type as VehicleType,
      base_fee: parseFloat(item.base_fee.toString()),
      per_km_fee: parseFloat(item.per_km_fee.toString()),
      min_fee: parseFloat(item.min_fee.toString()),
    });
  }

  // Update cache
  pricingCache = pricingMap;
  cacheTimestamp = now;

  return pricingMap;
}

/**
 * Get pricing for a specific vehicle type
 */
async function getPricingForVehicleType(
  vehicleType: VehicleType
): Promise<VehiclePricing | null> {
  const allPricing = await getPricingFromDatabase();
  return allPricing.get(vehicleType) || null;
}

/**
 * Calculate the estimated price for a towing service
 * @param distanceKm Distance in kilometers
 * @param vehicleType Type of vehicle
 * @returns Estimated price in GH₵
 */
export async function calculateEstimatedPrice(
  distanceKm: number,
  vehicleType: VehicleType
): Promise<number> {
  const pricing = await getPricingForVehicleType(vehicleType);

  if (!pricing) {
    logger.error(`No pricing found for vehicle type: ${vehicleType}`);
    throw new Error(`Pricing not available for vehicle type: ${vehicleType}`);
  }

  // Calculate: base_fee + (per_km_fee * distance)
  const calculatedPrice = pricing.base_fee + pricing.per_km_fee * distanceKm;

  // Apply minimum fee
  const finalPrice = Math.max(calculatedPrice, pricing.min_fee);

  // Round to 2 decimal places
  return Math.round(finalPrice * 100) / 100;
}

/**
 * Calculate the final price (may include additional charges)
 * @param distanceKm Distance in kilometers
 * @param vehicleType Type of vehicle
 * @param additionalCharges Any additional charges (waiting time, tolls, etc.)
 * @returns Final price in GH₵
 */
export async function calculateFinalPrice(
  distanceKm: number,
  vehicleType: VehicleType,
  additionalCharges: number = 0
): Promise<number> {
  const basePrice = await calculateEstimatedPrice(distanceKm, vehicleType);
  return Math.round((basePrice + additionalCharges) * 100) / 100;
}

/**
 * Get price breakdown for a towing service
 */
export interface PriceBreakdown {
  distanceKm: number;
  baseFee: number;
  perKmFee: number;
  basePrice: number;
  minimumPrice: number;
  additionalCharges: number;
  totalPrice: number;
  currency: string;
}

export async function getPriceBreakdown(
  distanceKm: number,
  vehicleType: VehicleType,
  additionalCharges: number = 0
): Promise<PriceBreakdown> {
  const pricing = await getPricingForVehicleType(vehicleType);

  if (!pricing) {
    throw new Error(`Pricing not available for vehicle type: ${vehicleType}`);
  }

  const calculatedBasePrice = pricing.base_fee + pricing.per_km_fee * distanceKm;
  const basePrice = Math.max(calculatedBasePrice, pricing.min_fee);
  const totalPrice = basePrice + additionalCharges;

  return {
    distanceKm,
    baseFee: pricing.base_fee,
    perKmFee: pricing.per_km_fee,
    basePrice: Math.round(basePrice * 100) / 100,
    minimumPrice: pricing.min_fee,
    additionalCharges,
    totalPrice: Math.round(totalPrice * 100) / 100,
    currency: CURRENCY_SYMBOL,
  };
}

/**
 * Clear pricing cache (useful after pricing updates)
 */
export function clearPricingCache(): void {
  pricingCache = null;
  cacheTimestamp = 0;
}

/**
 * Format price for display
 */
export function formatPrice(amount: number): string {
  return `${CURRENCY_SYMBOL}${amount.toFixed(2)}`;
}

/**
 * Get multiplier for vehicle type
 * Returns a relative multiplier (not used in direct price calculation but for reference)
 */
export function getVehicleMultiplier(vehicleType: VehicleType): number {
  const multipliers: Record<VehicleType, number> = {
    car: 1.0,
    saloon: 1.1,
    suv: 1.5,
    van: 1.8,
    truck: 2.5,
    motorcycle: 0.8,
    others: 2.0
  };
  return multipliers[vehicleType] || 1.0;
}
