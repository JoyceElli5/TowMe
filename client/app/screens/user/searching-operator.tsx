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
import { realtimeService } from '@/services/realtime';
import { requestService, RequestStatus } from '@/services/requests';

export default function SearchingOperatorScreen() {
  const params = useLocalSearchParams<{ requestId: string }>();
  const requestId = params.requestId;

  const { showToast } = useToast();
  const [status, setStatus] = useState<RequestStatus>('pending');

  useEffect(() => {
    if (!requestId) {
      router.back();
      return;
    }

    // 1. Trigger Matching
    matchDriver();

    // 2. Subscribe to Realtime
    const channel = realtimeService.subscribeToRequestUpdates(requestId, (payload) => {
      console.log('Realtime update:', payload);
      if (payload.status) {
        setStatus(payload.status);
        handleStatusChange(payload.status);
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [requestId]);

  const matchDriver = async () => {
    try {
      await requestService.matchDriver(requestId!);
      // If match is instant, realtime will trigger.
      // Or we can poll if we wanted to be safe.
    } catch (error) {
      console.error("Match error:", error);
      // Don't show error to user immediately, just keep searching (maybe retry logic)
    }
  };

  const handleStatusChange = (newStatus: RequestStatus) => {
    if (newStatus === 'matched' || newStatus === 'driver_enroute') {
      router.replace({
        pathname: '/screens/user/operator-found',
        params: { requestId }
      });
    } else if (newStatus === 'cancelled') {
      showToast('Request was cancelled', 'info');
      router.replace('/screens/user/home-screen');
    }
  };

  const handleCancel = async () => {
    try {
      if (requestId) {
        await requestService.cancelRequest(requestId);
        router.back();
        showToast('Request cancelled', 'success');
      }
    } catch (error) {
      showToast('Failed to cancel', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.content}>
        <View style={styles.animationContainer}>
          <PulseLoader icon="car-sport" iconColor="#003554" pulseColor="#e0f2fe" size={120} />
        </View>

        <Text style={styles.title}>Searching for Operator</Text>
        <Text style={styles.subtitle}>
          Connecting you with the nearest tow truck...
        </Text>

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
