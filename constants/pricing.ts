/**
 * Pricing Configuration
 * 
 * Configurable pricing parameters for tow services.
 */

/** Base price per kilometer for tow service */
export const BASE_PRICE_PER_KM = 15;

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
 * Calculate estimated price for tow service.
 * @param distanceKm - Distance in kilometers
 * @param vehicleType - Type of vehicle
 * @returns Estimated price or null if vehicle type not found
 */
export function calculateEstimatedPrice(
  distanceKm: number,
  vehicleType: VehicleType | null
): number | null {
  if (!vehicleType) {
    return null;
  }

  const vehicleOption = VEHICLE_OPTIONS.find(v => v.id === vehicleType);
  if (!vehicleOption) {
    return null;
  }

  const multiplier = vehicleOption.priceMultiplier;
  const calculatedPrice = Math.max(
    distanceKm * BASE_PRICE_PER_KM * multiplier,
    MINIMUM_PRICE
  );

  return calculatedPrice;
}
