/**
 * Operator Dashboard Screen
 * 
 * Main dashboard for tow operators.
 * Shows availability toggle and incoming request notifications.
 */

import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserIcon, Menu01Icon } from 'hugeicons-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/api';
import { toggleOperatorOnlineStatus } from '@/lib/api/users';
import { getPendingRequests } from '@/lib/api/requests';

export default function OperatorDashboardScreen() {
  const { showToast } = useToast();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');
  const tintColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');
  
  const [isOnline, setIsOnline] = useState(false);
  const [earnings] = useState(1250.00);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [tripsToday] = useState(12);
  const [rating] = useState(4.9);

  // Fetch current user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUser({ id: user.id });
          setIsOnline(user.isOnline || false);
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error);
        showToast('Please log in to continue', 'error');
      }
    };
    fetchUser();
  }, [showToast]);

  // Poll for pending requests when online
  useEffect(() => {
    if (!isOnline || !currentUser) return;

    const fetchPendingRequests = async () => {
      try {
        const requests = await getPendingRequests();
        
        // If there are pending requests, navigate to incoming request screen
        if (requests && requests.length > 0) {
          router.push({
            pathname: '/screens/operator/incoming-request',
            params: { requestId: requests[0].id },
          });
        }
      } catch (error) {
        console.error('Failed to fetch pending requests:', error);
        // Don't show error toast on every poll - only log it
      }
    };

    // Fetch immediately
    fetchPendingRequests();

    // Poll every 10 seconds
    const interval = setInterval(fetchPendingRequests, 10000);
    return () => clearInterval(interval);
  }, [isOnline, currentUser]);

  // Handle online status toggle
  const handleOnlineToggle = useCallback(async (value: boolean) => {
    if (!currentUser) {
      showToast('Please log in to go online', 'error');
      return;
    }

    setIsLoadingStatus(true);
    try {
      await toggleOperatorOnlineStatus(currentUser.id, value);
      setIsOnline(value);
      showToast(value ? 'You are now online' : 'You are now offline', 'success');
    } catch (error: any) {
      console.error('Failed to toggle online status:', error);
      showToast(error.message || 'Could not update status', 'error');
      // Revert the toggle on error
      setIsOnline(!value);
    } finally {
      setIsLoadingStatus(false);
    }
  }, [currentUser, showToast]);

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle={backgroundColor === '#151718' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* Map Background */}
      <MapView
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: 5.6037,
          longitude: -0.1870,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
      />

      {/* Status Bar Overlay */}
      <SafeAreaView style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.profileButton, { backgroundColor: useThemeColor({ light: '#ffffff', dark: '#1F2937' }, 'background') }]}
            onPress={() => router.push('/screens/operator/profile')}
          >
            <UserIcon size={20} color={tintColor} strokeWidth={2} />
          </TouchableOpacity>
          <View style={[styles.statusContainer, { backgroundColor: useThemeColor({ light: '#ffffff', dark: '#1F2937' }, 'background') }]}>
            <ThemedText style={styles.statusLabel}>
              {isOnline ? 'You\'re Online' : 'You\'re Offline'}
            </ThemedText>
            <Switch
              value={isOnline}
              onValueChange={handleOnlineToggle}
              disabled={isLoadingStatus}
              trackColor={{ false: '#e5e7eb', true: '#bae6fd' }}
              thumbColor={isOnline ? tintColor : '#9ca3af'}
            />
          </View>
          <TouchableOpacity 
            style={[styles.menuButton, { backgroundColor: useThemeColor({ light: '#ffffff', dark: '#1F2937' }, 'background') }]}
            onPress={() => router.push('/screens/operator/profile')}
          >
            <Menu01Icon size={20} color={tintColor} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Stats Card */}
        <ThemedView style={[styles.statsCard, { backgroundColor: useThemeColor({ light: '#ffffff', dark: '#1F2937' }, 'background') }]}>
          <View style={styles.statItem}>
            <ThemedText style={[styles.statValue, { color: tintColor }]}>{tripsToday}</ThemedText>
            <ThemedText style={styles.statLabel}>Trips Today</ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
          <View style={styles.statItem}>
            <ThemedText style={[styles.statValue, { color: tintColor }]}>{rating}</ThemedText>
            <ThemedText style={styles.statLabel}>Rating</ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
          <View style={styles.statItem}>
            <ThemedText style={[styles.statValue, { color: tintColor }]}>GH₵ {earnings.toFixed(0)}</ThemedText>
            <ThemedText style={styles.statLabel}>Earnings</ThemedText>
          </View>
        </ThemedView>
      </SafeAreaView>

      {/* Bottom Card */}
      <ThemedView style={[styles.bottomCard, { backgroundColor: useThemeColor({ light: '#ffffff', dark: '#1F2937' }, 'background') }]}>
        <ThemedText style={styles.bottomTitle}>
          {isOnline ? 'Waiting for requests...' : 'Go online to receive requests'}
        </ThemedText>
        {isOnline && (
          <View style={[styles.pulseContainer, { backgroundColor: '#bae6fd' }]}>
            <View style={[styles.pulse, { backgroundColor: tintColor }]} />
          </View>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Gilroy-SemiBold',
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'Gilroy-SemiBold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Gilroy-Regular',
  },
  statDivider: {
    width: 1,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'Gilroy-SemiBold',
  },
  pulseContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#bae6fd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#003554',
  },
});
