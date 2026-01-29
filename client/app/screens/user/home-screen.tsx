import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import { router, useFocusEffect } from 'expo-router';
import { UserCircleIcon } from 'hugeicons-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
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

import { pricingService, VehiclePricing } from '@/services/pricing';
import { requestService, TowRequest } from '@/services/requests';
import { VehicleType } from '@/services/vehicles';

export default function HomeScreen() {
  const { showToast } = useToast();
  const backgroundColor = useThemeColor({}, 'background');

  // Bottom sheet references
  const placeOrderSheetRef = useRef<BottomSheet>(null);
  const activeSessionSheetRef = useRef<BottomSheet>(null);

  const placeOrderSnapPoints = useMemo(() => ['15%', '45%', '85%'], []);
  const activeSessionSnapPoints = useMemo(() => ['20%', '50%'], []);

  // State
  const [pickupAddress, setPickupAddress] = useState<string>('Current Location');
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [activeRequest, setActiveRequest] = useState<TowRequest | null>(null);
  const [pricing, setPricing] = useState<Record<string, VehiclePricing>>({});

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
      // 1. Permission & Location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setPickupCoords({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });
        setMapRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });

        // Reverse Geocode
        const [address] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (address) {
          const addrStr = `${address.street || ''} ${address.name || ''}, ${address.city || ''}`.trim();
          if (addrStr && addrStr !== ',') setPickupAddress(addrStr);
        }
      }

      // 2. Active Request
      const active = await requestService.getActiveRequest();
      setActiveRequest(active);
      if (active) {
        activeSessionSheetRef.current?.snapToIndex(1);
      } else {
        placeOrderSheetRef.current?.snapToIndex(1);
      }

      // 3. Pricing
      const pricingData = await pricingService.getPricing();
      setPricing(pricingData);

    } catch (error) {
      console.error('Error in loadInitialData:', error);
    }
  };

  // Calculate Price
  const estimatedPrice = useMemo(() => {
    if (!selectedVehicle || !pickupCoords || !destinationCoords || !pricing[selectedVehicle]) return null;

    // Calculate accurate distance
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(destinationCoords.lat - pickupCoords.lat);
    const dLon = deg2rad(destinationCoords.lng - pickupCoords.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(pickupCoords.lat)) * Math.cos(deg2rad(destinationCoords.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km

    return pricingService.estimatePrice(pricing[selectedVehicle], d);
  }, [selectedVehicle, pickupCoords, destinationCoords, pricing]);

  function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }

  // Handlers
  const handleDestinationPress = () => {
    // For Demo: Set a fixed destination near pickup or slightly further
    // In real app: Open Google Places Autocomplete
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

  const handlePickupPress = () => {
    // Usually opens location picker
    showToast('Using current location', 'success');
  };

  const handleRequestPress = async () => {
    if (!selectedVehicle || !pickupAddress || !destinationAddress || !pickupCoords || !destinationCoords || !estimatedPrice) {
      showToast('Please complete all fields', 'error');
      return;
    }

    setIsRequesting(true);
    try {
      const distance = 5.0; // Approximation for now based on coords if we calculated it
      const request = await requestService.createRequest({
        pickup_lat: pickupCoords.lat,
        pickup_lng: pickupCoords.lng,
        pickup_address: pickupAddress,
        dest_lat: destinationCoords.lat,
        dest_lng: destinationCoords.lng,
        dest_address: destinationAddress,
        vehicle_type: selectedVehicle,
        estimated_distance_km: distance, // We can reuse the calculated one from estimtePrice memo if we exposed it
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
