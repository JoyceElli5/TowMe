/**
 * Operator Location Service
 * 
 * Tracks operator's location and updates it in the database
 */

import * as Location from 'expo-location';
import { API_BASE_URL, getAccessToken } from '@/lib/api';

export interface OperatorLocation {
  latitude: number;
  longitude: number;
  heading: number | null;
  timestamp: string;
}

/**
 * Request location permissions
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
}

/**
 * Start tracking operator location and updating it in the database
 */
export async function startLocationTracking(
  operatorId: string,
  onLocationUpdate?: (location: OperatorLocation) => void
): Promise<() => void> {
  // Request permissions
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    throw new Error('Location permission not granted');
  }

  let isTracking = true;
  let watchSubscription: Location.LocationSubscription | null = null;

  const updateLocation = async (location: Location.LocationObject) => {
    if (!isTracking) return;

    const operatorLocation: OperatorLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      heading: location.coords.heading || null,
      timestamp: new Date().toISOString(),
    };

    // Call callback if provided
    if (onLocationUpdate) {
      onLocationUpdate(operatorLocation);
    }

    // Update location in database via API
    try {
      const token = await getAccessToken();
      await fetch(`${API_BASE_URL}/operators/${operatorId}/location`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude: operatorLocation.latitude,
          longitude: operatorLocation.longitude,
          heading: operatorLocation.heading,
        }),
      });
    } catch (error) {
      console.error('Error updating operator location:', error);
      // Don't throw - continue tracking even if update fails
    }
  };

  // Watch position with high accuracy for navigation
  watchSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 5000, // Update every 5 seconds
      distanceInterval: 10, // Or every 10 meters
    },
    updateLocation
  );

  // Return stop function
  return () => {
    isTracking = false;
    if (watchSubscription) {
      watchSubscription.remove();
    }
  };
}

/**
 * Get current operator location
 */
export async function getCurrentOperatorLocation(): Promise<OperatorLocation | null> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      heading: location.coords.heading || null,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
}

