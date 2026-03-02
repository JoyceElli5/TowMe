/**
 * LiveTracking Screen (Placeholder)
 * 
 * Displays real-time tracking of the tow operator.
 * Shows map with operator location and ETA updates.
 */

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ConnectivityBanner } from '@/components/ui/connectivity-banner';
import { ErrorView } from '@/components/ui/error-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useToast } from '@/hooks/use-toast';
import { ApiError, trackRequest, type TowingRequest } from '@/lib/api';

export default function LiveTrackingScreen() {
  const params = useLocalSearchParams<{ requestId?: string }>();
  const requestId = params.requestId;
  const { showToast } = useToast();
  const [request, setRequest] = useState<TowingRequest | null>(null);
  const [operatorLocation, setOperatorLocation] = useState<{
    latitude: number;
    longitude: number;
    heading: number | null;
    timestamp: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isError, setIsError] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');

  const loadTrackingData = React.useCallback(async () => {
    if (!requestId) return;

    try {
      const trackingData = await trackRequest(requestId);
      setRequest(trackingData.request);
      setOperatorLocation(trackingData.operatorLocation);

      // Update map region to show both user and operator
      if (trackingData.operatorLocation) {
        const centerLat = (trackingData.request.pickupLat + trackingData.operatorLocation.latitude) / 2;
        const centerLng = (trackingData.request.pickupLng + trackingData.operatorLocation.longitude) / 2;
        const latDelta = Math.abs(trackingData.request.pickupLat - trackingData.operatorLocation.latitude) * 2.5;
        const lngDelta = Math.abs(trackingData.request.pickupLng - trackingData.operatorLocation.longitude) * 2.5;

        setMapRegion({
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: Math.max(latDelta, 0.01),
          longitudeDelta: Math.max(lngDelta, 0.01),
        });

        // Calculate ETA based on distance (rough estimate: 1km = 2 minutes)
        const distance = Math.sqrt(
          Math.pow(trackingData.request.pickupLat - trackingData.operatorLocation.latitude, 2) +
          Math.pow(trackingData.request.pickupLng - trackingData.operatorLocation.longitude, 2)
        ) * 111; // Convert to km
        setEta(Math.ceil(distance * 2));
      } else {
        // Default to pickup location
        setMapRegion({
          latitude: trackingData.request.pickupLat,
          longitude: trackingData.request.pickupLng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      }

      // Reset error states
      setIsError(false);
      setIsOffline(false);

      // Check if trip is completed
      if (trackingData.request.status === 'completed') {
        router.replace({
          pathname: '/screens/user/trip-completed',
          params: { requestId },
        });
      }
    } catch (error) {
      console.error('Error loading tracking data:', error);
      if (error instanceof ApiError) {
        if (error.status === 0) {
          // Network error - show banner instead of toast
          setIsOffline(true);
        } else {
          showToast(error.message, 'error');
          setIsError(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [requestId, showToast]);

  useEffect(() => {
    if (requestId) {
      loadTrackingData();
      const interval = setInterval(() => {
        loadTrackingData();
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    } else {
      showToast('Request ID not found', 'error');
      router.back();
    }
  }, [requestId, loadTrackingData, showToast]);

  const handleCall = () => {
    if (request?.operator?.phone) {
      Linking.openURL(`tel:${request.operator.phone}`);
    } else {
      showToast('Operator phone number not available', 'error');
    }
  };

  const handleChat = () => {
    if (request?.id) {
      router.push({
        pathname: '/screens/user/chat-screen',
        params: {
          requestId: request.id,
          operatorName: request.operator?.fullName,
          operatorPhone: request.operator?.phone
        }
      });
    } else {
      showToast('Request information not available', 'error');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading && !request) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#003554" />
          <ThemedText style={styles.loadingText}>Loading tracking data...</ThemedText>
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <ErrorView
          type="server"
          onRetry={loadTrackingData}
          isLoading={isLoading}
        />
      </View>
    );
  }

  if (!request || !request.operator) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <ErrorView
          type="not-found"
          message="Tracking information not available. The request may have been cancelled."
          onRetry={() => router.back()}
          retryLabel="Go Back"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <ConnectivityBanner isOffline={isOffline} />

      {/* Map */}
      <MapView
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        region={mapRegion || {
          latitude: request.pickupLat,
          longitude: request.pickupLng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation
      >
        {/* Operator Marker */}
        {operatorLocation && (
          <Marker
            coordinate={{
              latitude: operatorLocation.latitude,
              longitude: operatorLocation.longitude,
            }}
            title="Tow Operator"
          >
            <View style={styles.markerContainer}>
              <Ionicons name="car-sport" size={24} color="#003554" />
            </View>
          </Marker>
        )}

        {/* Pickup Location Marker */}
        <Marker
          coordinate={{
            latitude: request.pickupLat,
            longitude: request.pickupLng,
          }}
          title="Pickup Location"
        >
          <View style={styles.userMarker}>
            <View style={styles.userMarkerInner} />
          </View>
        </Marker>

        {/* Destination Marker */}
        <Marker
          coordinate={{
            latitude: request.destinationLat,
            longitude: request.destinationLng,
          }}
          title="Destination"
        >
          <View style={styles.destinationMarker}>
            <Ionicons name="location" size={20} color="#10B981" />
          </View>
        </Marker>
      </MapView>

      {/* Status Card */}
      <SafeAreaView style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <ThemedText style={styles.statusTitle}>Operator En Route</ThemedText>
          {eta !== null && (
            <View style={styles.etaBadge}>
              <Text style={styles.etaValue}>{eta}</Text>
              <Text style={styles.etaLabel}>min</Text>
            </View>
          )}
        </View>

        <View style={styles.operatorInfo}>
          <View style={styles.operatorAvatar}>
            <Text style={styles.avatarText}>{getInitials(request.operator.fullName)}</Text>
          </View>
          <View style={styles.operatorDetails}>
            <ThemedText style={styles.operatorName}>{request.operator.fullName}</ThemedText>
            <ThemedText style={styles.vehicleInfo}>
              {request.vehicleType.charAt(0).toUpperCase() + request.vehicleType.slice(1)} • {request.distanceKm?.toFixed(1) || '0'} km
            </ThemedText>
          </View>
          <TouchableOpacity
            style={[styles.chatButton, { backgroundColor: '#eff6ff' }]}
            onPress={handleChat}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.callButton} onPress={handleCall}>
            <Ionicons name="call" size={20} color="#10B981" />
          </TouchableOpacity>
        </View>

        {eta !== null && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, ((eta / (eta + 1)) * 100)))}%` }]} />
          </View>
        )}
      </SafeAreaView>
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
  markerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  userMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 53, 84, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#003554',
  },
  destinationMarker: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#003554',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#003554',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  etaValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginRight: 4,
  },
  etaLabel: {
    fontSize: 12,
    color: '#bae6fd',
  },
  operatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  operatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#003554',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  operatorDetails: {
    flex: 1,
  },
  operatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#6b7280',
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#003554',
    borderRadius: 2,
  },
});
