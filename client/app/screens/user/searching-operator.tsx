/**
 * SearchingOperator Screen
 * 
 * Displayed while searching for an available tow operator.
 * Shows a loading animation, map with pickup location, and allows cancellation.
 * Subscribes to realtime updates and navigates when operator accepts.
 */

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import PulseLoader from '@/components/pulse-loader';
import { useToast } from '@/hooks/use-toast';
import { ApiError, cancelRequest, getRequestById, type TowingRequest } from '@/lib/api';
import { subscribeToRequest, unsubscribe } from '@/lib/services/realtimeService';
import type { RealtimeChannel } from '@supabase/supabase-js';

export default function SearchingOperatorScreen() {
  const params = useLocalSearchParams<{ requestId?: string }>();
  const requestId = params.requestId;
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [request, setRequest] = useState<TowingRequest | null>(null);
  const { showToast } = useToast();
  const [isCancelling, setIsCancelling] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);

  // Load request data
  const loadRequest = useCallback(async () => {
    if (!requestId) return;
    
    try {
      const data = await getRequestById(requestId);
      setRequest(data);
      
      // Set map region to pickup location
      if (data.pickupLat && data.pickupLng) {
        setMapRegion({
          latitude: data.pickupLat,
          longitude: data.pickupLng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      }
      
      // Navigate based on status
      if (data.status === 'accepted') {
        router.replace({
          pathname: '/screens/user/operator-found',
          params: { requestId },
        });
      } else if (data.status === 'in_progress') {
        router.replace({
          pathname: '/screens/user/live-tracking',
          params: { requestId },
        });
      } else if (data.status === 'cancelled' || data.status === 'completed') {
        router.replace('/screens/user/home-screen');
      }
    } catch (error) {
      console.error('Error loading request:', error);
    }
  }, [requestId]);

  // Subscribe to request changes and poll as fallback
  useEffect(() => {
    if (!requestId) {
      // No requestId - go back
      showToast('Request ID not found', 'error');
      router.back();
      return;
    }

    // Initial load
    loadRequest();

    // Subscribe to realtime updates
    const subscription = subscribeToRequest(requestId, (payload) => {
      console.log('Request update received:', payload);
      
      if (payload.eventType === 'UPDATE' && payload.new) {
        const status = payload.new.status;
        
        if (status === 'accepted') {
          router.replace({
            pathname: '/screens/user/operator-found',
            params: { requestId },
          });
        } else if (status === 'in_progress') {
          router.replace({
            pathname: '/screens/user/live-tracking',
            params: { requestId },
          });
        } else if (status === 'cancelled') {
          showToast('Request was cancelled', 'info');
          router.replace('/screens/user/home-screen');
        }
      }
    });

    setChannel(subscription);

    // Polling fallback - check every 5 seconds in case realtime fails
    const pollInterval = setInterval(() => {
      loadRequest();
    }, 5000);

    return () => {
      if (subscription) {
        unsubscribe(subscription);
      }
      clearInterval(pollInterval);
    };
  }, [requestId, loadRequest, showToast]);

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
      setIsCancelling(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Map showing pickup location */}
      {mapRegion && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            region={mapRegion}
            showsUserLocation
          >
            {request && (
              <Marker
                coordinate={{
                  latitude: request.pickupLat,
                  longitude: request.pickupLng,
                }}
                title="Pickup Location"
                pinColor="#3B82F6"
              />
            )}
          </MapView>
          
          {/* Overlay with pulse animation */}
          <View style={styles.mapOverlay}>
            <PulseLoader icon="car-sport" iconColor="#003554" pulseColor="#e0f2fe" size={80} />
          </View>
        </View>
      )}

      <View style={styles.content}>
        {/* Text Content */}
        <Text style={styles.title}>Searching for Operator</Text>
        <Text style={styles.subtitle}>
          Please wait while we find the best tow operator near you...
        </Text>
        
        {request && (
          <View style={styles.requestInfo}>
            <Text style={styles.infoLabel}>From:</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{request.pickupAddress}</Text>
            <Text style={styles.infoLabel}>To:</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{request.destinationAddress}</Text>
          </View>
        )}

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
  mapContainer: {
    height: '45%',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 24,
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
    marginBottom: 24,
  },
  requestInfo: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Gilroy-Medium',
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Gilroy-SemiBold',
    color: '#111827',
    marginBottom: 12,
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
