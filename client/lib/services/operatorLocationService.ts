/**
 * Operator Location Service
 *
 * Tracks operator's location and updates it in the database via API.
 *
 * Resilience notes:
 * - Skips a PATCH if the previous one is still in flight (prevents request pile-up).
 * - Uses AbortController with a 15 s timeout per request.
 * - Throttles repeated "Network request failed" log lines so the console isn't flooded
 *   when the backend is sleeping or the network is flaky.
 * - Retries silently — location tracking continues regardless of API failures.
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
 * Start tracking operator location and updating it in the database.
 */
export async function startLocationTracking(
  operatorId: string,
  onLocationUpdate?: (location: OperatorLocation) => void
): Promise<() => void> {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    throw new Error('Location permission not granted');
  }

  let isTracking = true;
  let watchSubscription: Location.LocationSubscription | null = null;

  // Drop a PATCH if the previous one hasn't returned yet — avoids request pile-up.
  let inFlight = false;
  // Don't log the same error every 5 s when the backend is down.
  let lastErrorLogAt = 0;
  const ERROR_LOG_THROTTLE_MS = 60_000; // log at most once a minute

  const patchLocation = async (loc: OperatorLocation) => {
    if (inFlight) return;
    inFlight = true;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const token = await getAccessToken();
      if (!token) {
        // No auth yet — skip silently, will resume after login
        return;
      }

      await fetch(`${API_BASE_URL}/operators/${operatorId}/location`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude: loc.latitude,
          longitude: loc.longitude,
          heading: loc.heading,
        }),
        signal: controller.signal,
      });
    } catch (error: any) {
      const now = Date.now();
      if (now - lastErrorLogAt > ERROR_LOG_THROTTLE_MS) {
        lastErrorLogAt = now;
        const reason = error?.name === 'AbortError' ? 'request timed out' : (error?.message || 'network error');
        console.warn(`[Location] Update failed (${reason}). Will keep retrying silently.`);
      }
    } finally {
      clearTimeout(timeout);
      inFlight = false;
    }
  };

  const updateLocation = (location: Location.LocationObject) => {
    if (!isTracking) return;

    const operatorLocation: OperatorLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      heading: location.coords.heading || null,
      timestamp: new Date().toISOString(),
    };

    if (onLocationUpdate) onLocationUpdate(operatorLocation);

    // Fire-and-forget; never throw out of the watcher.
    patchLocation(operatorLocation);
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

  return () => {
    isTracking = false;
    if (watchSubscription) {
      watchSubscription.remove();
    }
  };
}

/**
 * Get current operator location once (no tracking).
 */
export async function getCurrentOperatorLocation(): Promise<OperatorLocation | null> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return null;

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
