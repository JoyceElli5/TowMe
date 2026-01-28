/**
 * HomeScreen (User Dashboard)
 * 
 * Main user dashboard with:
 * - Full-screen map layer
 * - Bottom modal (swipeable) containing the request form
 * - Vehicle type selector
 * - Price estimation
 * - Request tow button
 * 
 * Updated to use Supabase services with real location and pricing
 */

import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MapView, { PROVIDER_GOOGLE, Region, Marker } from 'react-native-maps';

import AddressInputCard from '@/components/address-input-card';
import PriceEstimatorCard from '@/components/price-estimator-card';
import PrimaryButton from '@/components/primary-button';
import VehicleTypeCard, { VehicleType } from '@/components/vehicle-type-card';
import {
  getCurrentLocation,
  calculateDistance,
  type Coordinates,
} from '@/services/locationService';
import {
  fetchVehiclePricing,
  calculateEstimatedCost,
  type VehiclePricing,
} from '@/services/pricingService';
import {
  createTowRequest,
  matchDriver,
} from '@/services/requestService';

export default function HomeScreen() {
  // Bottom sheet reference
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Snap points for the bottom sheet (10%, 40%, 85%)
  const snapPoints = useMemo(() => ['12%', '45%', '85%'], []);

  // State for addresses
  const [pickupAddress, setPickupAddress] = useState<string>('');
  const [destinationAddress, setDestinationAddress] = useState<string>('');

  // State for coordinates
  const [pickupCoords, setPickupCoords] = useState<Coordinates | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<Coordinates | null>(null);

  // State for vehicle selection
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);

  // State for request loading
  const [isRequesting, setIsRequesting] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);

  // State for pricing data
  const [pricingData, setPricingData] = useState<VehiclePricing[]>([]);

  // Map region (default to Accra, Ghana)
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 5.6037,
    longitude: -0.1870,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Load pricing data on mount
  useEffect(() => {
    loadPricing();
  }, []);

  // Auto-detect location on mount
  useEffect(() => {
    detectCurrentLocation();
  }, []);

  const loadPricing = async () => {
    setIsLoadingPricing(true);
    try {
      const pricing = await fetchVehiclePricing();
      setPricingData(pricing);
    } catch (error) {
      console.error('Error loading pricing:', error);
      Alert.alert('Error', 'Failed to load pricing data');
    } finally {
      setIsLoadingPricing(false);
    }
  };

  const detectCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const location = await getCurrentLocation();
      setPickupCoords(location.coords);
      setPickupAddress(location.address || 'Current Location');
      
      // Update map region to user's location
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (error: any) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        error.message || 'Failed to get current location. Please enable location services.'
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Calculate estimated price based on vehicle type and distance
  const getEstimatedPrice = useCallback(async (): Promise<number | null> => {
    if (!pickupCoords || !destinationCoords || !selectedVehicle) {
      return null;
    }

    // Calculate distance using Haversine formula
    const distanceKm = calculateDistance(pickupCoords, destinationCoords);

    // Get estimated cost from database pricing
    const cost = await calculateEstimatedCost(distanceKm, selectedVehicle);
    
    return cost;
  }, [selectedVehicle, pickupCoords, destinationCoords]);

  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [estimatedDistance, setEstimatedDistance] = useState<number | null>(null);

  // Recalculate price when inputs change
  useEffect(() => {
    const updateEstimate = async () => {
      if (pickupCoords && destinationCoords && selectedVehicle) {
        const distance = calculateDistance(pickupCoords, destinationCoords);
        setEstimatedDistance(distance);
        
        const price = await getEstimatedPrice();
        setEstimatedPrice(price);
      } else {
        setEstimatedPrice(null);
        setEstimatedDistance(null);
      }
    };

    updateEstimate();
  }, [pickupCoords, destinationCoords, selectedVehicle, getEstimatedPrice]);

  // Handle address input press
  const handlePickupPress = useCallback(() => {
    // For now, use current location
    // In future, integrate place search autocomplete
    detectCurrentLocation();
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  const handleDestinationPress = useCallback(() => {
    // In a real app, this would open a Google Places autocomplete
    // For now, we'll set a mock destination
    Alert.alert(
      'Set Destination',
      'Place search will be implemented. Using sample destination for now.',
      [
        {
          text: 'OK',
          onPress: () => {
            setDestinationAddress('Accra Mall, Accra');
            setDestinationCoords({ latitude: 5.6350, longitude: -0.1650 });
            bottomSheetRef.current?.snapToIndex(1);
          },
        },
      ]
    );
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
      // Create the towing request via Supabase
      const request = await createTowRequest({
        pickup_lat: pickupCoords.latitude,
        pickup_lng: pickupCoords.longitude,
        pickup_address: pickupAddress,
        dest_lat: destinationCoords.latitude,
        dest_lng: destinationCoords.longitude,
        dest_address: destinationAddress,
        vehicle_type: selectedVehicle,
        estimated_distance_km: estimatedDistance || undefined,
        estimated_cost: estimatedPrice || undefined,
      });

      console.log('Request created:', request);

      // Try to match with a driver
      const matchResult = await matchDriver(request.id);
      
      if (!matchResult.success) {
        console.warn('No driver matched:', matchResult.error);
        // Still navigate to searching screen - will continue looking
      }

      // Navigate to searching screen with request ID
      router.push({
        pathname: '/screens/user/searching-operator',
        params: { requestId: request.id },
      });
    } catch (error: any) {
      console.error('Request creation error:', error);
      Alert.alert(
        'Request Failed',
        error?.message || 'Could not create towing request. Please try again.'
      );
    } finally {
      setIsRequesting(false);
    }
  }, [selectedVehicle, pickupAddress, destinationAddress, pickupCoords, destinationCoords, estimatedDistance, estimatedPrice]);

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
          region={mapRegion}
          showsUserLocation
          showsMyLocationButton
          showsCompass
          mapType="standard"
        >
          {/* Pickup marker */}
          {pickupCoords && (
            <Marker
              coordinate={pickupCoords}
              title="Pickup Location"
              pinColor="green"
            />
          )}
          
          {/* Destination marker */}
          {destinationCoords && (
            <Marker
              coordinate={destinationCoords}
              title="Destination"
              pinColor="red"
            />
          )}
        </MapView>
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
