/**
 * Location Service
 * Handles location permissions, current location, and geocoding
 */

import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationResult {
  coords: Coordinates;
  address?: string;
}

/**
 * Request location permissions
 */
export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

/**
 * Get current device location
 */
export async function getCurrentLocation(): Promise<LocationResult> {
  // Request permission
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    throw new Error('Location permission denied');
  }

  // Get current position
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const coords = {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };

  // Try to reverse geocode
  let address: string | undefined;
  try {
    const addresses = await Location.reverseGeocodeAsync(coords);
    if (addresses && addresses.length > 0) {
      const addr = addresses[0];
      address = [
        addr.street,
        addr.city,
        addr.region,
        addr.country,
      ]
        .filter(Boolean)
        .join(', ');
    }
  } catch (error) {
    console.warn('Reverse geocoding failed:', error);
    // Fallback to coordinates
    address = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
  }

  return { coords, address };
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(
  coords: Coordinates
): Promise<string | null> {
  try {
    const addresses = await Location.reverseGeocodeAsync(coords);
    if (addresses && addresses.length > 0) {
      const addr = addresses[0];
      return [
        addr.street,
        addr.city,
        addr.region,
        addr.country,
      ]
        .filter(Boolean)
        .join(', ');
    }
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
  }
  return null;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in kilometers
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371; // Earth's radius in kilometers

  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);

  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
