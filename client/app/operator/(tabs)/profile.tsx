/**
 * Operator Profile Screen
 * 
 * Shows operator profile information, earnings, trip history, and settings
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useToast } from '@/hooks/use-toast';
import type { TowingRequest } from '@/lib/api';
import { getCurrentUser, logout } from '@/lib/api';
import { getOperatorRequests } from '@/lib/api/requests';
import { getOperatorProfile } from '@/lib/services/operatorService';

export default function OperatorProfileScreen() {
  const { showToast } = useToast();
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [earnings, setEarnings] = useState(0);
  const [totalTrips, setTotalTrips] = useState(0);
  const [recentTrips, setRecentTrips] = useState<TowingRequest[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.replace('/screens/auth/login-screen');
        return;
      }

      setUser(currentUser);

      const operatorProfile = await getOperatorProfile(currentUser.id);
      setProfile(operatorProfile);

      // Fetch earnings and trip history
      const tripsResponse = await getOperatorRequests(currentUser.id, {
        status: 'completed',
        limit: 10,
      });

      if (tripsResponse.data) {
        setRecentTrips(tripsResponse.data);
        setTotalTrips(tripsResponse.data.length);

        // Calculate total earnings
        const total = tripsResponse.data.reduce((sum, trip) => {
          return sum + (trip.finalPrice || trip.estimatedPrice || 0);
        }, 0);
        setEarnings(total);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showToast('Failed to load profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/screens/auth/login-screen');
            } catch (error) {
              console.error('Logout error:', error);
              showToast('Failed to logout', 'error');
            }
          },
        },
      ]
    );
  };

  const getUserInitials = (name?: string) => {
    if (!name) return 'OP';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <View style={styles.backButton} />
        <ThemedText style={styles.headerTitle}>Profile</ThemedText>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatarContainer, { backgroundColor: `${tintColor}20` }]}>
            <ThemedText style={[styles.avatarText, { color: tintColor }]}>
              {getUserInitials(user?.fullName || profile?.full_name)}
            </ThemedText>
          </View>
          <ThemedText style={styles.name}>{user?.fullName || profile?.full_name || 'Operator'}</ThemedText>
          <ThemedText style={styles.phone}>{user?.phone || profile?.phone || ''}</ThemedText>
          {profile?.average_rating && (
            <View style={styles.ratingContainer}>
              <ThemedText style={styles.rating}>⭐ {profile.average_rating.toFixed(1)}</ThemedText>
            </View>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor }]}>
            <Ionicons name="wallet-outline" size={24} color={tintColor} />
            <ThemedText style={[styles.statValue, { color: tintColor }]}>GH₵ {earnings.toFixed(0)}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Earnings</ThemedText>
          </View>
          <View style={[styles.statCard, { borderColor }]}>
            <Ionicons name="time-outline" size={24} color={tintColor} />
            <ThemedText style={[styles.statValue, { color: tintColor }]}>{totalTrips}</ThemedText>
            <ThemedText style={styles.statLabel}>Completed Trips</ThemedText>
          </View>
        </View>

        {/* Trip History */}
        <ThemedView style={[styles.section, { borderColor }]}>
          <ThemedText style={styles.sectionTitle}>Recent Trips</ThemedText>
          {recentTrips.length === 0 ? (
            <ThemedText style={styles.emptyText}>No completed trips yet</ThemedText>
          ) : (
            recentTrips.map((trip) => (
              <TouchableOpacity
                key={trip.id}
                style={[styles.tripItem, { borderColor }]}
                onPress={() => {
                  router.push({
                    pathname: '/screens/operator/trip-completed',
                    params: { requestId: trip.id },
                  });
                }}
              >
                <View style={styles.tripInfo}>
                  <ThemedText style={styles.tripDate}>
                    {new Date(trip.completedAt || trip.createdAt).toLocaleDateString()}
                  </ThemedText>
                  <ThemedText style={styles.tripRoute}>
                    {trip.pickupAddress} → {trip.destinationAddress}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.tripEarnings, { color: tintColor }]}>
                  GH₵ {(trip.finalPrice || trip.estimatedPrice || 0).toFixed(0)}
                </ThemedText>
              </TouchableOpacity>
            ))
          )}
        </ThemedView>

        {/* Settings */}
        <ThemedView style={[styles.section, { borderColor }]}>
          <ThemedText style={styles.sectionTitle}>Settings</ThemedText>
          <TouchableOpacity
            style={[styles.settingItem, { borderColor }]}
            onPress={() => router.push('/screens/operator/profile-setup-screen')}
          >
            <Ionicons name="person-outline" size={20} color={iconColor} />
            <ThemedText style={styles.settingText}>Edit Profile</ThemedText>
            <Ionicons name="chevron-forward" size={20} color={iconColor} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingItem, { borderColor }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <ThemedText style={[styles.settingText, { color: '#EF4444' }]}>Logout</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  phone: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 8,
  },
  ratingContainer: {
    marginTop: 8,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    paddingVertical: 20,
  },
  tripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tripInfo: {
    flex: 1,
  },
  tripDate: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
  tripRoute: {
    fontSize: 14,
    fontWeight: '500',
  },
  tripEarnings: {
    fontSize: 16,
    fontWeight: '700',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  arrowRight: {
    transform: [{ rotate: '180deg' }],
  },
});

