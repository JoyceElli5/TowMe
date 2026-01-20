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

import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
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
import { UserCircleIcon, Car01Icon, Location01Icon, Flag01Icon } from 'hugeicons-react-native';

import AddressInputCard from '@/components/address-input-card';
import PriceEstimatorCard from '@/components/price-estimator-card';
import PrimaryButton from '@/components/primary-button';
import VehicleTypeCard, { VehicleType } from '@/components/vehicle-type-card';
import { calculateEstimatedPrice } from '@/constants/pricing';
import { useToast } from '@/hooks/use-toast';
import { ApiError, createRequest, getCurrentUser, getUserRequests, type TowingRequest } from '@/lib/api';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  const { showToast } = useToast();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  
  // Bottom sheet references
  const placeOrderSheetRef = useRef<BottomSheet>(null);
  const activeSessionSheetRef = useRef<BottomSheet>(null);

  // Snap points
  const placeOrderSnapPoints = useMemo(() => ['12%', '45%', '85%'], []);
  const activeSessionSnapPoints = useMemo(() => ['15%', '50%'], []);

  // State for addresses
  const [pickupAddress, setPickupAddress] = useState<string>('');
  const [destinationAddress, setDestinationAddress] = useState<string>('');

  // State for coordinates
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);

  // State for vehicle selection
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);

  // State for request loading
  const [isRequesting, setIsRequesting] = useState(false);

  // State for active session
  const [activeRequest, setActiveRequest] = useState<TowingRequest | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  // Map region (default to Accra, Ghana)
  const [mapRegion] = useState<Region>({
    latitude: 5.6037,
    longitude: -0.1870,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Load current user and check for active sessions
  useEffect(() => {
    const loadUserAndActiveSession = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUser(user);
          
          // Check for active requests (pending, accepted, or in_progress)
          // Fetch each status separately since API doesn't support array of statuses
          const statuses: ('pending' | 'accepted' | 'in_progress')[] = ['pending', 'accepted', 'in_progress'];
          let foundRequest: TowingRequest | null = null;
          
          for (const status of statuses) {
            try {
              const response = await getUserRequests(user.id, {
                status,
                limit: 1,
              });
              
              if (response.data && response.data.length > 0) {
                foundRequest = response.data[0];
                break;
              }
            } catch {
              // Continue to next status
            }
          }
          
          if (foundRequest) {
            setActiveRequest(foundRequest);
            // Show active session sheet
            activeSessionSheetRef.current?.snapToIndex(1);
          }
        }
      } catch (error) {
        console.error('Failed to load user/active session:', error);
        if (error instanceof ApiError) {
          showToast(error.message || 'Failed to load session', 'error');
        }
      }
    };

    loadUserAndActiveSession();
    
    // Poll for active session updates every 10 seconds
    const interval = setInterval(loadUserAndActiveSession, 10000);
    return () => clearInterval(interval);
  }, [showToast]);

  // Calculate estimated price
  const getEstimatedPrice = useCallback((): number | null => {
    if (!pickupAddress || !destinationAddress) {
      return null;
    }
    const mockDistanceKm = 10;
    return calculateEstimatedPrice(mockDistanceKm, selectedVehicle);
  }, [selectedVehicle, pickupAddress, destinationAddress]);

  const estimatedPrice = getEstimatedPrice();

  // Handle address input press
  const handlePickupPress = useCallback(() => {
    setPickupAddress('Ring Road Central, Accra');
    setPickupCoords({ lat: 5.5500, lng: -0.2050 });
    placeOrderSheetRef.current?.snapToIndex(1);
  }, []);

  const handleDestinationPress = useCallback(() => {
    setDestinationAddress('Accra Mall, Accra');
    setDestinationCoords({ lat: 5.6350, lng: -0.1650 });
    placeOrderSheetRef.current?.snapToIndex(1);
  }, []);

  // Handle vehicle selection
  const handleVehicleSelect = useCallback((type: VehicleType) => {
    setSelectedVehicle(type);
  }, []);

  // Handle request button press
  const handleRequestPress = useCallback(async () => {
    if (!selectedVehicle || !pickupAddress || !destinationAddress || !pickupCoords || !destinationCoords) {
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

      showToast('Towing request created successfully!', 'success');

      // Navigate to searching screen
      router.push({
        pathname: '/screens/user/searching-operator',
        params: { requestId: request.id },
      });
    } catch (error) {
      console.error('Request creation error:', error);
      if (error instanceof ApiError) {
        showToast(error.message || 'Could not create towing request', 'error');
      } else {
        showToast('An unexpected error occurred. Please try again.', 'error');
      }
    } finally {
      setIsRequesting(false);
    }
  }, [selectedVehicle, pickupAddress, destinationAddress, pickupCoords, destinationCoords, showToast]);

  // Handle active session actions
  const handleViewActiveSession = useCallback(() => {
    if (!activeRequest) return;
    
    // Navigate to appropriate screen based on status
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
  }, [activeRequest]);

  // Check if request can be made
  const canRequest = selectedVehicle && pickupAddress && destinationAddress && pickupCoords && destinationCoords;

  // Determine which bottom sheet to show
  const hasActiveSession = activeRequest && ['pending', 'accepted', 'in_progress'].includes(activeRequest.status);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Searching for operator...';
      case 'accepted': return 'Operator found';
      case 'in_progress': return 'Towing in progress';
      default: return status;
    }
  };

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle={backgroundColor === '#151718' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        
        {/* Profile Icon Button */}
        <TouchableOpacity
          style={[styles.profileButton, { backgroundColor: useThemeColor({ light: '#ffffff', dark: '#1F2937' }, 'background') }]}
          onPress={() => router.push('/(tabs)/profile')}
          accessibilityLabel="Open profile"
        >
          <UserCircleIcon size={32} color={useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint')} />
        </TouchableOpacity>

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

        {/* Active Session Bottom Sheet */}
        {hasActiveSession && (
          <BottomSheet
            ref={activeSessionSheetRef}
            index={1}
            snapPoints={activeSessionSnapPoints}
            enablePanDownToClose={false}
            backgroundStyle={styles.bottomSheetBackground}
            handleIndicatorStyle={styles.handleIndicator}
          >
            <BottomSheetView style={styles.activeSessionContent}>
              <View style={styles.activeSessionHeader}>
                <View style={styles.activeSessionIcon}>
                  <Car01Icon size={24} color="#3B82F6" />
                </View>
                <View style={styles.activeSessionInfo}>
                  <ThemedText type="subtitle" style={styles.activeSessionTitle}>Active Towing Session</ThemedText>
                  <ThemedText style={styles.activeSessionStatus}>{getStatusLabel(activeRequest!.status)}</ThemedText>
                </View>
              </View>

              {activeRequest && (
                <View style={styles.activeSessionDetails}>
                  <View style={styles.activeSessionRow}>
                    <Location01Icon size={16} color={useThemeColor({}, 'icon')} />
                    <ThemedText style={styles.activeSessionText} numberOfLines={1}>
                      {activeRequest.pickupAddress}
                    </ThemedText>
                  </View>
                  <View style={styles.activeSessionRow}>
                    <Flag01Icon size={16} color={useThemeColor({}, 'icon')} />
                    <ThemedText style={styles.activeSessionText} numberOfLines={1}>
                      {activeRequest.destinationAddress}
                    </ThemedText>
                  </View>
                  <View style={styles.activeSessionRow}>
                    <Car01Icon size={16} color={useThemeColor({}, 'icon')} />
                    <ThemedText style={styles.activeSessionText}>
                      {activeRequest.vehicleType.charAt(0).toUpperCase() + activeRequest.vehicleType.slice(1)}
                    </ThemedText>
                  </View>
                </View>
              )}

              <PrimaryButton
                label="View Session"
                onPress={handleViewActiveSession}
                isLoading={false}
              />
            </BottomSheetView>
          </BottomSheet>
        )}

        {/* Place Order Bottom Sheet (hidden when active session exists) */}
        {!hasActiveSession && (
          <BottomSheet
            ref={placeOrderSheetRef}
            index={1}
            snapPoints={placeOrderSnapPoints}
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
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  profileButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
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
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  activeSessionContent: {
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
  activeSessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  activeSessionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activeSessionInfo: {
    flex: 1,
  },
  activeSessionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  activeSessionStatus: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  activeSessionDetails: {
    marginBottom: 20,
    gap: 12,
  },
  activeSessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeSessionText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
});
