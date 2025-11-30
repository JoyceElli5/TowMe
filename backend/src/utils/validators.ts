/**
 * Validators Utility
 * Input validation functions for the API
 */

import { GHANA_PHONE_PREFIXES, RATING } from '../config/constants';

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Ghana phone number format
 * Valid prefixes: 024, 054, 055, 059, 020, 050, 027
 */
export function isValidGhanaPhone(phone: string): boolean {
  // Remove any non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check if it starts with country code
  let phoneNumber = cleanPhone;
  if (cleanPhone.startsWith('233')) {
    phoneNumber = '0' + cleanPhone.substring(3);
  } else if (cleanPhone.startsWith('+233')) {
    phoneNumber = '0' + cleanPhone.substring(4);
  }
  
  // Should be 10 digits
  if (phoneNumber.length !== 10) {
    return false;
  }
  
  // Check if starts with valid prefix
  const prefix = phoneNumber.substring(0, 3);
  return GHANA_PHONE_PREFIXES.includes(prefix);
}

/**
 * Format phone number to standard format
 */
export function formatPhoneNumber(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.startsWith('233')) {
    return '+' + cleanPhone;
  } else if (cleanPhone.startsWith('0')) {
    return '+233' + cleanPhone.substring(1);
  }
  
  return phone;
}

/**
 * Validate password strength
 * Minimum 6 characters
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

/**
 * Validate rating value (1-5)
 */
export function isValidRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= RATING.MIN && rating <= RATING.MAX;
}

/**
 * Validate coordinates
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Validate vehicle type
 */
const VALID_VEHICLE_TYPES = ['car', 'suv', 'saloon', 'van', 'truck', 'motorcycle', 'others'];
export function isValidVehicleType(type: string): boolean {
  return VALID_VEHICLE_TYPES.includes(type);
}

/**
 * Validate request status
 */
const VALID_STATUSES = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'];
export function isValidRequestStatus(status: string): boolean {
  return VALID_STATUSES.includes(status);
}

/**
 * Validate user role
 */
const VALID_ROLES = ['vehicle_owner', 'tow_operator'];
export function isValidUserRole(role: string): boolean {
  return VALID_ROLES.includes(role);
}
