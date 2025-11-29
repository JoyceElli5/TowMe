/**
 * Distance Calculator Utility
 * Uses the Haversine formula to calculate distance between two coordinates
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate the distance between two coordinates using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lng1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lng2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = EARTH_RADIUS_KM * c;

  // Round to 2 decimal places
  return Math.round(distance * 100) / 100;
}

/**
 * Calculate estimated travel time based on distance
 * Assumes average speed of 30 km/h in urban areas
 * @param distanceKm Distance in kilometers
 * @returns Estimated time in minutes
 */
export function calculateEstimatedTime(distanceKm: number): number {
  const averageSpeedKmH = 30;
  const timeHours = distanceKm / averageSpeedKmH;
  const timeMinutes = Math.ceil(timeHours * 60);
  return timeMinutes;
}

/**
 * Check if a coordinate is valid
 * @param lat Latitude
 * @param lng Longitude
 * @returns True if valid
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
