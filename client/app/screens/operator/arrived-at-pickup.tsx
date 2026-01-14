/**
 * Arrived at Pickup Screen (Placeholder)
 * 
 * Displayed when operator arrives at pickup location.
 * Allows operator to confirm vehicle loading and start towing.
 */

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

export default function ArrivedAtPickupScreen() {
  const handleStartTowing = () => {
    router.replace('/screens/operator/towing-in-progress');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>

        <Text style={styles.title}>You&apos;ve Arrived!</Text>
        <Text style={styles.subtitle}>
          Meet the customer and load the vehicle onto your tow truck
        </Text>

        {/* Customer Card */}
        <View style={styles.customerCard}>
          <View style={styles.customerAvatar}>
            <Text style={styles.avatarText}>SK</Text>
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>Sarah Kofi</Text>
            <Text style={styles.vehicleInfo}>Toyota Corolla • Silver</Text>
          </View>
          <TouchableOpacity style={styles.callButton}>
            <Text style={styles.callIcon}>📞</Text>
          </TouchableOpacity>
        </View>

        {/* Checklist */}
        <View style={styles.checklist}>
          <Text style={styles.checklistTitle}>Before Starting</Text>
          
          <View style={styles.checkItem}>
            <View style={styles.checkbox}>
              <Text style={styles.checkboxText}>✓</Text>
            </View>
            <Text style={styles.checkText}>Confirm vehicle identity</Text>
          </View>
          
          <View style={styles.checkItem}>
            <View style={styles.checkbox}>
              <Text style={styles.checkboxText}>✓</Text>
            </View>
            <Text style={styles.checkText}>Secure vehicle on tow truck</Text>
          </View>
          
          <View style={styles.checkItem}>
            <View style={styles.checkbox}>
              <Text style={styles.checkboxText}>✓</Text>
            </View>
            <Text style={styles.checkText}>Confirm destination with customer</Text>
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartTowing}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Start Towing</Text>
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
    paddingHorizontal: 20,
  },
  customerCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#003554',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
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
  callIcon: {
    fontSize: 20,
  },
  checklist: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxText: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '700',
  },
  checkText: {
    fontSize: 14,
    color: '#374151',
  },
  startButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#003554',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 24,
    shadowColor: '#003554',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
