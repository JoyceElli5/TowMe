/**
 * Incoming Request Screen
 * 
 * Displays new tow request for operator to accept or decline.
 * Shows pickup/destination info and estimated earnings.
 */

import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import {
  getRequestById,
  acceptRequest,
  ApiError,
  type TowingRequest,
} from '@/lib/api';

// Estimated minutes per kilometer for duration calculation
const MINUTES_PER_KM_ESTIMATE = 2.5;

// Helper function to capitalize vehicle type
const formatVehicleType = (vehicleType?: string): string => {
  if (!vehicleType) return 'Unknown';
  return vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1);
};

export default function IncomingRequestScreen() {
  const params = useLocalSearchParams<{ requestId: string }>();
  const [request, setRequest] = useState<TowingRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  // Fetch request details
  useEffect(() => {
    const fetchRequest = async () => {
      if (!params.requestId) {
        router.back();
        return;
      }

      try {
        const requestData = await getRequestById(params.requestId);
        setRequest(requestData);
      } catch (error) {
        console.error('Failed to fetch request:', error);
        Alert.alert('Error', 'Failed to load request details');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequest();
  }, [params.requestId]);

  const handleAccept = async () => {
    if (!params.requestId) return;

    setIsAccepting(true);
    try {
      await acceptRequest(params.requestId);
      router.replace({
        pathname: '/screens/operator/navigation-to-pickup',
        params: { requestId: params.requestId },
      });
    } catch (error) {
      console.error('Failed to accept request:', error);
      if (error instanceof ApiError) {
        Alert.alert('Error', error.message || 'Failed to accept request');
      } else {
        Alert.alert('Error', 'An unexpected error occurred');
      }
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = () => {
    router.back();
  };

  // Get user initials
  const getUserInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#003554" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading request...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#003554" />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>New Tow Request</Text>
          <Text style={styles.headerSubtitle}>Review the details and accept or decline</Text>
        </View>

        {/* Request Card */}
        <View style={styles.requestCard}>
          {/* User Info */}
          <View style={styles.userSection}>
            <View style={styles.userAvatar}>
              <Text style={styles.avatarText}>{getUserInitials(request?.user?.fullName)}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{request?.user?.fullName || 'Unknown User'}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.rating}>{request?.user?.averageRating?.toFixed(1) || '0.0'}</Text>
              </View>
            </View>
            <View style={styles.earningsContainer}>
              <Text style={styles.earningsLabel}>Earnings</Text>
              <Text style={styles.earningsValue}>GH₵ {request?.estimatedPrice?.toFixed(0) || '0'}</Text>
            </View>
          </View>

          {/* Trip Details */}
          <View style={styles.tripDetails}>
            <View style={styles.locationRow}>
              <View style={styles.locationDot} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Pickup</Text>
                <Text style={styles.locationText}>{request?.pickupAddress || 'Loading...'}</Text>
              </View>
            </View>
            
            <View style={styles.locationLine} />
            
            <View style={styles.locationRow}>
              <View style={[styles.locationDot, styles.destinationDot]} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Destination</Text>
                <Text style={styles.locationText}>{request?.destinationAddress || 'Loading...'}</Text>
              </View>
            </View>
          </View>

          {/* Trip Info */}
          <View style={styles.tripInfo}>
            <View style={styles.tripInfoItem}>
              <Text style={styles.tripInfoValue}>{request?.distanceKm?.toFixed(1) || '0'} km</Text>
              <Text style={styles.tripInfoLabel}>Distance</Text>
            </View>
            <View style={styles.tripInfoItem}>
              <Text style={styles.tripInfoValue}>~{Math.ceil((request?.distanceKm || 0) * MINUTES_PER_KM_ESTIMATE)} min</Text>
              <Text style={styles.tripInfoLabel}>Est. Duration</Text>
            </View>
            <View style={styles.tripInfoItem}>
              <Text style={styles.tripInfoValue}>{formatVehicleType(request?.vehicleType)}</Text>
              <Text style={styles.tripInfoLabel}>Vehicle</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.declineButton}
            onPress={handleDecline}
            activeOpacity={0.7}
            disabled={isAccepting}
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.acceptButton, isAccepting && styles.buttonDisabled]}
            onPress={handleAccept}
            activeOpacity={0.8}
            disabled={isAccepting}
          >
            {isAccepting ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#ffffff" size="small" />
                <Text style={[styles.acceptButtonText, { marginLeft: 12 }]}>Accepting...</Text>
              </View>
            ) : (
              <Text style={styles.acceptButtonText}>Accept</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#003554',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'flex-start',
    paddingVertical: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Gilroy-SemiBold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    color: '#bae6fd',
  },
  requestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontFamily: 'Gilroy-SemiBold',
    color: '#003554',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontFamily: 'Gilroy-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontFamily: 'Gilroy-Medium',
    color: '#6b7280',
  },
  earningsContainer: {
    alignItems: 'flex-end',
  },
  earningsLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  earningsValue: {
    fontSize: 22,
    fontFamily: 'Gilroy-SemiBold',
    color: '#22c55e',
  },
  tripDetails: {
    marginBottom: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    marginTop: 4,
    marginRight: 12,
  },
  destinationDot: {
    backgroundColor: '#ef4444',
  },
  locationLine: {
    width: 2,
    height: 24,
    backgroundColor: '#e5e7eb',
    marginLeft: 5,
    marginVertical: 4,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    fontFamily: 'Gilroy-Regular',
    color: '#6b7280',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 15,
    fontFamily: 'Gilroy-Medium',
    color: '#111827',
  },
  tripInfo: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
  },
  tripInfoItem: {
    flex: 1,
    alignItems: 'center',
  },
  tripInfoValue: {
    fontSize: 16,
    fontFamily: 'Gilroy-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  tripInfoLabel: {
    fontSize: 12,
    fontFamily: 'Gilroy-Regular',
    color: '#6b7280',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
    marginBottom: 24,
  },
  declineButton: {
    flex: 1,
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  declineButtonText: {
    fontSize: 16,
    fontFamily: 'Gilroy-SemiBold',
    color: '#ffffff',
  },
  acceptButton: {
    flex: 2,
    height: 56,
    backgroundColor: '#22c55e',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptButtonText: {
    fontSize: 16,
    fontFamily: 'Gilroy-SemiBold',
    color: '#ffffff',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
