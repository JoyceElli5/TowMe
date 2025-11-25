/**
 * SearchingOperator Screen (Placeholder)
 * 
 * Displayed while searching for an available tow operator.
 * Shows a loading animation and allows cancellation.
 */

import { router } from 'expo-router';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
          <View style={styles.pulseCircle}>
            <View style={styles.innerCircle}>
              <Text style={styles.truckIcon}>🚛</Text>
            </View>
          </View>
          <ActivityIndicator
            size="large"
            color="#003554"
            style={styles.loader}
          />
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
    marginBottom: 40,
    alignItems: 'center',
  },
  pulseCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#bae6fd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  truckIcon: {
    fontSize: 36,
  },
  loader: {
    marginTop: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
});
