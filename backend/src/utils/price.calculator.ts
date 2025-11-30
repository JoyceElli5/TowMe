/**
 * Price Calculator Utility
 * Calculates estimated and final prices for towing services
 */

import {
  BASE_PRICE_PER_KM,
  MINIMUM_PRICE,
  VEHICLE_MULTIPLIERS,
  CURRENCY_SYMBOL,
} from '../config/constants';
import type { VehicleType } from '../types/database.types';

/**
 * Get the price multiplier for a vehicle type
 */
export function getVehicleMultiplier(vehicleType: VehicleType): number {
  return VEHICLE_MULTIPLIERS[vehicleType] || 1.0;
}

/**
 * Calculate the estimated price for a towing service
 * @param distanceKm Distance in kilometers
 * @param vehicleType Type of vehicle
 * @returns Estimated price in GH₵
 */
export function calculateEstimatedPrice(
  distanceKm: number,
  vehicleType: VehicleType
): number {
  const multiplier = getVehicleMultiplier(vehicleType);
  const calculatedPrice = distanceKm * BASE_PRICE_PER_KM * multiplier;
  
  // Ensure minimum price
  const finalPrice = Math.max(calculatedPrice, MINIMUM_PRICE);
  
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
export function calculateFinalPrice(
  distanceKm: number,
  vehicleType: VehicleType,
  additionalCharges: number = 0
): number {
  const basePrice = calculateEstimatedPrice(distanceKm, vehicleType);
  return Math.round((basePrice + additionalCharges) * 100) / 100;
}

/**
 * Get price breakdown for a towing service
 */
export interface PriceBreakdown {
  distanceKm: number;
  basePricePerKm: number;
  vehicleMultiplier: number;
  basePrice: number;
  minimumPrice: number;
  additionalCharges: number;
  totalPrice: number;
  currency: string;
}

export function getPriceBreakdown(
  distanceKm: number,
  vehicleType: VehicleType,
  additionalCharges: number = 0
): PriceBreakdown {
  const multiplier = getVehicleMultiplier(vehicleType);
  const calculatedBasePrice = distanceKm * BASE_PRICE_PER_KM * multiplier;
  const basePrice = Math.max(calculatedBasePrice, MINIMUM_PRICE);
  const totalPrice = basePrice + additionalCharges;

  return {
    distanceKm,
    basePricePerKm: BASE_PRICE_PER_KM,
    vehicleMultiplier: multiplier,
    basePrice: Math.round(basePrice * 100) / 100,
    minimumPrice: MINIMUM_PRICE,
    additionalCharges,
    totalPrice: Math.round(totalPrice * 100) / 100,
    currency: CURRENCY_SYMBOL,
  };
}

/**
 * Format price for display
 */
export function formatPrice(amount: number): string {
  return `${CURRENCY_SYMBOL}${amount.toFixed(2)}`;
}
