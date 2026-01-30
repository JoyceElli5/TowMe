/**
 * Pricing Configuration
 * 
 * UI constants only - all pricing comes from database via pricingService
 */

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

/** 
 * Available vehicle options (UI display only)
 * Pricing comes from vehicle_pricing table via pricingService
 */
export const VEHICLE_OPTIONS: VehicleOption[] = [
  { id: 'car', label: 'Car', icon: '🚗' },
  { id: 'suv', label: 'SUV', icon: '🚙' },
  { id: 'saloon', label: 'Saloon', icon: '🚘' },
  { id: 'van', label: 'Van', icon: '🚐' },
  { id: 'truck', label: 'Truck', icon: '🛻' },
  { id: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
  { id: 'others', label: 'Others', icon: '🚜' },
];

// Note: calculateEstimatedPrice() has been moved to lib/services/pricingService.ts
// Import and use: import { calculateEstimatedPrice } from '@/lib/services/pricingService';
