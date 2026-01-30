// import { ThemedText } from '@/components/themed-text';
// import { ThemedView } from '@/components/themed-view';
// import { Fonts } from '@/constants/theme';
// import { useThemeColor } from '@/hooks/use-theme-color';
// import { geocode, getCurrentLocationWithAddress, reverseGeocode, type Coordinates } from '@/lib/services/locationService';
// import { CheckmarkCircle01Icon, Location01Icon } from 'hugeicons-react-native';
// import React, { useCallback, useEffect, useState } from 'react';
// import {
//     ActivityIndicator,
//     KeyboardAvoidingView,
//     Modal,
//     Platform,
//     StyleSheet,
//     TextInput,
//     TouchableOpacity,
//     View,
// } from 'react-native';
// import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';

// interface LocationPickerModalProps {
//   visible: boolean;
//   onClose: () => void;
//   onSelect: (address: string, coordinates: Coordinates) => void;
//   initialLocation?: Coordinates;
//   title?: string;
// }

// export default function LocationPickerModal({
//   visible,
//   onClose,
//   onSelect,
//   initialLocation,
//   title = 'Select Location',
// }: LocationPickerModalProps) {
//   const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(initialLocation || null);
//   const [address, setAddress] = useState<string>('');
//   const [searchQuery, setSearchQuery] = useState<string>('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [isSearching, setIsSearching] = useState(false);

//   // Debug: Log when modal becomes visible
//   useEffect(() => {
//     if (visible) {
//       console.log('LocationPickerModal: Modal opened', { title, initialLocation });
//     }
//   }, [visible, title, initialLocation]);
//   const [mapRegion, setMapRegion] = useState<Region | null>(null);

//   const backgroundColor = useThemeColor({}, 'background');
//   const textColor = useThemeColor({}, 'text');
//   const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');
//   const buttonColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');

//   const loadCurrentLocation = useCallback(async () => {
//     setIsLoading(true);
//     try {
//       const location = await getCurrentLocationWithAddress();
//       if (location) {
//         setSelectedLocation(location.coordinates);
//         setAddress(location.address);
//         setSearchQuery(location.address);
//         setMapRegion({
//           latitude: location.coordinates.lat,
//           longitude: location.coordinates.lng,
//           latitudeDelta: 0.0922,
//           longitudeDelta: 0.0421,
//         });
//       } else {
//         // Location permission denied or unavailable
//         // Set map region to Accra but DON'T set selected location or address
//         setMapRegion((prev) => prev || {
//           latitude: 5.6037, // Accra default only as last resort for map view
//           longitude: -0.1870,
//           latitudeDelta: 0.0922,
//           longitudeDelta: 0.0421,
//         });
//         // Don't set selectedLocation or address - let user choose
//         // User can search or tap on map to select location
//       }
//     } catch (error: any) {
//       console.error('Error loading current location:', error);
//       // Only set default map region, but don't set location/address
//       setMapRegion((prev) => prev || {
//         latitude: 5.6037, // Accra default only as last resort for map view
//         longitude: -0.1870,
//         latitudeDelta: 0.0922,
//         longitudeDelta: 0.0421,
//       });
//       // Don't set selectedLocation or address - let user choose
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   // Load current location when modal opens
//   useEffect(() => {
//     if (visible) {
//       console.log('LocationPickerModal: Modal opened', { title, initialLocation });
//       // Reset state when modal opens
//       if (initialLocation) {
//         setSelectedLocation(initialLocation);
//         // Reverse geocode initial location to get address
//         reverseGeocode(initialLocation).then((addr) => {
//           setAddress(addr);
//           setSearchQuery(addr);
//         }).catch(() => {
//           const fallback = `${initialLocation.lat.toFixed(6)}, ${initialLocation.lng.toFixed(6)}`;
//           setAddress(fallback);
//           setSearchQuery(fallback);
//         });
//         // Set map region to initial location
//         setMapRegion({
//           latitude: initialLocation.lat,
//           longitude: initialLocation.lng,
//           latitudeDelta: 0.0922,
//           longitudeDelta: 0.0421,
//         });
//       } else {
//         // No initial location - try to get current location
//         loadCurrentLocation();
//       }
//       setSearchQuery('');
//     } else {
//       // Reset when modal closes
//       setSelectedLocation(initialLocation || null);
//       setAddress('');
//       setSearchQuery('');
//       setMapRegion(null);
//     }
//   }, [visible, initialLocation, title, loadCurrentLocation]);

//   const handleMapPress = async (event: any) => {
//     const { latitude, longitude } = event.nativeEvent.coordinate;
//     const coordinates = { lat: latitude, lng: longitude };
//     setSelectedLocation(coordinates);

//     // Reverse geocode to get address
//     setIsLoading(true);
//     try {
//       const addr = await reverseGeocode(coordinates);
//       setAddress(addr);
//       setSearchQuery(addr);
//     } catch {
//       const fallback = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
//       setAddress(fallback);
//       setSearchQuery(fallback);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleSearch = async () => {
//     if (!searchQuery.trim()) return;

//     setIsSearching(true);
//     try {
//       const coordinates = await geocode(searchQuery);
//       if (coordinates) {
//         setSelectedLocation(coordinates);
//         setAddress(searchQuery);
//         // Update map region to show the searched location
//         setMapRegion({
//           latitude: coordinates.lat,
//           longitude: coordinates.lng,
//           latitudeDelta: 0.0922,
//           longitudeDelta: 0.0421,
//         });
//       } else {
//         // If geocoding fails, try to reverse geocode if user entered coordinates
//         const coordMatch = searchQuery.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
//         if (coordMatch) {
//           const lat = parseFloat(coordMatch[1]);
//           const lng = parseFloat(coordMatch[2]);
//           if (!isNaN(lat) && !isNaN(lng)) {
//             const coords = { lat, lng };
//             setSelectedLocation(coords);
//             const addr = await reverseGeocode(coords);
//             setAddress(addr);
//             setMapRegion({
//               latitude: lat,
//               longitude: lng,
//               latitudeDelta: 0.0922,
//               longitudeDelta: 0.0421,
//             });
//           }
//         }
//       }
//     } catch (err: any) {
//       console.error('Error searching address:', err);
//     } finally {
//       setIsSearching(false);
//     }
//   };

//   const handleConfirm = () => {
//     if (selectedLocation && address) {
//       onSelect(address, selectedLocation);
//       onClose();
//     }
//   };

//   return (
//     <Modal
//       visible={visible}
//       animationType="slide"
//       presentationStyle="pageSheet"
//       onRequestClose={onClose}
//     >
//       <ThemedView style={styles.container}>
//         <KeyboardAvoidingView
//           behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//           style={styles.keyboardView}
//         >
//           {/* Header */}
//           <View style={[styles.header, { borderBottomColor: borderColor }]}>
//             <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
//               <ThemedText style={styles.cancelText}>Cancel</ThemedText>
//             </TouchableOpacity>
//             <ThemedText style={styles.headerTitle}>{title}</ThemedText>
//             <TouchableOpacity
//               onPress={handleConfirm}
//               disabled={!selectedLocation || !address}
//               style={[
//                 styles.confirmButton,
//                 { backgroundColor: buttonColor },
//                 (!selectedLocation || !address) && styles.buttonDisabled,
//               ]}
//             >
//               <ThemedText style={styles.confirmText}>Confirm</ThemedText>
//             </TouchableOpacity>
//           </View>

//           {/* Search Bar - Fixed position at top */}
//           <View style={[styles.searchContainer, { backgroundColor, borderBottomColor: borderColor }]}>
//             <View style={[styles.searchInputContainer, { borderColor }]}>
//               <Location01Icon size={20} color={textColor} style={styles.searchIcon} />
//               <TextInput
//                 style={[styles.searchInput, { color: textColor }]}
//                 placeholder="Search or type an address"
//                 placeholderTextColor="#9ca3af"
//                 value={searchQuery}
//                 onChangeText={setSearchQuery}
//                 onSubmitEditing={handleSearch}
//                 returnKeyType="search"
//                 autoCorrect={false}
//               />
//               {isSearching && (
//                 <ActivityIndicator size="small" style={styles.searchLoader} />
//               )}
//             </View>
//             <TouchableOpacity
//               style={[
//                 styles.searchButton,
//                 { backgroundColor: buttonColor },
//                 (isSearching || !searchQuery.trim()) && styles.searchButtonDisabled,
//               ]}
//               onPress={handleSearch}
//               disabled={isSearching || !searchQuery.trim()}
//             >
//               <ThemedText style={styles.searchButtonText}>Search</ThemedText>
//             </TouchableOpacity>
//           </View>

//           {/* Map */}
//           <View style={styles.mapContainer}>
//             {isLoading ? (
//               <View style={styles.loadingContainer}>
//                 <ActivityIndicator size="large" />
//               </View>
//             ) : (
//               <MapView
//                 style={styles.map}
//                 provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
//                 initialRegion={mapRegion || {
//                   latitude: 5.6037,
//                   longitude: -0.1870,
//                   latitudeDelta: 0.0922,
//                   longitudeDelta: 0.0421,
//                 }}
//                 region={mapRegion || undefined}
//                 onRegionChangeComplete={setMapRegion}
//                 onPress={handleMapPress}
//                 showsUserLocation
//                 showsMyLocationButton
//               >
//                 {selectedLocation && (
//                   <Marker
//                     coordinate={{
//                       latitude: selectedLocation.lat,
//                       longitude: selectedLocation.lng,
//                     }}
//                     draggable
//                     onDragEnd={async (e) => {
//                       const coordinates = {
//                         lat: e.nativeEvent.coordinate.latitude,
//                         lng: e.nativeEvent.coordinate.longitude,
//                       };
//                       setSelectedLocation(coordinates);
//                       try {
//                         const addr = await reverseGeocode(coordinates);
//                         setAddress(addr);
//                         setSearchQuery(addr);
//                       } catch {
//                         const fallback = `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;
//                         setAddress(fallback);
//                         setSearchQuery(fallback);
//                       }
//                     }}
//                   />
//                 )}
//               </MapView>
//             )}
//           </View>

//           {/* Address Display */}
//           <View style={[styles.addressContainer, { backgroundColor, borderTopColor: borderColor }]}>
//             <View style={styles.addressIcon}>
//               <Location01Icon size={20} color={buttonColor} strokeWidth={2} />
//             </View>
//             <View style={styles.addressContent}>
//               <ThemedText style={styles.addressLabel}>Selected Address</ThemedText>
//               <TextInput
//                 style={[styles.addressInput, { color: textColor }]}
//                 value={address}
//                 onChangeText={(text) => {
//                   setAddress(text);
//                   setSearchQuery(text);
//                 }}
//                 placeholder="Tap on map or search to select location"
//                 placeholderTextColor="#9ca3af"
//                 multiline
//                 numberOfLines={2}
//               />
//             </View>
//             {selectedLocation && (
//               <CheckmarkCircle01Icon size={24} color={buttonColor} strokeWidth={2} />
//             )}
//           </View>
//         </KeyboardAvoidingView>
//       </ThemedView>
//     </Modal>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   keyboardView: {
//     flex: 1,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//   },
//   cancelButton: {
//     padding: 8,
//   },
//   cancelText: {
//     fontSize: 16,
//     fontFamily: Fonts.regular,
//     color: '#6b7280',
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontFamily: Fonts.semiBold,
//   },
//   confirmButton: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 8,
//   },
//   confirmText: {
//     fontSize: 16,
//     fontFamily: Fonts.semiBold,
//     color: '#fff',
//   },
//   buttonDisabled: {
//     opacity: 0.5,
//   },
//   mapContainer: {
//     flex: 1,
//     position: 'relative',
//   },
//   map: {
//     flex: 1,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   addressContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 16,
//     borderTopWidth: 1,
//   },
//   addressIcon: {
//     marginRight: 12,
//   },
//   addressContent: {
//     flex: 1,
//   },
//   addressLabel: {
//     fontSize: 12,
//     fontFamily: Fonts.medium,
//     marginBottom: 4,
//     opacity: 0.7,
//   },
//   addressText: {
//     fontSize: 16,
//     fontFamily: Fonts.regular,
//   },
//   addressInput: {
//     fontSize: 16,
//     fontFamily: Fonts.regular,
//     minHeight: 40,
//     paddingTop: 4,
//   },
//   searchContainer: {
//     padding: 16,
//     borderBottomWidth: 1,
//     flexDirection: 'row',
//     gap: 8,
//     zIndex: 1000,
//     elevation: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   searchInputContainer: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderRadius: 12,
//     paddingHorizontal: 12,
//     height: 48,
//   },
//   searchIcon: {
//     marginRight: 8,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//     fontFamily: Fonts.regular,
//     paddingVertical: 0,
//   },
//   searchLoader: {
//     marginLeft: 8,
//   },
//   searchButton: {
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     minWidth: 80,
//   },
//   searchButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontFamily: Fonts.semiBold,
//   },
//   searchButtonDisabled: {
//     opacity: 0.5,
//   },
// });




/**
 * LocationPickerModal
 *
 * Fixes:
 * - Modal uses overFullScreen (pageSheet hides search bar)
 * - SearchQuery is NOT wiped on open
 * - Search bar stays above MapView
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

import {
  geocode,
  getCurrentLocationWithAddress,
  reverseGeocode,
  type Coordinates,
} from '@/lib/services/locationService';

import { CheckmarkCircle01Icon, Location01Icon } from 'hugeicons-react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (address: string, coordinates: Coordinates) => void;
  initialLocation?: Coordinates;
  title?: string;
}

export default function LocationPickerModal({
  visible,
  onClose,
  onSelect,
  initialLocation,
  title = 'Select Location',
}: Props) {
  const [selectedLocation, setSelectedLocation] =
    useState<Coordinates | null>(null);

  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [mapRegion, setMapRegion] = useState<Region | null>(null);

  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const textColor = useThemeColor({}, 'text');
  const buttonColor = useThemeColor({}, 'tint');

  /**
   * Load location when modal opens
   */
  useEffect(() => {
    if (!visible) return;

    const load = async () => {
      setLoading(true);

      try {
        if (initialLocation) {
          setSelectedLocation(initialLocation);

          const addr = await reverseGeocode(initialLocation);
          setAddress(addr);
          setSearchQuery(addr);

          setMapRegion({
            latitude: initialLocation.lat,
            longitude: initialLocation.lng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        } else {
          const loc = await getCurrentLocationWithAddress();

          if (loc) {
            setSelectedLocation(loc.coordinates);
            setAddress(loc.address);
            setSearchQuery(loc.address);

            setMapRegion({
              latitude: loc.coordinates.lat,
              longitude: loc.coordinates.lng,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
          }
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [visible, initialLocation]);

  /**
   * Search handler
   */
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);

    try {
      const coords = await geocode(searchQuery);

      if (coords) {
        setSelectedLocation(coords);
        setAddress(searchQuery);

        setMapRegion({
          latitude: coords.lat,
          longitude: coords.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    } finally {
      setSearching(false);
    }
  };

  /**
   * Map press handler
   */
  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    const coords = { lat: latitude, lng: longitude };

    setSelectedLocation(coords);

    const addr = await reverseGeocode(coords);
    setAddress(addr);
    setSearchQuery(addr);
  };

  /**
   * Confirm selection
   */
  const handleConfirm = () => {
    if (!selectedLocation || !address) return;

    onSelect(address, selectedLocation);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <ThemedText>Cancel</ThemedText>
            </TouchableOpacity>

            <ThemedText style={styles.title}>{title}</ThemedText>

            <TouchableOpacity 
              onPress={handleConfirm}
              disabled={!selectedLocation || !address}
            >
              <ThemedText style={[
                { color: buttonColor },
                (!selectedLocation || !address) && { opacity: 0.5 }
              ]}>
                Confirm
              </ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Location01Icon size={20} color={textColor} />

          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search location..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />

          {searching && <ActivityIndicator size="small" />}
        </View>

        {/* Map */}
        <KeyboardAvoidingView style={{ flex: 1 }}>
          {loading ? (
            <ActivityIndicator size="large" style={{ marginTop: 50 }} />
          ) : (
            <MapView
              style={styles.map}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              region={mapRegion || undefined}
              onRegionChangeComplete={setMapRegion}
              onPress={handleMapPress}
              showsUserLocation
            >
              {selectedLocation && (
                <Marker
                  coordinate={{
                    latitude: selectedLocation.lat,
                    longitude: selectedLocation.lng,
                  }}
                />
              )}
            </MapView>
          )}
        </KeyboardAvoidingView>

        {/* Selected Address */}
        <SafeAreaView style={styles.addressBoxContainer} edges={['bottom']}>
          <View style={styles.addressBox}>
            <ThemedText style={styles.addressText} numberOfLines={2}>
              {address || 'Tap on map or search to select location'}
            </ThemedText>

            {selectedLocation && (
              <CheckmarkCircle01Icon size={22} color={buttonColor} />
            )}
          </View>
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  safeArea: {
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 10,
    zIndex: 999,
    backgroundColor: 'transparent',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  map: {
    flex: 1,
  },
  addressBoxContainer: {
    backgroundColor: 'transparent',
  },
  addressBox: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 16,
  },
});