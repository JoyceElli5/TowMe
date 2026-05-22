/**
 * Directions Service
 *
 * Returns a road-following polyline between two points via Google Directions API.
 * Tries direct Google call first; falls back to backend proxy; final fallback is
 * the straight line.
 */

import { API_BASE_URL } from '@/lib/api/client';

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface Route {
  points: RoutePoint[];
  distance: number; // meters
  duration: number; // seconds
}

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || '';

/**
 * Decode a Google encoded polyline string into [{ latitude, longitude }].
 */
function decodePolyline(encoded: string): RoutePoint[] {
  const points: RoutePoint[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b = 0;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return points;
}

function straightLineDistance(a: RoutePoint, b: RoutePoint): number {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/**
 * Get road-following route. The polyline returned will follow real streets.
 */
export async function getRoute(origin: RoutePoint, destination: RoutePoint): Promise<Route> {
  // 1) Try Google Directions API directly (most reliable)
  if (GOOGLE_API_KEY) {
    try {
      const url =
        `https://maps.googleapis.com/maps/api/directions/json` +
        `?origin=${origin.latitude},${origin.longitude}` +
        `&destination=${destination.latitude},${destination.longitude}` +
        `&mode=driving&key=${GOOGLE_API_KEY}`;
      const resp = await fetch(url);
      const json = await resp.json();
      if (json.status === 'OK' && json.routes?.length) {
        const route = json.routes[0];
        const encoded = route.overview_polyline?.points;
        const points = encoded
          ? decodePolyline(encoded)
          : [origin, destination];
        const leg = route.legs?.[0];
        return {
          points,
          distance: leg?.distance?.value ?? 0,
          duration: leg?.duration?.value ?? 0,
        };
      }
      console.warn('Google Directions returned:', json.status);
    } catch (err) {
      console.warn('Direct Google Directions failed, falling back:', err);
    }
  }

  // 2) Backend proxy fallback
  try {
    const response = await fetch(
      `${API_BASE_URL}/directions?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data?.points?.length > 1) {
        return {
          points: data.data.points,
          distance: data.data.distance || 0,
          duration: data.data.duration || 0,
        };
      }
    }
  } catch (error) {
    console.error('Backend directions fallback failed:', error);
  }

  // 3) Final fallback: straight line
  return {
    points: [origin, destination],
    distance: straightLineDistance(origin, destination),
    duration: 0,
  };
}
