import * as Location from 'expo-location';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationData {
  coordinates: Coordinates;
  address: string;
}

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || '';

// Cache reverse geocoding results to avoid hammering the API
let lastReverseGeocodeTime = 0;
let lastReverseGeocodeCoords: Coordinates | null = null;
let lastReverseGeocodeAddress: string | null = null;

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
    if (currentStatus === 'granted') return true;
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
}

export async function getCurrentLocation(): Promise<Coordinates | null> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) throw new Error('Location permission denied');
    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: location.coords.latitude, lng: location.coords.longitude };
  } catch (error: any) {
    console.error('Error getting current location:', error);
    return null;
  }
}

/**
 * Check if a string looks like raw "lat, lng" coordinates rather than an address.
 */
export function looksLikeCoords(text: string | null | undefined): boolean {
  if (!text) return false;
  return /^-?\d{1,3}\.\d+\s*,\s*-?\d{1,3}\.\d+$/.test(text.trim());
}

/**
 * Reverse-geocode coordinates to a human-readable address.
 * Tries Google Geocoding API first (best quality), then expo-location, then raw coords.
 */
export async function reverseGeocode(coordinates: Coordinates): Promise<string> {
  const fallback = `${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`;

  // Cache hit?
  if (
    lastReverseGeocodeCoords &&
    Math.abs(lastReverseGeocodeCoords.lat - coordinates.lat) < 1e-5 &&
    Math.abs(lastReverseGeocodeCoords.lng - coordinates.lng) < 1e-5 &&
    lastReverseGeocodeAddress
  ) {
    return lastReverseGeocodeAddress;
  }

  // 1) Try Google Geocoding API (most accurate, gives place names like "Accra Mall")
  if (GOOGLE_API_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates.lat},${coordinates.lng}&key=${GOOGLE_API_KEY}`;
      const resp = await fetch(url);
      const json = await resp.json();
      if (json.status === 'OK' && json.results?.length) {
        // Prefer establishments / points-of-interest, fall back to first formatted address
        const poi = json.results.find((r: any) =>
          r.types?.some((t: string) => ['establishment', 'point_of_interest', 'premise'].includes(t))
        );
        const address = (poi || json.results[0]).formatted_address;
        lastReverseGeocodeCoords = coordinates;
        lastReverseGeocodeAddress = address;
        lastReverseGeocodeTime = Date.now();
        return address;
      }
    } catch (err) {
      console.warn('Google reverse geocode failed, falling back:', err);
    }
  }

  // 2) Fall back to Expo's local geocoder
  const now = Date.now();
  if (now - lastReverseGeocodeTime < 3000) return fallback;
  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude: coordinates.lat,
      longitude: coordinates.lng,
    });
    lastReverseGeocodeTime = Date.now();
    if (addresses?.length) {
      const a = addresses[0];
      const parts = [a.name, a.street, a.district, a.city, a.region, a.country].filter(Boolean);
      const formatted = parts.join(', ') || fallback;
      lastReverseGeocodeCoords = coordinates;
      lastReverseGeocodeAddress = formatted;
      return formatted;
    }
  } catch (error: any) {
    console.error('Error reverse geocoding:', error);
  }

  return fallback;
}

export async function getCurrentLocationWithAddress(): Promise<LocationData | null> {
  try {
    const coordinates = await getCurrentLocation();
    if (!coordinates) return null;
    const address = await reverseGeocode(coordinates);
    return { coordinates, address };
  } catch (error: any) {
    console.error('Error getting location with address:', error);
    return null;
  }
}

/**
 * Haversine distance in kilometers.
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Forward-geocode an address string.
 * Google first, expo-location fallback.
 */
export async function geocode(address: string): Promise<Coordinates | null> {
  if (GOOGLE_API_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`;
      const resp = await fetch(url);
      const json = await resp.json();
      if (json.status === 'OK' && json.results?.length) {
        const loc = json.results[0].geometry.location;
        return { lat: loc.lat, lng: loc.lng };
      }
    } catch (err) {
      console.warn('Google geocode failed, falling back:', err);
    }
  }

  try {
    const results = await Location.geocodeAsync(address);
    if (results?.length) {
      return { lat: results[0].latitude, lng: results[0].longitude };
    }
  } catch (error: any) {
    console.error('Error geocoding address:', error);
  }
  return null;
}

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetail {
  placeId: string;
  address: string;
  name: string;
  lat: number;
  lng: number;
}

/**
 * Get place autocomplete suggestions.
 * Calls Google Places API directly from the client (key restricted in Google Cloud).
 * Falls back to the backend proxy if the direct call fails.
 */
export async function getPlacePredictions(
  input: string,
  userLocation?: Coordinates
): Promise<PlacePrediction[]> {
  if (!input || input.trim().length < 2) return [];

  // 1) Direct Google call (fastest, works regardless of backend status)
  if (GOOGLE_API_KEY) {
    try {
      const params = new URLSearchParams({
        input: input.trim(),
        key: GOOGLE_API_KEY,
        components: 'country:gh',
        language: 'en',
      });
      if (userLocation) {
        params.set('location', `${userLocation.lat},${userLocation.lng}`);
        params.set('radius', '50000');
      }
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`;
      const resp = await fetch(url);
      const json = await resp.json();
      if (json.status === 'OK' || json.status === 'ZERO_RESULTS') {
        return (json.predictions || []).map((p: any) => ({
          placeId: p.place_id,
          description: p.description,
          mainText: p.structured_formatting?.main_text || p.description,
          secondaryText: p.structured_formatting?.secondary_text || '',
        }));
      }
      console.warn('Google Places error:', json.status, json.error_message);
    } catch (err) {
      console.warn('Direct Google Places failed, trying backend proxy:', err);
    }
  }

  // 2) Backend proxy fallback
  try {
    const { api } = await import('@/lib/api/client');
    const params: Record<string, string> = { input: input.trim() };
    if (userLocation) {
      params.lat = String(userLocation.lat);
      params.lng = String(userLocation.lng);
    }
    const response = await api.get<PlacePrediction[]>('/places/autocomplete', params);
    return response.success && response.data ? response.data : [];
  } catch {
    return [];
  }
}

/**
 * Get place details (lat/lng) for a placeId.
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetail | null> {
  if (GOOGLE_API_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address,name&key=${GOOGLE_API_KEY}`;
      const resp = await fetch(url);
      const json = await resp.json();
      if (json.status === 'OK') {
        return {
          placeId,
          address: json.result.formatted_address,
          name: json.result.name,
          lat: json.result.geometry.location.lat,
          lng: json.result.geometry.location.lng,
        };
      }
    } catch (err) {
      console.warn('Direct Google Place Details failed, trying backend:', err);
    }
  }

  try {
    const { api } = await import('@/lib/api/client');
    const response = await api.get<PlaceDetail>('/places/details', { placeId });
    if (response.success && response.data) return response.data;
  } catch { /* ignore */ }
  return null;
}
