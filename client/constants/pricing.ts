/**
 * Pricing Configuration
 * 
 * Configurable pricing parameters for tow services.
 * Uses industry-standard formula: TOTAL COST = [Base Fare + (Distance × Per-Km Rate) + (Time × Per-Minute Rate)] × Vehicle Multiplier + Service Fee
 */

/** Base fare charged when tow request is accepted (GHS) */
export const BASE_FARE = 20;

/** Base price per kilometer for tow service (GHS) */
export const BASE_PRICE_PER_KM = 15;

/** Time rate per minute (GHS) */
export const TIME_RATE_PER_MINUTE = 0.50;

/** Platform/Service fee percentage (0-1, e.g., 0.10 = 10%) */
export const SERVICE_FEE_PERCENTAGE = 0.10;

/** Minimum price for any tow service */
export const MINIMUM_PRICE = 50;

/** Default currency symbol */
export const CURRENCY_SYMBOL = 'GH₵';

/** Vehicle type identifier */
export type VehicleType = 'car' | 'suv' | 'saloon' | 'van' | 'truck' | 'motorcycle' | 'others';

/** Vehicle option configuration */
export interface VehicleOption {
  id: VehicleType;
  label: string;
  icon: string;
  priceMultiplier: number;
}

/** 
 * Available vehicle options with icons and price multipliers.
 * Price multipliers adjust the base price based on vehicle size/type.
 */
export const VEHICLE_OPTIONS: VehicleOption[] = [
  { id: 'car', label: 'Car', icon: '🚗', priceMultiplier: 1.0 },
  { id: 'suv', label: 'SUV', icon: '🚙', priceMultiplier: 1.3 },
  { id: 'saloon', label: 'Saloon', icon: '🚘', priceMultiplier: 1.1 },
  { id: 'van', label: 'Van', icon: '🚐', priceMultiplier: 1.5 },
  { id: 'truck', label: 'Truck', icon: '🛻', priceMultiplier: 2.0 },
  { id: 'motorcycle', label: 'Motorcycle', icon: '🏍️', priceMultiplier: 0.7 },
  { id: 'others', label: 'Others', icon: '🚜', priceMultiplier: 1.8 },
];

/**
 * Calculate estimated price for tow service using industry-standard formula.
 * Formula: TOTAL COST = [Base Fare + (Distance × Per-Km Rate) + (Time × Per-Minute Rate)] × Vehicle Multiplier + Service Fee
 * 
 * @param distanceKm - Distance in kilometers
 * @param durationMinutes - Tow duration in minutes (default: 0)
 * @param vehicleType - Type of vehicle
 * @returns Estimated price or null if vehicle type not found
 */
export function calculateEstimatedPrice(
  distanceKm: number,
  vehicleType: VehicleType | null,
  durationMinutes: number = 0
): number | null {
  if (!vehicleType) {
    return null;
  }

  const vehicleOption = VEHICLE_OPTIONS.find(v => v.id === vehicleType);
  if (!vehicleOption) {
    return null;
  }

  // Step 1: Calculate base amount (before multiplier)
  const baseFare = BASE_FARE;
  const distanceCharge = distanceKm * BASE_PRICE_PER_KM;
  const timeCharge = durationMinutes * TIME_RATE_PER_MINUTE;
  const subtotalBeforeMultiplier = baseFare + distanceCharge + timeCharge;

  // Step 2: Apply vehicle multiplier
  const multiplier = vehicleOption.priceMultiplier;
  const subtotalAfterMultiplier = subtotalBeforeMultiplier * multiplier;

  // Step 3: Add service fee
  const serviceFee = subtotalAfterMultiplier * SERVICE_FEE_PERCENTAGE;
  const totalCost = subtotalAfterMultiplier + serviceFee;

  // Step 4: Apply minimum price
  const calculatedPrice = Math.max(totalCost, MINIMUM_PRICE);

  return calculatedPrice;
}
