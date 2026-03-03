import * as Location from 'expo-location';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationData {
  coordinates: Coordinates;
  address: string;
}

// Simple in-memory rate limiting / caching for reverse geocoding
const REVERSE_GEOCODE_MIN_INTERVAL_MS = 5000; // 5s between API calls
let lastReverseGeocodeTime = 0;
let lastReverseGeocodeCoords: Coordinates | null = null;
let lastReverseGeocodeAddress: string | null = null;

/**
 * Request location permissions
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    // First check if permission is already granted
    const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
    if (currentStatus === 'granted') {
      return true;
    }

    // Request permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    console.log('Location permission status:', status);
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
}

/**
 * Get current device location
 */
export async function getCurrentLocation(): Promise<Coordinates | null> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    };
  } catch (error: any) {
    console.error('Error getting current location:', error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to address
 * - Applies a simple rate limit to avoid hitting provider limits
 * - Caches the last successful result for identical coordinates
 */
export async function reverseGeocode(coordinates: Coordinates): Promise<string> {
  const now = Date.now();
  const fallback = `${coordinates.lat}, ${coordinates.lng}`;

  // If we recently reverse-geocoded the same coordinates, return cached address
  if (
    lastReverseGeocodeCoords &&
    Math.abs(lastReverseGeocodeCoords.lat - coordinates.lat) < 1e-5 &&
    Math.abs(lastReverseGeocodeCoords.lng - coordinates.lng) < 1e-5 &&
    lastReverseGeocodeAddress
  ) {
    return lastReverseGeocodeAddress;
  }

  // Simple throttle: if called too frequently, skip external call and return fallback
  if (now - lastReverseGeocodeTime < REVERSE_GEOCODE_MIN_INTERVAL_MS) {
    return fallback;
  }

  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude: coordinates.lat,
      longitude: coordinates.lng,
    });

    lastReverseGeocodeTime = Date.now();

    if (addresses && addresses.length > 0) {
      const addr = addresses[0];
      const parts = [
        addr.street,
        addr.district,
        addr.city,
        addr.region,
        addr.country,
      ].filter(Boolean);
      const formatted = parts.join(', ') || fallback;

      lastReverseGeocodeCoords = coordinates;
      lastReverseGeocodeAddress = formatted;

      return formatted;
    }

    return fallback;
  } catch (error: any) {
    console.error('Error reverse geocoding:', error);
    return fallback;
  }
}

/**
 * Get current location with address
 */
export async function getCurrentLocationWithAddress(): Promise<LocationData | null> {
  try {
    const coordinates = await getCurrentLocation();
    if (!coordinates) {
      return null;
    }

    const address = await reverseGeocode(coordinates);
    return { coordinates, address };
  } catch (error: any) {
    console.error('Error getting location with address:', error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Geocode address to coordinates
 */
export async function geocode(address: string): Promise<Coordinates | null> {
  try {
    const results = await Location.geocodeAsync(address);
    if (results && results.length > 0) {
      const location = results[0];
      return {
        lat: location.latitude,
        lng: location.longitude,
      };
    }
    return null;
  } catch (error: any) {
    console.error('Error geocoding address:', error);
    return null;
  }
}

