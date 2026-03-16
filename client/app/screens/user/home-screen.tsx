/**
 * HomeScreen (User Dashboard)
 * 
 * Main user dashboard with:
 * - Full-screen map layer
 * - Active session bottom sheet (when towing is in progress)
 * - Place order bottom sheet (when no active session)
 * - Better navigation with back button
 * - Toast notifications for errors
 */

/**
 * HomeScreen (User Dashboard)
 *
 * Fixes:
 * - LocationPickerModal rendered INSIDE GestureHandlerRootView
 * - BottomSheet keyboard support enabled
 * - Proper layering (MapView stays behind UI)
 */

import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import {
  UserCircleIcon
} from 'hugeicons-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import AddressInputCard from '@/components/address-input-card';
import LocationPickerModal from '@/components/location-picker-modal';
import PriceEstimatorCard from '@/components/price-estimator-card';
import PrimaryButton from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import VehicleTypeCard, { VehicleType } from '@/components/vehicle-type-card';

import { useToast } from '@/hooks/use-toast';
import { ApiError, cancelRequest, createRequest } from '@/lib/api';

import { useActiveRequest } from '@/hooks/use-active-request';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getRoute, type RoutePoint } from '@/lib/services/directionsService';
import {
  calculateDistance,
  getCurrentLocationWithAddress,
  type Coordinates,
} from '@/lib/services/locationService';
import { calculateEstimatedPrice } from '@/lib/services/pricingService';

export default function HomeScreen() {
  const { showToast } = useToast();

  const backgroundColor = useThemeColor({}, 'background');

  const placeOrderSheetRef = useRef<BottomSheet>(null);
  const activeSessionSheetRef = useRef<BottomSheet>(null);

  // Adjusted snap points to better fit content (15% collapsed, 60% half, 90% full)
  const placeOrderSnapPoints = useMemo(() => ['15%', '60%', '90%'], []);
  const activeSessionSnapPoints = useMemo(() => ['15%', '50%'], []);

  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');

  const [pickupCoords, setPickupCoords] = useState<Coordinates | null>(null);
  const [destinationCoords, setDestinationCoords] =
    useState<Coordinates | null>(null);

  const [selectedVehicle, setSelectedVehicle] =
    useState<VehicleType | null>(null);

  const [isRequesting, setIsRequesting] = useState(false);
  const { activeRequest } = useActiveRequest();

  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);

  const [showPickupPicker, setShowPickupPicker] = useState(false);
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);

  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);

  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 5.6037,
    longitude: -0.187,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  /**
   * Detect current location
   */
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const location = await getCurrentLocationWithAddress();
        if (location) {
          setPickupCoords(location.coordinates);
          setPickupAddress(location.address);
        }
      } catch {
        // Silent fail (user can manually select)
      }
    };

    detectLocation();
  }, []);

  /**
   * Update map region to fit both pickup and destination
   */
  useEffect(() => {
    if (pickupCoords && destinationCoords) {
      const minLat = Math.min(pickupCoords.lat, destinationCoords.lat);
      const maxLat = Math.max(pickupCoords.lat, destinationCoords.lat);
      const minLng = Math.min(pickupCoords.lng, destinationCoords.lng);
      const maxLng = Math.max(pickupCoords.lng, destinationCoords.lng);

      const latDelta = (maxLat - minLat) * 1.5; // Add 50% padding
      const lngDelta = (maxLng - minLng) * 1.5;

      setMapRegion({
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max(latDelta, 0.01),
        longitudeDelta: Math.max(lngDelta, 0.01),
      });
    } else if (pickupCoords) {
      // If only pickup is selected, center on pickup
      setMapRegion({
        latitude: pickupCoords.lat,
        longitude: pickupCoords.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [pickupCoords, destinationCoords]);

  // Fetch route when both locations are selected
  useEffect(() => {
    if (pickupCoords && destinationCoords) {
      const fetchRoute = async () => {
        try {
          const route = await getRoute(
            { latitude: pickupCoords.lat, longitude: pickupCoords.lng },
            { latitude: destinationCoords.lat, longitude: destinationCoords.lng }
          );
          setRoutePoints(route.points);
        } catch (error) {
          console.error('Error fetching route:', error);
          // Fallback to straight line
          setRoutePoints([
            { latitude: pickupCoords.lat, longitude: pickupCoords.lng },
            { latitude: destinationCoords.lat, longitude: destinationCoords.lng },
          ]);
        }
      };
      fetchRoute();
    } else {
      setRoutePoints([]);
    }
  }, [pickupCoords, destinationCoords]);

  /**
   * Price calculation
   */
  useEffect(() => {
    const updatePrice = async () => {
      if (!selectedVehicle || !pickupCoords || !destinationCoords) {
        setEstimatedPrice(null);
        return;
      }

      const distance = calculateDistance(
        pickupCoords.lat,
        pickupCoords.lng,
        destinationCoords.lat,
        destinationCoords.lng
      );

      const price = await calculateEstimatedPrice(distance, selectedVehicle);
      setEstimatedPrice(price);
    };

    updatePrice();
  }, [selectedVehicle, pickupCoords, destinationCoords]);

  /**
   * Snap active session sheet when an active request exists
   */
  useEffect(() => {
    if (activeRequest) {
      activeSessionSheetRef.current?.snapToIndex(1);
    }
  }, [activeRequest]);

  /**
   * Location selection handlers with delayed snap to ensure smooth transition
   */
  const handlePickupSelect = useCallback(
    (address: string, coords: Coordinates) => {
      setPickupAddress(address);
      setPickupCoords(coords);

      // Delay snap to ensure modal closes smoothly first
      setTimeout(() => {
        placeOrderSheetRef.current?.snapToIndex(1);
      }, 400);
    },
    []
  );

  const handleDestinationSelect = useCallback(
    (address: string, coords: Coordinates) => {
      setDestinationAddress(address);
      setDestinationCoords(coords);

      // Delay snap and maybe expand further if we have both addresses
      setTimeout(() => {
        placeOrderSheetRef.current?.snapToIndex(1);
      }, 400);
    },
    []
  );

  /**
   * Request Tow
   */
  const handleRequestPress = useCallback(async () => {
    if (
      !pickupCoords ||
      !destinationCoords ||
      !pickupAddress ||
      !destinationAddress ||
      !selectedVehicle
    ) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    // Check if user already has an active request
    if (activeRequest) {
      showToast('You already have an active request. Please complete or cancel it first.', 'error');
      // Optionally navigate to the active request
      if (activeRequest.status === 'pending') {
        router.push({
          pathname: '/screens/user/searching-operator',
          params: { requestId: activeRequest.id },
        });
      } else if (activeRequest.status === 'accepted') {
        router.push({
          pathname: '/screens/user/operator-found',
          params: { requestId: activeRequest.id },
        });
      } else if (activeRequest.status === 'in_progress') {
        router.push({
          pathname: '/screens/user/live-tracking',
          params: { requestId: activeRequest.id },
        });
      }
      return;
    }

    setIsRequesting(true);

    try {
      const request = await createRequest({
        pickupAddress,
        destinationAddress,
        pickupLat: pickupCoords.lat,
        pickupLng: pickupCoords.lng,
        destinationLat: destinationCoords.lat,
        destinationLng: destinationCoords.lng,
        vehicleType: selectedVehicle,
      });

      showToast('Request created successfully!', 'success');

      router.push({
        pathname: '/screens/user/searching-operator',
        params: { requestId: request.id },
      });
    } catch (error) {
      if (error instanceof ApiError) {
        // Handle 409 Conflict specifically
        if (
          error.message.includes('already have an active request') ||
          error.message.includes('Conflict')
        ) {
          showToast(
            'You already have an active request. Please complete or cancel it first.',
            'error',
          );
          // Active request hook will refresh state via realtime / polling
        } else {
          showToast(error.message || 'Request failed. Try again.', 'error');
        }
      } else {
        showToast('Request failed. Try again.', 'error');
      }
    } finally {
      setIsRequesting(false);
    }
  }, [
    pickupCoords,
    destinationCoords,
    pickupAddress,
    destinationAddress,
    selectedVehicle,
    activeRequest,
    showToast,
  ]);

  const hasActiveSession =
    activeRequest &&
    ['pending', 'accepted', 'in_progress'].includes(activeRequest.status);

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* ✅ Modals INSIDE Gesture Root */}
      <LocationPickerModal
        visible={showPickupPicker}
        onClose={() => setShowPickupPicker(false)}
        onSelect={handlePickupSelect}
        initialLocation={pickupCoords || undefined}
        title="Select Pickup Location"
      />

      <LocationPickerModal
        visible={showDestinationPicker}
        onClose={() => setShowDestinationPicker(false)}
        onSelect={handleDestinationSelect}
        initialLocation={destinationCoords || undefined}
        title="Select Destination"
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar translucent />

        {/* Profile Button */}
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <UserCircleIcon size={32} />
        </TouchableOpacity>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            region={mapRegion}
            showsUserLocation
          >
            {/* Pickup Marker */}
            {pickupCoords && (
              <Marker
                coordinate={{
                  latitude: pickupCoords.lat,
                  longitude: pickupCoords.lng,
                }}
                title="Pickup Location"
                pinColor="#3B82F6"
              />
            )}

            {/* Destination Marker */}
            {destinationCoords && (
              <Marker
                coordinate={{
                  latitude: destinationCoords.lat,
                  longitude: destinationCoords.lng,
                }}
                title="Destination"
                pinColor="#10B981"
              />
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
        </View>
      </SafeAreaView>

      {/* BottomSheet - Outside SafeAreaView for proper positioning */}
      {!hasActiveSession ? (
        <BottomSheet
          ref={placeOrderSheetRef}
          index={1}
          snapPoints={placeOrderSnapPoints}
          enablePanDownToClose={false}
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          backgroundStyle={[styles.bottomSheetBackground, { backgroundColor }]}
          handleIndicatorStyle={styles.handleIndicator}
        >
          <BottomSheetView style={styles.sheetContent}>
            <BottomSheetScrollView
              contentContainerStyle={styles.scrollContentContainer}
              showsVerticalScrollIndicator={false}
            >
              <ThemedText style={styles.headerTitle}>Request a Tow</ThemedText>

              <AddressInputCard
                type="pickup"
                value={pickupAddress}
                placeholder="Pickup location"
                onPress={() => setShowPickupPicker(true)}
              />

              <AddressInputCard
                type="destination"
                value={destinationAddress}
                placeholder="Destination"
                onPress={() => setShowDestinationPicker(true)}
              />

              <VehicleTypeCard
                selectedType={selectedVehicle}
                onSelect={setSelectedVehicle}
              />

              <PriceEstimatorCard
                estimatedPrice={estimatedPrice}
                isCalculating={false}
              />

              <PrimaryButton
                label="Request Tow Truck"
                isLoading={isRequesting}
                disabled={!pickupCoords || !destinationCoords}
                onPress={handleRequestPress}
              />
            </BottomSheetScrollView>
          </BottomSheetView>
        </BottomSheet>
      ) : (
        <BottomSheet
          ref={activeSessionSheetRef}
          index={1}
          snapPoints={activeSessionSnapPoints}
          enablePanDownToClose={false}
          backgroundStyle={[styles.bottomSheetBackground, { backgroundColor }]}
          handleIndicatorStyle={styles.handleIndicator}
        >
          <BottomSheetView style={styles.sheetContent}>
            <BottomSheetScrollView
              contentContainerStyle={styles.scrollContentContainer}
              showsVerticalScrollIndicator={false}
            >
              <ThemedText style={styles.headerTitle}>
                {activeRequest?.status === 'pending' && 'Searching for Operator'}
                {activeRequest?.status === 'accepted' && 'Operator Found'}
                {activeRequest?.status === 'in_progress' && 'Trip in Progress'}
              </ThemedText>

              {activeRequest && (
                <>
                  <View style={styles.sessionInfo}>
                    <ThemedText style={styles.sessionLabel}>From</ThemedText>
                    <ThemedText style={styles.sessionValue}>{activeRequest.pickupAddress}</ThemedText>
                  </View>

                  <View style={styles.sessionInfo}>
                    <ThemedText style={styles.sessionLabel}>To</ThemedText>
                    <ThemedText style={styles.sessionValue}>{activeRequest.destinationAddress}</ThemedText>
                  </View>

                  {activeRequest.operator && (
                    <View style={styles.operatorInfo}>
                      <ThemedText style={styles.sessionLabel}>Operator</ThemedText>
                      <ThemedText style={styles.sessionValue}>{activeRequest.operator.fullName}</ThemedText>
                      {activeRequest.operator.phone && (
                        <TouchableOpacity
                          style={styles.callOperatorButton}
                          onPress={() => {
                            Linking.openURL(`tel:${activeRequest.operator?.phone}`).catch(() => {
                              showToast('Unable to make phone call', 'error');
                            });
                          }}
                        >
                          <ThemedText style={styles.callOperatorText}>
                            📞 {activeRequest.operator.phone}
                          </ThemedText>
                        </TouchableOpacity>
                      )}
                      {activeRequest.operator.averageRating && (
                        <ThemedText style={styles.operatorRating}>
                          ⭐ {activeRequest.operator.averageRating.toFixed(1)} rating
                        </ThemedText>
                      )}
                    </View>
                  )}

                  <View style={styles.sessionActions}>
                    {activeRequest.status === 'pending' && (
                      <PrimaryButton
                        label="View Status"
                        onPress={() => router.push({
                          pathname: '/screens/user/searching-operator',
                          params: { requestId: activeRequest.id },
                        })}
                      />
                    )}
                    {activeRequest.status === 'accepted' && (
                      <PrimaryButton
                        label="Track Operator"
                        onPress={() => router.push({
                          pathname: '/screens/user/operator-found',
                          params: { requestId: activeRequest.id },
                        })}
                      />
                    )}
                    {activeRequest.status === 'in_progress' && (
                      <PrimaryButton
                        label="Live Tracking"
                        onPress={() => router.push({
                          pathname: '/screens/user/live-tracking',
                          params: { requestId: activeRequest.id },
                        })}
                      />
                    )}

                    {/* Cancellation Button */}
                    <TouchableOpacity
                      style={styles.cancelRequestButton}
                      onPress={() => {
                        Alert.alert(
                          "Cancel Request",
                          "Are you sure you want to cancel this request?",
                          [
                            { text: "No", style: "cancel" },
                            {
                              text: "Yes, Cancel",
                              style: "destructive",
                              onPress: async () => {
                                try {
                                  await cancelRequest(activeRequest.id, 'Cancelled by user from home');
                                  showToast('Request cancelled', 'success');
                                } catch (error) {
                                  showToast('Failed to cancel request', 'error');
                                }
                              }
                            }
                          ]
                        );
                      }}
                    >
                      <View style={styles.cancelButtonContent}>
                        <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
                        <ThemedText style={styles.cancelButtonText}>Cancel Request</ThemedText>
                      </View>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </BottomSheetScrollView>
          </BottomSheetView>
        </BottomSheet>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  safeArea: { flex: 1 },

  mapContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },

  map: { flex: 1 },

  profileButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 20,
  },

  bottomSheetBackground: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },

  handleIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9ca3af',
  },

  sheetContent: {
    flex: 1,
  },

  scrollContentContainer: {
    padding: 20,
    gap: 16,
    paddingBottom: 220,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },

  sessionInfo: {
    marginBottom: 16,
  },

  sessionLabel: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 4,
  },

  sessionValue: {
    fontSize: 16,
    fontWeight: '500',
  },

  operatorInfo: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },

  callOperatorButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },

  callOperatorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },

  operatorRating: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },

  sessionActions: {
    marginTop: 8,
  },
  cancelRequestButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
});