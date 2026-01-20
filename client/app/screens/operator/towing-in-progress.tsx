/**
 * Towing in Progress Screen (Placeholder)
 * 
 * Shows active towing with navigation to destination.
 * Displays progress and allows completion confirmation.
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

export default function TowingInProgressScreen() {
  const [progress, setProgress] = useState(0);

  // Simulate progress
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 5;
      });
    }, 500);

    return () => clearInterval(timer);
  }, []);

  const handleComplete = () => {
    router.replace('/screens/operator/trip-completed');
  };

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
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
      >
        {/* Destination Marker */}
        <Marker
          coordinate={{ latitude: 5.6100, longitude: -0.1800 }}
          title="Destination"
        >
          <View style={styles.destinationMarker}>
            <Ionicons name="flag" size={24} color="#EF4444" />
          </View>
        </Marker>
      </MapView>

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Towing in Progress</Text>
        </View>
      </SafeAreaView>

      {/* Bottom Card */}
      <View style={styles.bottomCard}>
        {/* Progress Info */}
        <View style={styles.progressInfo}>
          <Text style={styles.destinationLabel}>Heading to</Text>
          <Text style={styles.destinationText}>Accra Mall, Accra</Text>
        </View>

        {/* Progress Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>8.5 km</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>~20 min</Text>
            <Text style={styles.statLabel}>ETA</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{progress}%</Text>
            <Text style={styles.statLabel}>Complete</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        {/* Complete Button */}
        <TouchableOpacity
          style={[
            styles.completeButton,
            progress < 100 && styles.buttonDisabled,
          ]}
          onPress={handleComplete}
          disabled={progress < 100}
          activeOpacity={0.8}
        >
          <Text style={styles.completeButtonText}>
            {progress < 100 ? 'Towing...' : 'Complete Trip'}
          </Text>
        </TouchableOpacity>
      </View>
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
  destinationMarker: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#003554',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 20,
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  progressInfo: {
    marginBottom: 20,
  },
  destinationLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  destinationText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#003554',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 4,
  },
  completeButton: {
    height: 56,
    backgroundColor: '#003554',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#003554',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
