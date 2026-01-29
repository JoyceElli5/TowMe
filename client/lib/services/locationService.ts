import * as Location from 'expo-location';

export interface Coordinates {
    lat: number;
    lng: number;
}

export interface LocationData {
    coordinates: Coordinates;
    address: string;
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
 */
export async function reverseGeocode(
    coordinates: Coordinates
): Promise<string> {
    try {
        const addresses = await Location.reverseGeocodeAsync({
            latitude: coordinates.lat,
            longitude: coordinates.lng,
        });

        if (addresses && addresses.length > 0) {
            const addr = addresses[0];
            const parts = [
                addr.street,
                addr.district,
                addr.city,
                addr.region,
                addr.country,
            ].filter(Boolean);
            return parts.join(', ') || `${coordinates.lat}, ${coordinates.lng}`;
        }

        return `${coordinates.lat}, ${coordinates.lng}`;
    } catch (error: any) {
        console.error('Error reverse geocoding:', error);
        return `${coordinates.lat}, ${coordinates.lng}`;
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
