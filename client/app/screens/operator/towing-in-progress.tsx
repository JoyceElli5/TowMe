/**
 * Towing in Progress Screen
 * 
 * Shows active towing with navigation to destination.
 * Displays progress and allows completion confirmation.
 */

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getRequestById, completeRequest, type TowingRequest } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { getRoute, type RoutePoint } from '@/lib/services/directionsService';
import { getCurrentOperatorLocation, type OperatorLocation } from '@/lib/services/operatorLocationService';
import { calculateDistance } from '@/lib/services/locationService';

export default function TowingInProgressScreen() {
  const params = useLocalSearchParams<{ requestId: string }>();
  const { showToast } = useToast();
  
  const [request, setRequest] = useState<TowingRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [operatorLocation, setOperatorLocation] = useState<OperatorLocation | null>(null);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [eta, setEta] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  // Fetch request details
  useEffect(() => {
    const fetchRequest = async () => {
      if (!params.requestId) {
        Alert.alert('Error', 'Request ID is missing');
        router.back();
        return;
      }

      try {
        const requestData = await getRequestById(params.requestId);
        setRequest(requestData);
        
        // Set initial map region
        if (requestData.destinationLat && requestData.destinationLng) {
          setMapRegion({
            latitude: requestData.destinationLat,
            longitude: requestData.destinationLng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      } catch (error) {
        console.error('Failed to fetch request:', error);
        Alert.alert('Error', 'Failed to load request details');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequest();
  }, [params.requestId]);

  // Update operator location and route
  useEffect(() => {
    if (!request) return;

    const updateLocation = async () => {
      try {
        const location = await getCurrentOperatorLocation();
        if (location) {
          setOperatorLocation(location);

          // Update route
          const route = await getRoute(
            { latitude: location.latitude, longitude: location.longitude },
            { latitude: request.destinationLat, longitude: request.destinationLng }
          );
          setRoutePoints(route.points);

          // Calculate distance and ETA
          const dist = calculateDistance(
            location.latitude,
            location.longitude,
            request.destinationLat,
            request.destinationLng
          );
          setDistance(dist / 1000); // Convert to km
          setEta(Math.max(1, Math.round((dist / 1000) * 2.5))); // ~2.5 min per km

          // Calculate progress (0-100%)
          const totalDistance = request.distanceKm || 1;
          const remainingDistance = dist / 1000;
          const traveledDistance = Math.max(0, totalDistance - remainingDistance);
          const progressPercent = Math.min(100, Math.max(0, (traveledDistance / totalDistance) * 100));
          setProgress(progressPercent);

          // Update map region
          const allCoords = [
            { latitude: location.latitude, longitude: location.longitude },
            { latitude: request.destinationLat, longitude: request.destinationLng },
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
        }
      } catch (error) {
        console.error('Error updating location:', error);
      }
    };

    updateLocation();
    const interval = setInterval(updateLocation, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [request]);

  const handleComplete = async () => {
    if (!params.requestId) return;

    setIsCompleting(true);
    try {
      await completeRequest(params.requestId);
      router.replace({
        pathname: '/screens/operator/trip-completed',
        params: { requestId: params.requestId },
      });
    } catch (error) {
      console.error('Failed to complete request:', error);
      showToast('Failed to complete trip', 'error');
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading || !request) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#003554" />
          <Text style={styles.loadingText}>Loading...</Text>
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
        {/* Destination Marker */}
        <Marker
          coordinate={{ latitude: request.destinationLat, longitude: request.destinationLng }}
          title="Destination"
        >
          <View style={styles.destinationMarker}>
            <Ionicons name="flag" size={24} color="#EF4444" />
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

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Towing in Progress</Text>
        </View>
      </SafeAreaView>

      {/* Bottom Card */}
      <View style={styles.bottomCard}>
        {/* Progress Info */}
        <View style={styles.progressInfo}>
          <Text style={styles.destinationLabel}>Heading to</Text>
          <Text style={styles.destinationText}>{request.destinationAddress || 'Loading...'}</Text>
        </View>

        {/* Progress Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{distance.toFixed(1)} km</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>~{eta} min</Text>
            <Text style={styles.statLabel}>ETA</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.round(progress)}%</Text>
            <Text style={styles.statLabel}>Complete</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        {/* Complete Button */}
        <TouchableOpacity
          style={[
            styles.completeButton,
            (progress < 90 || isCompleting) && styles.buttonDisabled,
          ]}
          onPress={handleComplete}
          disabled={progress < 90 || isCompleting}
          activeOpacity={0.8}
        >
          {isCompleting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.completeButtonText}>
              {progress < 90 ? 'Towing...' : 'Complete Trip'}
            </Text>
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
  destinationMarker: {
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
    alignItems: 'center',
    paddingTop: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#003554',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 20,
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
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
    paddingTop: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  progressInfo: {
    marginBottom: 20,
  },
  destinationLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  destinationText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#003554',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 4,
  },
  completeButton: {
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
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  completeButtonText: {
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
});
