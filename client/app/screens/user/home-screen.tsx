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

import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import {
    UserCircleIcon
} from 'hugeicons-react-native';
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
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import AddressInputCard from '@/components/address-input-card';
import LocationPickerModal from '@/components/location-picker-modal';
import PriceEstimatorCard from '@/components/price-estimator-card';
import PrimaryButton from '@/components/primary-button';
import VehicleTypeCard, { VehicleType } from '@/components/vehicle-type-card';

import { useToast } from '@/hooks/use-toast';
import {
    ApiError,
    createRequest,
    getCurrentUser,
    getUserRequests,
    type TowingRequest,
} from '@/lib/api';

import { useThemeColor } from '@/hooks/use-theme-color';

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

  const placeOrderSnapPoints = useMemo(() => ['12%', '45%', '85%'], []);
  const activeSessionSnapPoints = useMemo(() => ['15%', '50%'], []);

  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');

  const [pickupCoords, setPickupCoords] = useState<Coordinates | null>(null);
  const [destinationCoords, setDestinationCoords] =
    useState<Coordinates | null>(null);

  const [selectedVehicle, setSelectedVehicle] =
    useState<VehicleType | null>(null);

  const [isRequesting, setIsRequesting] = useState(false);

  const [activeRequest, setActiveRequest] = useState<TowingRequest | null>(null);

  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);

  const [showPickupPicker, setShowPickupPicker] = useState(false);
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);

  const [mapRegion] = useState<Region>({
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
   * Load active request session
   */
  useEffect(() => {
    const loadSession = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) return;

        const statuses: ('pending' | 'accepted' | 'in_progress')[] = [
          'pending',
          'accepted',
          'in_progress',
        ];

        for (const status of statuses) {
          const response = await getUserRequests(user.id, {
            status,
            limit: 1,
          });

          if (response.data?.length) {
            setActiveRequest(response.data[0]);
            activeSessionSheetRef.current?.snapToIndex(1);
            return;
          }
        }

        setActiveRequest(null);
      } catch (err) {
        if (err instanceof ApiError) {
          showToast(err.message, 'error');
        }
      }
    };

    loadSession();
    const interval = setInterval(loadSession, 10000);

    return () => clearInterval(interval);
  }, [showToast]);

  /**
   * Location selection handlers
   */
  const handlePickupSelect = useCallback(
    (address: string, coords: Coordinates) => {
      setPickupAddress(address);
      setPickupCoords(coords);
      placeOrderSheetRef.current?.snapToIndex(1);
    },
    []
  );

  const handleDestinationSelect = useCallback(
    (address: string, coords: Coordinates) => {
      setDestinationAddress(address);
      setDestinationCoords(coords);
      placeOrderSheetRef.current?.snapToIndex(1);
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
    } catch (err) {
      showToast('Request failed. Try again.', 'error');
    } finally {
      setIsRequesting(false);
    }
  }, [
    pickupCoords,
    destinationCoords,
    pickupAddress,
    destinationAddress,
    selectedVehicle,
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

      <SafeAreaView style={styles.safeArea}>
        <StatusBar translucent />

        {/* Profile Button */}
        <TouchableOpacity style={styles.profileButton}>
          <UserCircleIcon size={32} />
        </TouchableOpacity>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={mapRegion}
            showsUserLocation
          />
        </View>

        {/* BottomSheet */}
        {!hasActiveSession && (
          <BottomSheet
            ref={placeOrderSheetRef}
            index={1}
            snapPoints={placeOrderSnapPoints}
            enablePanDownToClose={false}
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
            backgroundStyle={styles.bottomSheetBackground}
          >
            <BottomSheetView style={styles.sheetContent}>
              <Text style={styles.headerTitle}>Request a Tow</Text>

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
    zIndex: 10,
  },

  sheetContent: {
    flex: 1,
    padding: 20,
    gap: 16,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
});