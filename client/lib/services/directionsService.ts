/**
 * Directions Service
 * 
 * Uses Google Directions API to get actual road routes
 */

import { API_BASE_URL } from '@/lib/api/client';

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface Route {
  points: RoutePoint[];
  distance: number; // in meters
  duration: number; // in seconds
}

/**
 * Get route between two points using Google Directions API
 * Falls back to straight line if API fails
 */
export async function getRoute(
  origin: RoutePoint,
  destination: RoutePoint
): Promise<Route> {
  try {
    // Try to get route from backend (which uses Google Directions API)
    const response = await fetch(
      `${API_BASE_URL}/directions?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        return {
          points: data.data.points || [],
          distance: data.data.distance || 0,
          duration: data.data.duration || 0,
        };
      }
    }
  } catch (error) {
    console.error('Error fetching route from API:', error);
  }

  // Fallback: return straight line route
  return {
    points: [origin, destination],
    distance: calculateStraightDistance(origin, destination),
    duration: 0,
  };
}

/**
 * Calculate straight-line distance between two points (Haversine formula)
 */
function calculateStraightDistance(
  point1: RoutePoint,
  point2: RoutePoint
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.latitude * Math.PI) / 180) *
      Math.cos((point2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

