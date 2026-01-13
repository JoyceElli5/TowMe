/**
 * SearchingOperator Screen (Placeholder)
 * 
 * Displayed while searching for an available tow operator.
 * Shows a loading animation and allows cancellation.
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PulseLoader from '@/components/pulse-loader';

export default function SearchingOperatorScreen() {
  // Simulate finding an operator after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/screens/user/operator-found');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.content}>
        {/* Animation Container */}
        <View style={styles.animationContainer}>
          <PulseLoader icon="car-sport" iconColor="#003554" pulseColor="#e0f2fe" size={120} />
        </View>

        {/* Text Content */}
        <Text style={styles.title}>Searching for Operator</Text>
        <Text style={styles.subtitle}>
          Please wait while we find the best tow operator near you...
        </Text>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <Ionicons name="close-circle-outline" size={20} color="#ef4444" style={styles.cancelIcon} />
          <Text style={styles.cancelButtonText}>Cancel Request</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  animationContainer: {
    marginBottom: 48,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Gilroy-SemiBold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  cancelIcon: {
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Gilroy-SemiBold',
    color: '#ef4444',
  },
});
