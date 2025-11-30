/**
 * HomeScreen (User Dashboard)
 * 
 * Main user dashboard with:
 * - Full-screen map layer
 * - Bottom modal (swipeable) containing the request form
 * - Vehicle type selector
 * - Price estimation
 * - Request tow button
 */

import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';

import AddressInputCard from '@/components/address-input-card';
import PriceEstimatorCard from '@/components/price-estimator-card';
import PrimaryButton from '@/components/primary-button';
import VehicleTypeCard, { VehicleType } from '@/components/vehicle-type-card';
import { calculateEstimatedPrice } from '@/constants/pricing';
import { createRequest, ApiError } from '@/lib/api';
import type { VehicleType as ApiVehicleType } from '@/lib/api';

export default function HomeScreen() {
  // Bottom sheet reference
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Snap points for the bottom sheet (10%, 40%, 85%)
  const snapPoints = useMemo(() => ['12%', '45%', '85%'], []);

  // State for addresses
  const [pickupAddress, setPickupAddress] = useState<string>('');
  const [destinationAddress, setDestinationAddress] = useState<string>('');

  // State for coordinates (in a real app, these would come from Google Places)
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);

  // State for vehicle selection
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);

  // State for request loading
  const [isRequesting, setIsRequesting] = useState(false);

  // Map region (default to Accra, Ghana)
  const [mapRegion] = useState<Region>({
    latitude: 5.6037,
    longitude: -0.1870,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Calculate estimated price based on vehicle type and mock distance
  const getEstimatedPrice = useCallback((): number | null => {
    if (!pickupAddress || !destinationAddress) {
      return null;
    }

    // Mock distance calculation (in a real app, this would use Google Directions API)
    const mockDistanceKm = 10; // Simulated 10km distance

    return calculateEstimatedPrice(mockDistanceKm, selectedVehicle);
  }, [selectedVehicle, pickupAddress, destinationAddress]);

  const estimatedPrice = getEstimatedPrice();

  // Handle address input press
  const handlePickupPress = useCallback(() => {
    // In a real app, this would open a Google Places autocomplete
    // For now, we'll set a mock address with coordinates
    setPickupAddress('Ring Road Central, Accra');
    setPickupCoords({ lat: 5.5500, lng: -0.2050 });
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  const handleDestinationPress = useCallback(() => {
    // In a real app, this would open a Google Places autocomplete
    // For now, we'll set a mock address with coordinates
    setDestinationAddress('Accra Mall, Accra');
    setDestinationCoords({ lat: 5.6350, lng: -0.1650 });
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  // Handle vehicle selection
  const handleVehicleSelect = useCallback((type: VehicleType) => {
    setSelectedVehicle(type);
  }, []);

  // Handle request button press
  const handleRequestPress = useCallback(async () => {
    if (!selectedVehicle || !pickupAddress || !destinationAddress || !pickupCoords || !destinationCoords) {
      return;
    }

    setIsRequesting(true);

    try {
      // Create the towing request via API
      const request = await createRequest({
        pickupAddress,
        destinationAddress,
        pickupLat: pickupCoords.lat,
        pickupLng: pickupCoords.lng,
        destinationLat: destinationCoords.lat,
        destinationLng: destinationCoords.lng,
        vehicleType: selectedVehicle as ApiVehicleType,
      });

      console.log('Request created:', request);

      // Navigate to searching screen with request ID
      router.push({
        pathname: '/screens/user/searching-operator',
        params: { requestId: request.id },
      });
    } catch (error) {
      console.error('Request creation error:', error);
      if (error instanceof ApiError) {
        Alert.alert('Request Failed', error.message || 'Could not create towing request');
      } else {
        Alert.alert('Request Failed', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsRequesting(false);
    }
  }, [selectedVehicle, pickupAddress, destinationAddress, pickupCoords, destinationCoords]);

  // Check if request can be made
  const canRequest = selectedVehicle && pickupAddress && destinationAddress && pickupCoords && destinationCoords;

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Full-screen Map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={mapRegion}
          showsUserLocation
          showsMyLocationButton
          showsCompass
          mapType="standard"
        />
      </View>

      {/* Bottom Sheet Modal */}
      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Request a Tow</Text>
            <Text style={styles.headerSubtitle}>
              Enter your pickup and destination to get started
            </Text>
          </View>

          {/* Address Inputs */}
          <View style={styles.addressSection}>
            <AddressInputCard
              type="pickup"
              value={pickupAddress}
              placeholder="Enter pickup location"
              onPress={handlePickupPress}
            />
            <View style={styles.addressDivider}>
              <View style={styles.dividerLine} />
            </View>
            <AddressInputCard
              type="destination"
              value={destinationAddress}
              placeholder="Enter destination"
              onPress={handleDestinationPress}
            />
          </View>

          {/* Vehicle Type Selector */}
          <View style={styles.vehicleSection}>
            <VehicleTypeCard
              selectedType={selectedVehicle}
              onSelect={handleVehicleSelect}
            />
          </View>

          {/* Price Estimator */}
          <View style={styles.priceSection}>
            <PriceEstimatorCard
              estimatedPrice={estimatedPrice}
              isCalculating={false}
            />
          </View>

          {/* Request Button */}
          <View style={styles.buttonSection}>
            <PrimaryButton
              label="Request Tow Truck"
              loadingLabel="Searching for Operator..."
              isLoading={isRequesting}
              disabled={!canRequest}
              onPress={handleRequestPress}
            />
          </View>
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  mapContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  map: {
    flex: 1,
  },
  bottomSheetBackground: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  handleIndicator: {
    backgroundColor: '#d1d5db',
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  addressSection: {
    marginBottom: 20,
  },
  addressDivider: {
    paddingLeft: 52,
    height: 16,
  },
  dividerLine: {
    width: 2,
    height: '100%',
    backgroundColor: '#e5e7eb',
    marginLeft: 7,
  },
  vehicleSection: {
    marginBottom: 16,
  },
  priceSection: {
    marginBottom: 20,
  },
  buttonSection: {
    marginTop: 'auto',
  },
});
