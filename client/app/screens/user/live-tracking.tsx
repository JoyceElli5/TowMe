/**
 * LiveTracking Screen (Placeholder)
 * 
 * Displays real-time tracking of the tow operator.
 * Shows map with operator location and ETA updates.
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LiveTrackingScreen() {
  const [eta, setEta] = useState(8);

  // Simulate ETA countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setEta(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          router.replace('/screens/user/trip-completed');
          return 0;
        }
        return prev - 1;
      });
    }, 3000); // Speed up for demo

    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Map */}
      <MapView
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: 5.6037,
          longitude: -0.1870,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        {/* Operator Marker */}
        <Marker
          coordinate={{ latitude: 5.6050, longitude: -0.1860 }}
          title="Tow Operator"
        >
          <View style={styles.markerContainer}>
            <Ionicons name="car-sport" size={24} color="#003554" />
          </View>
        </Marker>

        {/* User Location Marker */}
        <Marker
          coordinate={{ latitude: 5.6037, longitude: -0.1870 }}
          title="Your Location"
        >
          <View style={styles.userMarker}>
            <View style={styles.userMarkerInner} />
          </View>
        </Marker>
      </MapView>

      {/* Status Card */}
      <SafeAreaView style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Operator En Route</Text>
          <View style={styles.etaBadge}>
            <Text style={styles.etaValue}>{eta}</Text>
            <Text style={styles.etaLabel}>min</Text>
          </View>
        </View>

        <View style={styles.operatorInfo}>
          <View style={styles.operatorAvatar}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
          <View style={styles.operatorDetails}>
            <Text style={styles.operatorName}>John Doe</Text>
            <Text style={styles.vehicleInfo}>Toyota Hilux • GR-1234-21</Text>
          </View>
          <TouchableOpacity style={styles.callButton}>
            <Ionicons name="call" size={20} color="#10B981" />
          </TouchableOpacity>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((8 - eta) / 8) * 100}%` }]} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  userMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 53, 84, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#003554',
  },
  statusCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#003554',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  etaValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginRight: 4,
  },
  etaLabel: {
    fontSize: 12,
    color: '#bae6fd',
  },
  operatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  operatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#003554',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  operatorDetails: {
    flex: 1,
  },
  operatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#6b7280',
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#003554',
    borderRadius: 2,
  },
});
