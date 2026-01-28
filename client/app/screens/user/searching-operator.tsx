/**
 * SearchingOperator Screen
 * 
 * Displayed while searching for an available tow operator.
 * Shows a loading animation and allows cancellation.
 * Uses realtime subscriptions to detect when a driver is matched.
 */

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PulseLoader from '@/components/pulse-loader';
import {
  subscribeTowRequest,
  unsubscribe,
} from '@/services/realtimeService';
import {
  getTowRequest,
  cancelTowRequest,
  type RequestStatus,
} from '@/services/requestService';

export default function SearchingOperatorScreen() {
  const params = useLocalSearchParams<{ requestId: string }>();
  const requestId = params.requestId;

  const [status, setStatus] = useState<RequestStatus>('pending');

  useEffect(() => {
    if (!requestId) {
      Alert.alert('Error', 'Request ID not found');
      router.back();
      return;
    }

    // Load initial request status
    loadRequest();

    // Setup realtime subscription
    const channel = subscribeTowRequest(requestId, (updatedRequest) => {
      console.log('Request updated:', updatedRequest);
      setStatus(updatedRequest.status);

      // Navigate when driver is matched
      if (updatedRequest.status === 'matched') {
        router.replace({
          pathname: '/screens/user/operator-found',
          params: { requestId },
        });
      } else if (updatedRequest.status === 'driver_enroute') {
        router.replace({
          pathname: '/screens/user/live-tracking',
          params: { requestId },
        });
      } else if (updatedRequest.status === 'cancelled') {
        Alert.alert('Request Cancelled', 'Your tow request was cancelled');
        router.replace('/screens/user/home-screen');
      }
    });

    return () => {
      unsubscribe(channel);
    };
  }, [requestId]);

  const loadRequest = async () => {
    try {
      const request = await getTowRequest(requestId);
      setStatus(request.status);

      // If already matched, navigate immediately
      if (request.status === 'matched') {
        router.replace({
          pathname: '/screens/user/operator-found',
          params: { requestId },
        });
      }
    } catch (error) {
      console.error('Error loading request:', error);
    }
  };

  const handleCancel = async () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelTowRequest(requestId);
              Alert.alert('Cancelled', 'Your request has been cancelled');
              router.replace('/screens/user/home-screen');
            } catch (error) {
              console.error('Error cancelling request:', error);
              Alert.alert('Error', 'Failed to cancel request');
            }
          },
        },
      ]
    );
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
