import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { router, useFocusEffect } from 'expo-router';
import { UserCircleIcon } from 'hugeicons-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import AddressInputCard from '@/components/address-input-card';
import PriceEstimatorCard from '@/components/price-estimator-card';
import PrimaryButton from '@/components/primary-button';
import VehicleTypeCard from '@/components/vehicle-type-card';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useToast } from '@/hooks/use-toast';

import { VehicleType } from '@/constants/pricing';
import { calculateDistance, getCurrentLocationWithAddress } from '@/lib/services/locationService';
import { calculateEstimatedPrice } from '@/lib/services/pricingService';
import { requestService, TowRequest } from '@/services/requests';

export default function HomeScreen() {
  const { showToast } = useToast();
  const backgroundColor = useThemeColor({}, 'background');

  // Bottom sheet references
  const placeOrderSheetRef = useRef<BottomSheet>(null);
  const activeSessionSheetRef = useRef<BottomSheet>(null);

  const placeOrderSnapPoints = useMemo(() => ['15%', '45%', '85%'], []);
  const activeSessionSnapPoints = useMemo(() => ['20%', '50%'], []);

  // State
  const [pickupAddress, setPickupAddress] = useState<string>('Detecting location...');
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [activeRequest, setActiveRequest] = useState<TowRequest | null>(null);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);

  // Map Region
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 5.6037,
    longitude: -0.1870,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Load User Location & Active Request
  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [])
  );

  const loadInitialData = async () => {
    try {
      // 1. Location
      const location = await getCurrentLocationWithAddress();
      if (location) {
        setPickupCoords(location.coordinates);
        setPickupAddress(location.address);
        setMapRegion({
          latitude: location.coordinates.lat,
          longitude: location.coordinates.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } else {
        setPickupAddress("Location unavailable");
      }

      // 2. Active Request
      const active = await requestService.getActiveRequest();
      setActiveRequest(active);
      if (active) {
        activeSessionSheetRef.current?.snapToIndex(1);
      } else {
        placeOrderSheetRef.current?.snapToIndex(1);
      }

    } catch (error) {
      console.error('Error in loadInitialData:', error);
    }
  };

  // Update Price Calculation
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


  // Handlers
  const handleDestinationPress = () => {
    // For Demo: Set a fixed destination near pickup or slightly further
    if (!pickupCoords) {
      showToast('Waiting for location...', 'error');
      return;
    }

    // Simulate picking a spot nearby
    const dest = {
      lat: pickupCoords.lat + 0.02,
      lng: pickupCoords.lng + 0.01
    };

    setDestinationCoords(dest);
    setDestinationAddress('Selected Destination');
    placeOrderSheetRef.current?.snapToIndex(2);
  };

  const handlePickupPress = async () => {
    // Re-detect location
    const location = await getCurrentLocationWithAddress();
    if (location) {
      setPickupCoords(location.coordinates);
      setPickupAddress(location.address);
      showToast('Location updated', 'success');
    }
  };

  const handleRequestPress = async () => {
    if (!selectedVehicle || !pickupAddress || !destinationAddress || !pickupCoords || !destinationCoords || !estimatedPrice) {
      showToast('Please complete all fields', 'error');
      // If price failed but others exist, maybe network error or no pricing
      if (!estimatedPrice && selectedVehicle && pickupCoords && destinationCoords) {
        showToast('Could not calculate price', 'error');
      }
      return;
    }

    setIsRequesting(true);
    try {
      const distance = calculateDistance(
        pickupCoords.lat,
        pickupCoords.lng,
        destinationCoords.lat,
        destinationCoords.lng
      );

      const request = await requestService.createRequest({
        pickup_lat: pickupCoords.lat,
        pickup_lng: pickupCoords.lng,
        pickup_address: pickupAddress,
        dest_lat: destinationCoords.lat,
        dest_lng: destinationCoords.lng,
        dest_address: destinationAddress,
        vehicle_type: selectedVehicle,
        estimated_distance_km: distance,
        estimated_cost: estimatedPrice
      });

      router.push({
        pathname: '/screens/user/searching-operator',
        params: { requestId: request.id }
      });

    } catch (error) {
      console.error(error);
      showToast('Failed to create request', 'error');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleViewActiveSession = () => {
    if (!activeRequest) return;
    router.push({
      pathname: '/screens/user/searching-operator',
      params: { requestId: activeRequest.id }
    });
  };

  const hasActiveSession = !!activeRequest;

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <UserCircleIcon size={32} color="#003554" />
        </TouchableOpacity>

        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            region={mapRegion}
            showsUserLocation
            showsMyLocationButton
          >
            {pickupCoords && <Marker coordinate={{ latitude: pickupCoords.lat, longitude: pickupCoords.lng }} title="Pickup" />}
            {destinationCoords && <Marker coordinate={{ latitude: destinationCoords.lat, longitude: destinationCoords.lng }} pinColor="blue" title="Destination" />}
          </MapView>
        </View>

        {/* Active Session Sheet */}
        {hasActiveSession && (
          <BottomSheet
            ref={activeSessionSheetRef}
            index={0}
            snapPoints={activeSessionSnapPoints}
          >
            <BottomSheetView style={styles.sheetContent}>
              <Text style={styles.headerTitle}>Active & On-going</Text>
              <PrimaryButton label="View Request" onPress={handleViewActiveSession} />
            </BottomSheetView>
          </BottomSheet>
        )}

        {/* Place Order Sheet */}
        {!hasActiveSession && (
          <BottomSheet
            ref={placeOrderSheetRef}
            index={0}
            snapPoints={placeOrderSnapPoints}
          >
            <BottomSheetView style={styles.sheetContent}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Request Tow</Text>
              </View>

              <View style={{ gap: 12, marginBottom: 20 }}>
                <AddressInputCard
                  type="pickup"
                  value={pickupAddress}
                  placeholder="Pickup Location"
                  onPress={handlePickupPress}
                />
                <AddressInputCard
                  type="destination"
                  value={destinationAddress}
                  placeholder="Destination (Tap to select)"
                  onPress={handleDestinationPress}
                />
              </View>

              <VehicleTypeCard
                selectedType={selectedVehicle}
                onSelect={(t) => setSelectedVehicle(t as VehicleType)}
              />

              <View style={{ marginTop: 16 }}>
                <PriceEstimatorCard estimatedPrice={estimatedPrice} isCalculating={false} />
              </View>

              <View style={{ marginTop: 20 }}>
                <PrimaryButton
                  label="Request Tow"
                  isLoading={isRequesting}
                  onPress={handleRequestPress}
                  disabled={!selectedVehicle || !destinationCoords}
                />
              </View>
            </BottomSheetView>
          </BottomSheet>
        )}

      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  profileButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    flex: 1,
  },
  sheetContent: {
    flex: 1,
    padding: 24,
  },
  header: { marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
});
