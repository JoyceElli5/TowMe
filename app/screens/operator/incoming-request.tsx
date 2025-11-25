/**
 * Incoming Request Screen (Placeholder)
 * 
 * Displays new tow request for operator to accept or decline.
 * Shows pickup/destination info and estimated earnings.
 */

import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function IncomingRequestScreen() {
  const [timeLeft, setTimeLeft] = useState(30);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          router.back();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAccept = () => {
    router.replace('/screens/operator/navigation-to-pickup');
  };

  const handleDecline = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#003554" />

      <View style={styles.content}>
        {/* Header with Timer */}
        <View style={styles.header}>
          <View style={styles.timerContainer}>
            <Text style={styles.timerValue}>{timeLeft}</Text>
            <Text style={styles.timerLabel}>seconds to accept</Text>
          </View>
        </View>

        {/* Request Card */}
        <View style={styles.requestCard}>
          {/* User Info */}
          <View style={styles.userSection}>
            <View style={styles.userAvatar}>
              <Text style={styles.avatarText}>SK</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>Sarah Kofi</Text>
              <View style={styles.ratingRow}>
                <Text style={styles.starIcon}>⭐</Text>
                <Text style={styles.rating}>4.7</Text>
              </View>
            </View>
            <View style={styles.earningsContainer}>
              <Text style={styles.earningsLabel}>Earnings</Text>
              <Text style={styles.earningsValue}>GH₵ 150</Text>
            </View>
          </View>

          {/* Trip Details */}
          <View style={styles.tripDetails}>
            <View style={styles.locationRow}>
              <View style={styles.locationDot} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Pickup</Text>
                <Text style={styles.locationText}>Ring Road Central, Accra</Text>
              </View>
            </View>
            
            <View style={styles.locationLine} />
            
            <View style={styles.locationRow}>
              <View style={[styles.locationDot, styles.destinationDot]} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Destination</Text>
                <Text style={styles.locationText}>Accra Mall, Accra</Text>
              </View>
            </View>
          </View>

          {/* Trip Info */}
          <View style={styles.tripInfo}>
            <View style={styles.tripInfoItem}>
              <Text style={styles.tripInfoValue}>10.2 km</Text>
              <Text style={styles.tripInfoLabel}>Distance</Text>
            </View>
            <View style={styles.tripInfoItem}>
              <Text style={styles.tripInfoValue}>~25 min</Text>
              <Text style={styles.tripInfoLabel}>Est. Duration</Text>
            </View>
            <View style={styles.tripInfoItem}>
              <Text style={styles.tripInfoValue}>Car</Text>
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
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={handleAccept}
            activeOpacity={0.8}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  timerLabel: {
    fontSize: 14,
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
    fontWeight: '700',
    color: '#003554',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '500',
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
    fontWeight: '700',
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
    color: '#6b7280',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '500',
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
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  tripInfoLabel: {
    fontSize: 12,
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
    fontWeight: '600',
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
    fontWeight: '600',
    color: '#ffffff',
  },
});
