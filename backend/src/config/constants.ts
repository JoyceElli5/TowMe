

// Pricing constants (aligned with frontend)
export const BASE_PRICE_PER_KM = 15;
export const MINIMUM_PRICE = 50;
export const CURRENCY_SYMBOL = 'GH₵';

// Vehicle type multipliers
export const VEHICLE_MULTIPLIERS: Record<string, number> = {
  car: 1.0,
  suv: 1.3,
  saloon: 1.1,
  van: 1.5,
  truck: 2.0,
  motorcycle: 0.7,
  others: 1.8,
};

// Request status constants
export const REQUEST_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// User role constants
export const USER_ROLES = {
  VEHICLE_OWNER: 'vehicle_owner',
  TOW_OPERATOR: 'tow_operator',
} as const;

// Rating constants
export const RATING = {
  MIN: 1,
  MAX: 5,
};

// Inspection photo limits
export const INSPECTION_PHOTOS = {
  MIN: 3,
  MAX: 10,
};

// Ghana phone number prefixes
export const GHANA_PHONE_PREFIXES = ['024', '054', '055', '059', '020', '050', '027'];

// Request timeout in minutes
export const REQUEST_AUTO_CANCEL_MINUTES = 10;
