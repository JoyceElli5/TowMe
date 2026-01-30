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
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor(
    { light: '#e5e7eb', dark: '#374151' },
    'background'
  );

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

    // Optimistically update markers, then fetch address
    try {
      const addr = await reverseGeocode(coords);
      setAddress(addr);
      setSearchQuery(addr); // Optional: update search with map click address
    } catch {
      // Fallback
    }
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
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.container}>
        {/* Header - No Confirm button here anymore */}
        <SafeAreaView style={{ backgroundColor }} edges={['top']}>
          <View
            style={[
              styles.header,
              { borderBottomColor: borderColor, borderBottomWidth: 1 },
            ]}
          >
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <ThemedText style={{ color: '#6b7280', fontSize: 16 }}>
                Cancel
              </ThemedText>
            </TouchableOpacity>

            <ThemedText style={styles.title}>{title}</ThemedText>

            <View style={styles.headerButton} />
          </View>
        </SafeAreaView>

        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor, borderBottomColor: borderColor },
          ]}
        >
          <Location01Icon size={20} color={textColor} />

          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search location..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />

          {searching && <ActivityIndicator size="small" />}
        </View>

        {/* Map */}
        <View style={{ flex: 1 }}>
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" />
            </View>
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

          {/* Bottom Floating Confirmation Panel */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.bottomPanelWrapper}
          >
            <SafeAreaView
              style={[styles.bottomPanel, { backgroundColor }]}
              edges={['bottom']}
            >
              {/* Selected Address Preview */}
              <View style={styles.addressPreview}>
                <View style={styles.iconBox}>
                  <CheckmarkCircle01Icon size={20} color={buttonColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.label}>Selected Location</ThemedText>
                  <ThemedText numberOfLines={1} style={styles.addressText}>
                    {address || 'Tap map to select'}
                  </ThemedText>
                </View>
              </View>

              {/* Confirm Button */}
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  { backgroundColor: buttonColor },
                  (!selectedLocation || !address) && styles.disabledButton,
                ]}
                onPress={handleConfirm}
                disabled={!selectedLocation || !address}
              >
                <ThemedText style={styles.confirmButtonText}>
                  Confirm Location
                </ThemedText>
              </TouchableOpacity>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </View>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  headerButton: {
    minWidth: 60,
  },

  title: {
    fontSize: 17,
    fontWeight: '600',
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
    zIndex: 10,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    height: 40,
  },

  map: { flex: 1 },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  bottomPanelWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },

  bottomPanel: {
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },

  addressPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },

  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  label: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },

  addressText: {
    fontSize: 16,
    fontWeight: '500',
  },

  confirmButton: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  disabledButton: {
    opacity: 0.5,
  },

  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
