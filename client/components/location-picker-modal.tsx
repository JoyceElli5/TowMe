import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  geocode,
  getCurrentLocationWithAddress,
  getPlaceDetails,
  getPlacePredictions,
  reverseGeocode,
  type Coordinates,
  type PlacePrediction,
} from '@/lib/services/locationService';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { CheckmarkCircle01Icon, Location01Icon } from 'hugeicons-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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

const RECENT_KEY = 'towme_recent_locations';
const MAX_RECENT = 5;

interface RecentLocation {
  address: string;
  lat: number;
  lng: number;
}

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
  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(null);
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Autocomplete state
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentLocations, setRecentLocations] = useState<RecentLocation[]>([]);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const textColor = useThemeColor({}, 'text');
  const buttonColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');

  // Load recent locations from storage
  const loadRecent = useCallback(async () => {
    try {
      const raw = await SecureStore.getItemAsync(RECENT_KEY);
      if (raw) setRecentLocations(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const saveRecent = useCallback(async (loc: RecentLocation) => {
    try {
      const raw = await SecureStore.getItemAsync(RECENT_KEY);
      const existing: RecentLocation[] = raw ? JSON.parse(raw) : [];
      const filtered = existing.filter(r => r.address !== loc.address);
      const updated = [loc, ...filtered].slice(0, MAX_RECENT);
      await SecureStore.setItemAsync(RECENT_KEY, JSON.stringify(updated));
      setRecentLocations(updated);
    } catch { /* ignore */ }
  }, []);

  // Load initial state when modal opens
  useEffect(() => {
    if (!visible) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    loadRecent();

    const load = async () => {
      setLoading(true);
      try {
        if (initialLocation) {
          setSelectedLocation(initialLocation);
          setUserLocation(initialLocation);
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
            setUserLocation(loc.coordinates);
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
  }, [visible, initialLocation, loadRecent]);

  // Debounced autocomplete fetch
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    setShowDropdown(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!text || text.trim().length < 2) {
      setPredictions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await getPlacePredictions(text.trim(), userLocation ?? undefined);
        setPredictions(results);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [userLocation]);

  // Select a prediction from the dropdown
  const handleSelectPrediction = useCallback(async (prediction: PlacePrediction) => {
    setSearchQuery(prediction.description);
    setPredictions([]);
    setShowDropdown(false);
    setSearching(true);

    try {
      // Try Places detail API for precise coordinates
      const detail = await getPlaceDetails(prediction.placeId);
      if (detail) {
        const coords = { lat: detail.lat, lng: detail.lng };
        setSelectedLocation(coords);
        setAddress(detail.address || prediction.description);
        setMapRegion({
          latitude: detail.lat,
          longitude: detail.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        return;
      }

      // Fallback: geocode the description text
      const coords = await geocode(prediction.description);
      if (coords) {
        setSelectedLocation(coords);
        setAddress(prediction.description);
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
  }, []);

  // Select a recent location
  const handleSelectRecent = useCallback((recent: RecentLocation) => {
    setSearchQuery(recent.address);
    setSelectedLocation({ lat: recent.lat, lng: recent.lng });
    setAddress(recent.address);
    setShowDropdown(false);
    setPredictions([]);
    setMapRegion({
      latitude: recent.lat,
      longitude: recent.lng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  }, []);

  // Manual search (submit button / return key)
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setShowDropdown(false);
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
  }, [searchQuery]);

  // Map tap
  const handleMapPress = useCallback(async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const coords = { lat: latitude, lng: longitude };
    setSelectedLocation(coords);
    setShowDropdown(false);
    try {
      const addr = await reverseGeocode(coords);
      setAddress(addr);
      setSearchQuery(addr);
    } catch { /* ignore */ }
  }, []);

  // Confirm
  const handleConfirm = useCallback(() => {
    if (!selectedLocation || !address) return;
    saveRecent({ address, lat: selectedLocation.lat, lng: selectedLocation.lng });
    onSelect(address, selectedLocation);
    onClose();
  }, [selectedLocation, address, onSelect, onClose, saveRecent]);

  const showSuggestions = showDropdown && (predictions.length > 0 || (searchQuery.length < 2 && recentLocations.length > 0));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <SafeAreaView style={{ backgroundColor }} edges={['top']}>
          <View style={[styles.header, { borderBottomColor: borderColor, borderBottomWidth: 1 }]}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <ThemedText style={{ color: '#6b7280', fontSize: 16 }}>Cancel</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.title}>{title}</ThemedText>
            <View style={styles.headerButton} />
          </View>
        </SafeAreaView>

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor, borderBottomColor: borderColor }]}>
          <Location01Icon size={20} color={textColor} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search location..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearch}
            onFocus={() => setShowDropdown(true)}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searching ? (
            <ActivityIndicator size="small" color={buttonColor} />
          ) : searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setPredictions([]); setShowDropdown(false); }}>
              <ThemedText style={{ color: '#9ca3af', fontSize: 18 }}>✕</ThemedText>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Autocomplete Dropdown — rendered inline so it pushes the map down */}
        {showSuggestions && (
          <View style={[styles.dropdown, { backgroundColor, borderBottomColor: borderColor }]}>
            {predictions.length > 0 && (
              <FlatList
                data={predictions}
                keyExtractor={item => item.placeId}
                keyboardShouldPersistTaps="always"
                style={styles.predictionList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.suggestionItem, { borderBottomColor: borderColor }]}
                    onPress={() => handleSelectPrediction(item)}
                  >
                    <View style={[styles.suggestionIcon, { backgroundColor: '#eff6ff' }]}>
                      <Ionicons name="location-outline" size={16} color="#3b82f6" />
                    </View>
                    <View style={styles.suggestionText}>
                      <ThemedText style={styles.suggestionMain} numberOfLines={1}>
                        {item.mainText}
                      </ThemedText>
                      {item.secondaryText ? (
                        <ThemedText style={styles.suggestionSub} numberOfLines={1}>
                          {item.secondaryText}
                        </ThemedText>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}

            {predictions.length === 0 && searchQuery.length < 2 && recentLocations.length > 0 && (
              <View>
                <ThemedText style={[styles.sectionLabel, { color: '#9ca3af' }]}>Recent</ThemedText>
                {recentLocations.map((recent, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.suggestionItem, { borderBottomColor: borderColor }]}
                    onPress={() => handleSelectRecent(recent)}
                  >
                    <View style={[styles.suggestionIcon, { backgroundColor: '#f3f4f6' }]}>
                      <Ionicons name="time-outline" size={16} color="#6b7280" />
                    </View>
                    <ThemedText style={styles.suggestionMain} numberOfLines={1}>
                      {recent.address}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {predictions.length === 0 && searchQuery.length >= 2 && !searching && (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyText}>No results found</ThemedText>
              </View>
            )}
          </View>
        )}

        {/* Map */}
        <View style={{ flex: 1 }}>
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={buttonColor} />
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

          {/* Bottom Confirmation Panel */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.bottomPanelWrapper}
          >
            <SafeAreaView style={[styles.bottomPanel, { backgroundColor }]} edges={['bottom']}>
              <View style={styles.addressPreview}>
                <View style={styles.iconBox}>
                  <CheckmarkCircle01Icon size={20} color={buttonColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.label}>Selected Location</ThemedText>
                  <ThemedText numberOfLines={2} style={styles.addressText}>
                    {address || 'Tap map or search to select'}
                  </ThemedText>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  { backgroundColor: buttonColor },
                  (!selectedLocation || !address) && styles.disabledButton,
                ]}
                onPress={handleConfirm}
                disabled={!selectedLocation || !address}
              >
                <ThemedText style={styles.confirmButtonText}>Confirm Location</ThemedText>
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
  headerButton: { minWidth: 60 },
  title: { fontSize: 17, fontWeight: '600' },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
    zIndex: 20,
  },
  searchInput: { flex: 1, fontSize: 16, height: 40 },

  dropdown: {
    maxHeight: 300,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  predictionList: { maxHeight: 300 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    textTransform: 'uppercase',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  suggestionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionText: { flex: 1 },
  suggestionMain: { fontSize: 14, fontWeight: '500' },
  suggestionSub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  emptyState: { padding: 20, alignItems: 'center' },
  emptyText: { color: '#9ca3af', fontSize: 14 },

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
    marginBottom: 16,
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
  label: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  addressText: { fontSize: 15, fontWeight: '500' },

  confirmButton: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: { opacity: 0.5 },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
