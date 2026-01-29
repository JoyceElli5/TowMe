/**
 * OperatorFound Screen (Placeholder)
 * 
 * Displayed when a tow operator accepts the request.
 * Shows operator details and ETA.
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OperatorFoundScreen() {
  const handleTrack = () => {
    router.push('/screens/user/live-tracking');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>

        <Text style={styles.title}>Operator Found!</Text>
        <Text style={styles.subtitle}>
          A tow operator is on the way to your location
        </Text>

        {/* Operator Card */}
        <View style={styles.operatorCard}>
          <View style={styles.operatorAvatar}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
          <View style={styles.operatorInfo}>
            <Text style={styles.operatorName}>John Doe</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.rating}>4.8</Text>
              <Text style={styles.trips}>(256 trips)</Text>
            </View>
          </View>
          <View style={styles.etaContainer}>
            <Text style={styles.etaValue}>8</Text>
            <Text style={styles.etaLabel}>min</Text>
          </View>
        </View>

        {/* Vehicle Info */}
        <View style={styles.vehicleCard}>
          <View style={styles.vehicleIconContainer}>
            <Ionicons name="car-sport" size={32} color="#003554" />
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleName}>Toyota Hilux</Text>
            <Text style={styles.vehiclePlate}>GR-1234-21</Text>
          </View>
        </View>

        {/* Track Button */}
        <TouchableOpacity
          style={styles.trackButton}
          onPress={handleTrack}
          activeOpacity={0.8}
        >
          <Text style={styles.trackButtonText}>Track Operator</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  checkIcon: {
    fontSize: 40,
    color: '#22c55e',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  operatorCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  operatorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#003554',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  operatorInfo: {
    flex: 1,
  },
  operatorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginRight: 4,
  },
  trips: {
    fontSize: 14,
    color: '#6b7280',
  },
  etaContainer: {
    alignItems: 'center',
    backgroundColor: '#003554',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  etaValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  etaLabel: {
    fontSize: 12,
    color: '#bae6fd',
  },
  vehicleCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  vehicleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  vehiclePlate: {
    fontSize: 14,
    color: '#6b7280',
  },
  trackButton: {
    width: '100%',
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
  trackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
