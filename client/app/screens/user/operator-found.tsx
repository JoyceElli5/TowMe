/**
 * OperatorFound Screen (Placeholder)
 * 
 * Displayed when a tow operator accepts the request.
 * Shows operator details and ETA.
 */

import { router, useLocalSearchParams } from 'expo-router';
import { Car01Icon, CheckmarkCircle01Icon, Phone01Icon, StarIcon, Location01Icon } from 'hugeicons-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Linking,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useToast } from '@/hooks/use-toast';
import { ApiError, getRequestById, trackRequest, type TowingRequest } from '@/lib/api';
import { subscribeToRequest, unsubscribe } from '@/lib/services/realtimeService';
import { reverseGeocode } from '@/lib/services/locationService';
import type { RealtimeChannel } from '@supabase/supabase-js';

export default function OperatorFoundScreen() {
  const params = useLocalSearchParams<{ requestId?: string }>();
  const requestId = params.requestId;
  const { showToast } = useToast();
  const [request, setRequest] = useState<TowingRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [eta, setEta] = useState<number | null>(null);
  const [operatorLocation, setOperatorLocation] = useState<{
    latitude: number;
    longitude: number;
    heading: number | null;
    timestamp: string;
  } | null>(null);
  const [operatorLocationAddress, setOperatorLocationAddress] = useState<string | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'background');

  const loadRequest = React.useCallback(async () => {
    if (!requestId) return;
    
    try {
      setIsLoading(true);
      
      // Use trackRequest to get both request and operator location
      const trackingData = await trackRequest(requestId);
      setRequest(trackingData.request);
      setOperatorLocation(trackingData.operatorLocation);
      
      // Get operator location address if available
      if (trackingData.operatorLocation) {
        try {
          const address = await reverseGeocode({
            lat: trackingData.operatorLocation.latitude,
            lng: trackingData.operatorLocation.longitude,
          });
          setOperatorLocationAddress(address);
        } catch (error) {
          console.error('Error getting operator location address:', error);
        }
      }
      
      // Calculate ETA based on operator location if available, otherwise use distance
      if (trackingData.operatorLocation && trackingData.request.pickupLat) {
        // Calculate distance from operator to pickup
        const distance = Math.sqrt(
          Math.pow(trackingData.request.pickupLat - trackingData.operatorLocation.latitude, 2) +
          Math.pow(trackingData.request.pickupLng - trackingData.operatorLocation.longitude, 2)
        ) * 111; // Convert to km
        setEta(Math.ceil(distance * 2)); // 1km = 2 minutes
      } else if (trackingData.request.distanceKm) {
        // Fallback to request distance
        setEta(Math.ceil(trackingData.request.distanceKm * 2));
      }
    } catch (error) {
      console.error('Error loading request:', error);
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to load request details', 'error');
      }
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [requestId, showToast]);

  useEffect(() => {
    if (requestId) {
      loadRequest();
      
      // Subscribe to real-time updates
      const subscription = subscribeToRequest(requestId, (payload) => {
        console.log('Request update:', payload);
        
        if (payload.eventType === 'UPDATE' && payload.new) {
          // Reload request data when status changes
          loadRequest();
          
          // Navigate to live tracking if trip started
          if (payload.new.status === 'in_progress') {
            router.replace({
              pathname: '/screens/user/live-tracking',
              params: { requestId },
            });
          }
        }
      });
      
      setChannel(subscription);
      
      // Poll for location updates every 10 seconds
      const locationInterval = setInterval(() => {
        if (request?.operatorId) {
          loadRequest();
        }
      }, 10000);
      
      return () => {
        if (subscription) {
          unsubscribe(subscription);
        }
        clearInterval(locationInterval);
      };
    } else {
      showToast('Request ID not found', 'error');
      router.back();
    }
  }, [requestId, loadRequest, showToast, request?.operatorId]);

  const handleTrack = () => {
    if (requestId) {
      router.push({
        pathname: '/screens/user/live-tracking',
        params: { requestId },
      });
    }
  };

  const handleCall = () => {
    if (request?.operator?.phone) {
      Linking.openURL(`tel:${request.operator.phone}`).catch(() => {
        showToast('Unable to make phone call', 'error');
      });
    } else {
      showToast('Operator phone number not available', 'error');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#003554" />
          <ThemedText style={styles.loadingText}>Loading operator details...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (!request || !request.operator) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.errorText}>Operator information not available</ThemedText>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <CheckmarkCircle01Icon size={64} color="#10B981" strokeWidth={2} />
        </View>

        <ThemedText style={styles.title}>Operator Found!</ThemedText>
        <ThemedText style={styles.subtitle}>
          A tow operator is on the way to your location
        </ThemedText>

        {/* Operator Card */}
        <View style={[styles.operatorCard, { borderColor }]}>
          <View style={styles.operatorHeader}>
            <View style={styles.operatorAvatar}>
              {request.operator.avatarUrl ? (
                <Image
                  source={{ uri: request.operator.avatarUrl }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarText}>{getInitials(request.operator.fullName)}</Text>
              )}
            </View>
            <View style={styles.operatorInfo}>
              <ThemedText style={styles.operatorName}>{request.operator.fullName}</ThemedText>
              <View style={styles.ratingRow}>
                <StarIcon size={14} color="#F59E0B" strokeWidth={2} />
                <ThemedText style={styles.rating}>
                  {request.operator.averageRating?.toFixed(1) || '0.0'}
                </ThemedText>
              </View>
            </View>
            {eta !== null && (
              <View style={styles.etaContainer}>
                <Text style={styles.etaValue}>{eta}</Text>
                <Text style={styles.etaLabel}>min</Text>
              </View>
            )}
          </View>
          
          {/* Operator Details */}
          <View style={styles.operatorDetails}>
            {request.operator.phone && (
              <TouchableOpacity
                style={styles.detailRow}
                onPress={handleCall}
              >
                <Phone01Icon size={20} color="#003554" strokeWidth={2} />
                <ThemedText style={styles.detailText}>{request.operator.phone}</ThemedText>
                <ThemedText style={styles.callLabel}>Tap to call</ThemedText>
              </TouchableOpacity>
            )}
            
            {operatorLocation && (
              <View style={styles.detailRow}>
                <Location01Icon size={20} color="#003554" strokeWidth={2} />
                <View style={styles.locationInfo}>
                  <ThemedText style={styles.detailText}>Coming From</ThemedText>
                  <ThemedText style={styles.locationSubtext}>
                    {operatorLocationAddress || 'Location available'}
                  </ThemedText>
                  {operatorLocation.timestamp && (
                    <ThemedText style={styles.locationTime}>
                      Updated {new Date(operatorLocation.timestamp).toLocaleTimeString()}
                    </ThemedText>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Trip Info */}
        <View style={styles.vehicleCard}>
          <View style={styles.vehicleIconContainer}>
            <Car01Icon size={32} color="#003554" strokeWidth={2} />
          </View>
          <View style={styles.vehicleInfo}>
            <ThemedText style={styles.vehicleName}>
              {request.vehicleType.charAt(0).toUpperCase() + request.vehicleType.slice(1)}
            </ThemedText>
            <ThemedText style={styles.vehiclePlate}>
              {request.distanceKm?.toFixed(1) || '0'} km • GH₵ {request.estimatedPrice?.toFixed(2) || '0.00'}
            </ThemedText>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#003554',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  operatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  operatorInfo: {
    flex: 1,
  },
  operatorDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  callLabel: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  locationTime: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
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
