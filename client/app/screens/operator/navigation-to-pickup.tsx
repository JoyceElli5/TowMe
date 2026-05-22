/**
 * Navigation to Pickup Screen
 * 
 * Shows navigation to the pickup location.
 * Displays map and directions to customer with real-time location tracking.
 */

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { operatorSafeBack } from '@/lib/navigation';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '@/hooks/use-toast';
import { ApiError, getCurrentUser, getRequestById, startRequest, type TowingRequest } from '@/lib/api';
import { getRoute, type RoutePoint } from '@/lib/services/directionsService';
import { calculateDistance, looksLikeCoords, reverseGeocode } from '@/lib/services/locationService';
import { getCurrentOperatorLocation, startLocationTracking, type OperatorLocation } from '@/lib/services/operatorLocationService';

export default function NavigationToPickupScreen() {
  const params = useLocalSearchParams<{ requestId: string }>();
  const { showToast } = useToast();

  const [request, setRequest] = useState<TowingRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [operatorLocation, setOperatorLocation] = useState<OperatorLocation | null>(null);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [eta, setEta] = useState<number>(0);
  const [isStarting, setIsStarting] = useState(false);
  const [pickupDisplayAddress, setPickupDisplayAddress] = useState<string>('');

  // Fetch request details
  useEffect(() => {
    const fetchRequest = async () => {
      if (!params.requestId) {
        Alert.alert('Error', 'Request ID is missing');
        operatorSafeBack();
        return;
      }

      try {
        const requestData = await getRequestById(params.requestId);
        setRequest(requestData);

        // Resolve the pickup address. If it's missing or stored as raw "lat, lng",
        // reverse-geocode to a real place name.
        const saved = requestData.pickupAddress?.trim() || '';
        if (saved && !looksLikeCoords(saved)) {
          setPickupDisplayAddress(saved);
        } else if (requestData.pickupLat && requestData.pickupLng) {
          setPickupDisplayAddress('Resolving address…');
          const nice = await reverseGeocode({
            lat: requestData.pickupLat,
            lng: requestData.pickupLng,
          });
          setPickupDisplayAddress(nice);
        }

        // Set initial map region
        if (requestData.pickupLat && requestData.pickupLng) {
          setMapRegion({
            latitude: requestData.pickupLat,
            longitude: requestData.pickupLng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      } catch (error) {
        console.error('Failed to fetch request:', error);
        if (error instanceof ApiError) {
          if (error.status === 404) {
            Alert.alert('Request not found', 'This tow request is no longer available.', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          } else if (error.status === 401) {
            Alert.alert('Session expired', 'Please sign in again.', [
              { text: 'OK', onPress: () => router.replace('/screens/auth/login-screen') },
            ]);
          } else {
            Alert.alert('Error', error.message || 'Failed to load request details');
            router.back();
          }
        } else {
          Alert.alert('Error', 'Failed to load request details');
          router.back();
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequest();
  }, [params.requestId]);

  // Start location tracking
  useEffect(() => {
    let stopTracking: (() => void) | null = null;

    const initTracking = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) return;

        // Get initial location
        const initialLocation = await getCurrentOperatorLocation();
        if (initialLocation) {
          setOperatorLocation(initialLocation);
        }

        // Start continuous tracking
        stopTracking = await startLocationTracking(user.id, (location) => {
          setOperatorLocation(location);
        });
      } catch (error) {
        console.error('Error starting location tracking:', error);
        showToast('Location tracking failed', 'error');
      }
    };

    initTracking();

    return () => {
      if (stopTracking) {
        stopTracking();
      }
    };
  }, [showToast]);

  // Update route when operator location or request changes
  useEffect(() => {
    if (!operatorLocation || !request) return;

    const updateRoute = async () => {
      try {
        const route = await getRoute(
          { latitude: operatorLocation.latitude, longitude: operatorLocation.longitude },
          { latitude: request.pickupLat, longitude: request.pickupLng }
        );
        setRoutePoints(route.points);

        // Prefer real road distance + ETA from Directions API; fall back to haversine.
        const haversineKm = calculateDistance(
          operatorLocation.latitude,
          operatorLocation.longitude,
          request.pickupLat,
          request.pickupLng
        );
        const km = route.distance > 0 ? route.distance / 1000 : haversineKm;
        setDistance(km);
        setEta(route.duration > 0 ? Math.max(1, Math.round(route.duration / 60)) : Math.max(1, Math.round(km * 2.5)));

        // Update map region to show both operator and pickup
        const allCoords = [
          { latitude: operatorLocation.latitude, longitude: operatorLocation.longitude },
          { latitude: request.pickupLat, longitude: request.pickupLng },
        ];
        const minLat = Math.min(...allCoords.map(c => c.latitude));
        const maxLat = Math.max(...allCoords.map(c => c.latitude));
        const minLng = Math.min(...allCoords.map(c => c.longitude));
        const maxLng = Math.max(...allCoords.map(c => c.longitude));

        setMapRegion({
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.01),
          longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.01),
        });
      } catch (error) {
        console.error('Error updating route:', error);
      }
    };

    updateRoute();
  }, [operatorLocation, request]);

  const handleArrived = async () => {
    if (!params.requestId) return;

    setIsStarting(true);
    try {
      await startRequest(params.requestId);
      router.replace({
        pathname: '/screens/operator/arrived-at-pickup',
        params: { requestId: params.requestId },
      });
    } catch (error) {
      console.error('Failed to start request:', error);
      showToast('Failed to mark as arrived', 'error');
    } finally {
      setIsStarting(false);
    }
  };

  const handleCall = () => {
    if (request?.user?.phone) {
      Linking.openURL(`tel:${request.user.phone}`);
    }
  };

  const handleMessage = () => {
    if (params.requestId) {
      router.push({
        pathname: '/screens/operator/chat-screen',
        params: { requestId: params.requestId },
      });
    }
  };

  const getUserInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading || !request) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#003554" />
          <Text style={styles.loadingText}>Loading navigation...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Map */}
      <MapView
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        region={mapRegion || undefined}
        showsUserLocation
      >
        {/* Pickup Location Marker */}
        <Marker
          coordinate={{ latitude: request.pickupLat, longitude: request.pickupLng }}
          title="Pickup Location"
        >
          <View style={styles.customerMarker}>
            <Ionicons name="location" size={24} color="#3B82F6" />
          </View>
        </Marker>

        {/* Operator Location Marker */}
        {operatorLocation && (
          <Marker
            coordinate={{ latitude: operatorLocation.latitude, longitude: operatorLocation.longitude }}
            title="Your Location"
          >
            <View style={styles.operatorMarker}>
              <Ionicons name="car" size={20} color="#10B981" />
            </View>
          </Marker>
        )}

        {/* Route Polyline */}
        {routePoints.length > 0 && (
          <Polyline
            coordinates={routePoints}
            strokeColor="#003554"
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>

      {/* Navigation Header */}
      <SafeAreaView style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => operatorSafeBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.navInfo}>
          <Text style={styles.navDistance}>{distance.toFixed(1)} km</Text>
          <Text style={styles.navEta}>~{eta} min</Text>
        </View>
      </SafeAreaView>

      {/* Bottom Card */}
      <View style={styles.bottomCard}>
        <View style={styles.customerInfo}>
          <View style={styles.customerAvatar}>
            <Text style={styles.avatarText}>{getUserInitials(request.user?.fullName)}</Text>
          </View>
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>{request.user?.fullName || 'Unknown User'}</Text>
            <Text style={styles.pickupAddress} numberOfLines={2}>
              {pickupDisplayAddress || request.pickupAddress || 'Loading…'}
            </Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.circularButton, { backgroundColor: '#bae6fd' }]} onPress={handleMessage}>
              <Ionicons name="chatbubble" size={20} color="#003554" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.circularButton, { backgroundColor: '#dcfce7' }]} onPress={handleCall}>
              <Ionicons name="call" size={20} color="#10B981" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.arrivedButton, isStarting && styles.buttonDisabled]}
          onPress={handleArrived}
          activeOpacity={0.8}
          disabled={isStarting}
        >
          {isStarting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.arrivedButtonText}>I&apos;ve Arrived</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  map: {
    flex: 1,
  },
  customerMarker: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backIcon: {
    fontSize: 20,
    color: '#111827',
  },
  navInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#003554',
    marginHorizontal: 12,
    borderRadius: 22,
    paddingVertical: 10,
    gap: 16,
  },
  navDistance: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  navEta: {
    fontSize: 16,
    fontWeight: '600',
    color: '#bae6fd',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#003554',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  pickupAddress: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  circularButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrivedButton: {
    height: 56,
    backgroundColor: '#003554',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#003554',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  arrivedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  operatorMarker: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
