/**
 * Home Screen (User Dashboard)
 *
 * Main user dashboard with:
 * - Full-screen map layer (native) or placeholder (web)
 * - Bottom modal (swipeable) containing the request form
 * - Vehicle type selector
 * - Price estimation
 * - Request tow button
 */

import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import AddressInputCard from '@/components/address-input-card';
import PriceEstimatorCard from '@/components/price-estimator-card';
import PrimaryButton from '@/components/primary-button';
import VehicleTypeCard, { VehicleType } from '@/components/vehicle-type-card';
import { calculateEstimatedPrice } from '@/constants/pricing';

// Conditionally import MapView for native platforms only
let MapView: React.ComponentType<{
  style?: object;
  provider?: string;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  showsCompass?: boolean;
  mapType?: string;
}>;
let PROVIDER_GOOGLE: string | undefined;

if (Platform.OS !== 'web') {
  const RNMaps = require('react-native-maps');
  MapView = RNMaps.default;
  PROVIDER_GOOGLE = RNMaps.PROVIDER_GOOGLE;
}

// Web fallback for map view
function MapPlaceholder() {
  return (
    <View style={styles.mapPlaceholder}>
      <Ionicons name="map" size={64} color="#CBD5E1" />
      <Text style={styles.mapPlaceholderText}>Map View</Text>
      <Text style={styles.mapPlaceholderSubtext}>
        (Map available on mobile devices)
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  // Bottom sheet reference
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Snap points for the bottom sheet (10%, 40%, 85%)
  const snapPoints = useMemo(() => ['12%', '45%', '85%'], []);

  // State for addresses
  const [pickupAddress, setPickupAddress] = useState<string>('');
  const [destinationAddress, setDestinationAddress] = useState<string>('');

  // State for vehicle selection
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);

  // State for request loading
  const [isRequesting, setIsRequesting] = useState(false);

  // Map region (default to Accra, Ghana)
  const mapRegion = {
    latitude: 5.6037,
    longitude: -0.1870,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

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
    // For now, we'll set a mock address
    setPickupAddress('Ring Road Central, Accra');
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  const handleDestinationPress = useCallback(() => {
    // In a real app, this would open a Google Places autocomplete
    // For now, we'll set a mock address
    setDestinationAddress('Accra Mall, Accra');
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  // Handle vehicle selection
  const handleVehicleSelect = useCallback((type: VehicleType) => {
    setSelectedVehicle(type);
  }, []);

  // Handle request button press
  const handleRequestPress = useCallback(async () => {
    if (!selectedVehicle || !pickupAddress || !destinationAddress) {
      return;
    }

    setIsRequesting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Navigate to searching screen
    router.push('/screens/user/searching-operator');
  }, [selectedVehicle, pickupAddress, destinationAddress]);

  // Check if request can be made
  const canRequest = selectedVehicle && pickupAddress && destinationAddress;

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Full-screen Map or Placeholder on Web */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <MapPlaceholder />
        ) : (
          MapView && (
            <MapView
              style={styles.map}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              initialRegion={mapRegion}
              showsUserLocation
              showsMyLocationButton
              showsCompass
              mapType="standard"
            />
          )
        )}
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
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 12,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: '#CBD5E1',
    marginTop: 4,
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
    paddingBottom: 100, // Extra padding for floating tab bar
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
