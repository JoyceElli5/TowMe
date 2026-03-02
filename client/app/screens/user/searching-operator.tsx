/**
 * SearchingOperator Screen (Placeholder)
 * 
 * Displayed while searching for an available tow operator.
 * Shows a loading animation and allows cancellation.
 */

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PulseLoader from '@/components/pulse-loader';
import { useToast } from '@/hooks/use-toast';
import { useActiveRequest } from '@/hooks/use-active-request';
import { ApiError, cancelRequest, trackRequest } from '@/lib/api';
import { subscribeToRequest, unsubscribe } from '@/lib/services/realtimeService';
import type { RealtimeChannel } from '@supabase/supabase-js';

export default function SearchingOperatorScreen() {
  const params = useLocalSearchParams<{ requestId?: string }>();
  const requestId = params.requestId;
  const { activeRequest } = useActiveRequest();
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const { showToast } = useToast();
  const [isCancelling, setIsCancelling] = useState(false);
  const [pollTimer, setPollTimer] = useState<NodeJS.Timeout | null>(null);

  // Subscribe to request changes
  useEffect(() => {
    if (!requestId) {
      // If for some reason we don't have a requestId, just go back after a short delay
      const timer = setTimeout(() => {
        router.back();
      }, 3000);
      return () => clearTimeout(timer);
    }

    // 1) Supabase realtime subscription for status updates
    const subscription = subscribeToRequest(requestId, (payload) => {
      console.log('Request update:', payload);
      
      if (payload.eventType === 'UPDATE' && payload.new) {
        const status = payload.new.status;
        
        if (status === 'accepted') {
          router.replace({
            pathname: '/screens/user/operator-found',
            params: { requestId },
          });
        } else if (status === 'cancelled') {
          router.back();
        }
      }
    });

    setChannel(subscription);

    // 2) Fallback polling if realtime isn't firing (e.g. Supabase not fully configured)
    const interval = setInterval(async () => {
      try {
        const result = await trackRequest(requestId);
        const status = result.request.status;

        if (status === 'accepted') {
          clearInterval(interval);
          router.replace({
            pathname: '/screens/user/operator-found',
            params: { requestId },
          });
        } else if (status === 'cancelled') {
          clearInterval(interval);
          router.back();
        }
      } catch (error) {
        // Silent here; we still have realtime + manual navigation
        console.error('Error polling request status:', error);
      }
    }, 5000);

    setPollTimer(interval);

    return () => {
      if (subscription) {
        unsubscribe(subscription);
      }
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [requestId]);

  // Also react to activeRequest changes (fallback based on central session state)
  useEffect(() => {
    if (!activeRequest) return;

    if (activeRequest.status === 'accepted') {
      router.replace({
        pathname: '/screens/user/operator-found',
        params: { requestId: activeRequest.id },
      });
    } else if (activeRequest.status === 'in_progress') {
      router.replace({
        pathname: '/screens/user/live-tracking',
        params: { requestId: activeRequest.id },
      });
    }
  }, [activeRequest]);

  const handleCancel = async () => {
    if (!requestId) {
      router.back();
      return;
    }

    setIsCancelling(true);
    try {
      await cancelRequest(requestId, 'Cancelled by user');
      showToast('Request cancelled successfully', 'success');
      router.replace('/screens/user/home-screen');
    } catch (error) {
      console.error('Cancel request error:', error);
      if (error instanceof ApiError) {
        showToast(error.message || 'Failed to cancel request', 'error');
      } else {
        showToast('Failed to cancel request', 'error');
      }
    } finally {
      if (pollTimer) {
        clearInterval(pollTimer);
      }
      setIsCancelling(false);
    }
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
          style={[styles.cancelButton, isCancelling && styles.cancelButtonDisabled]}
          onPress={handleCancel}
          activeOpacity={0.7}
          disabled={isCancelling}
        >
          <Ionicons name="close-circle-outline" size={20} color="#ef4444" style={styles.cancelIcon} />
          <Text style={styles.cancelButtonText}>
            {isCancelling ? 'Cancelling...' : 'Cancel Request'}
          </Text>
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
  cancelButtonDisabled: {
    opacity: 0.5,
  },
});
