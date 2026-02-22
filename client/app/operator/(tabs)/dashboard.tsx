/**
 * Operator Dashboard Screen
 * 
 * Main dashboard for tow operators.
 * Shows availability toggle, coverage zones, and job request preview.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { UserIcon } from 'hugeicons-react-native';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Platform,
  StatusBar,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import OperatorMenuModal from '@/components/operator-menu-modal';
import EarningsModal from '@/components/operator/earnings-modal';
import JobRequestPreview from '@/components/operator/job-request-preview';
import SOSButton from '@/components/operator/sos-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useOperatorDashboard } from '@/hooks/use-operator-dashboard';
import { useThemeColor } from '@/hooks/use-theme-color';

// Mock Heat Zones (e.g., around Accra)
const HEAT_ZONES = [
  { id: 1, latitude: 5.6037, longitude: -0.1870, radius: 2000, intensity: 'high' },
  { id: 2, latitude: 5.6237, longitude: -0.1670, radius: 1500, intensity: 'medium' },
];

export default function OperatorDashboardScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');
  const tintColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');
  const mapRef = useRef<MapView>(null);

  const [showMenu, setShowMenu] = useState(false);
  const [showEarningsModal, setShowEarningsModal] = useState(false);
<<<<<<< HEAD

  // Hook-based logic
  const {
    isOnline,
    earnings,
    tripsToday,
    rating,
    isLoadingStatus,
    incomingRequest,
    isAccepting,
    requestTimeLeft,
    handleOnlineToggle,
    handleAcceptRequest,
    handleDeclineRequest,
    simulateRequest,
    activeJob,
  } = useOperatorDashboard();
=======
  const [incomingRequest, setIncomingRequest] = useState<TowingRequest | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  // Fetch current user and stats on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUser({ id: user.id });
          setIsOnline(user.isOnline || false);
          setRating(user.averageRating || 0);

          // Fetch today's trips and earnings
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const tripsResponse = await getOperatorRequests(user.id, {
            status: 'completed',
            limit: 100,
          });

          if (tripsResponse.data) {
            // Filter trips from today
            const todayTrips = tripsResponse.data.filter((trip) => {
              const tripDate = new Date(trip.completedAt || trip.createdAt);
              return tripDate >= today;
            });

            setTripsToday(todayTrips.length);

            // Calculate total earnings from all completed trips
            const totalEarnings = tripsResponse.data.reduce((sum, trip) => {
              return sum + (trip.finalPrice || trip.estimatedPrice || 0);
            }, 0);
            setEarnings(totalEarnings);
          }
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error);
        showToast('Please log in to continue', 'error');
      }
    };
    fetchUser();
  }, [showToast]);

  // Real-time subscription for pending requests when online
  useEffect(() => {
    if (!isOnline || !currentUser) return;

    let channel: RealtimeChannel | null = null;
    let backupInterval: NodeJS.Timeout | null = null;

    const fetchPendingRequests = async () => {
      // If we already have a request, don't fetch more
      if (incomingRequest) return;

      try {
        const requests = await getPendingRequests();

        if (requests && requests.length > 0) {
          setIncomingRequest(requests[0]);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (error) {
        console.error('Failed to fetch pending requests:', error);
      }
    };

    // Initial fetch
    fetchPendingRequests();

    // Set up real-time subscription
    try {
      channel = subscribeToPendingRequests((payload) => {
        console.log('New pending request received:', payload.eventType);
        if (payload.eventType === 'INSERT') {
          fetchPendingRequests();
        }
      });
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
      backupInterval = setInterval(fetchPendingRequests, 15000);
    }

    backupInterval = setInterval(fetchPendingRequests, 30000);

    return () => {
      if (channel) unsubscribe(channel);
      if (backupInterval) clearInterval(backupInterval);
    };
  }, [isOnline, currentUser, incomingRequest]);

  // Handle online status toggle
  const handleOnlineToggle = useCallback(async (value: boolean) => {
    if (!currentUser) {
      showToast('Please log in to go online', 'error');
      return;
    }

    // Check if operator is verified before allowing them to go online
    if (value) {
      const { isOperatorVerified, getVerificationStatus } = await import('@/lib/services/operatorService');
      const verified = await isOperatorVerified(currentUser.id);
      const verificationStatus = await getVerificationStatus(currentUser.id);
      
      if (!verified) {
        if (verificationStatus === 'pending' || verificationStatus === 'under_review') {
          showToast('Please complete your profile verification to go online', 'error');
          router.push('/screens/operator/verification-pending');
        } else if (verificationStatus === 'rejected') {
          showToast('Your verification was rejected. Please update your profile', 'error');
          router.push('/screens/operator/verification-rejected');
        } else {
          showToast('Please complete your profile to go online', 'error');
          router.push('/screens/operator/profile-setup-screen');
        }
        return;
      }
    }

    setIsLoadingStatus(true);
    try {
      await toggleOperatorOnlineStatus(currentUser.id, value);
      setIsOnline(value);
      showToast(value ? 'You are now online' : 'You are now offline', 'success');
      Haptics.selectionAsync();
    } catch (error: any) {
      console.error('Failed to toggle online status:', error);
      showToast(error.message || 'Could not update status', 'error');
      setIsOnline(!value);
    } finally {
      setIsLoadingStatus(false);
    }
  }, [currentUser, showToast]);

  const handleAcceptRequest = async () => {
    if (!incomingRequest) return;
    setIsAccepting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await acceptRequest(incomingRequest.id);
      setIsAccepting(false);
      setIncomingRequest(null);
      router.push({
        pathname: '/screens/operator/navigation-to-pickup',
        params: { requestId: incomingRequest.id },
      });
    } catch (error) {
      console.error('Failed to accept request:', error);
      setIsAccepting(false);
      if (error instanceof ApiError) {
        Alert.alert('Error', error.message || 'Failed to accept request');
      } else {
        Alert.alert('Error', 'An unexpected error occurred');
      }
    }
  };

  const handleDeclineRequest = () => {
    setIncomingRequest(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    // TODO: Optionally notify backend about declined request
  };
>>>>>>> 251dbc372cae9e405a1ff68a0bfb97b0e61a3171

  const handleSOS = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert(
      "Emergency SOS",
      "Are you sure you want to contact emergency services?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Call 112", style: "destructive", onPress: () => console.log("Calling 112...") }
      ]
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle={backgroundColor === '#151718' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* Map Background */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: 5.6037,
          longitude: -0.1870,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
      >
        {/* Heat Zones */}
        {isOnline && HEAT_ZONES.map((zone) => (
          <Circle
            key={zone.id}
            center={{ latitude: zone.latitude, longitude: zone.longitude }}
            radius={zone.radius}
            fillColor={zone.intensity === 'high' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'}
            strokeColor={zone.intensity === 'high' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(245, 158, 11, 0.5)'}
            strokeWidth={1}
          />
        ))}
      </MapView>

      {/* Overlay UI */}
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.profileButton, { backgroundColor: useThemeColor({ light: '#ffffff', dark: '#1F2937' }, 'background') }]}
            onPress={() => router.push('/operator/(tabs)/profile')}
          >
            <UserIcon size={20} color={tintColor} strokeWidth={2} />
          </TouchableOpacity>

          <View style={[styles.statusContainer, { backgroundColor: useThemeColor({ light: '#ffffff', dark: '#1F2937' }, 'background') }]}>
            <View style={{ gap: 2 }}>
              <ThemedText style={styles.statusLabel}>
                {isOnline ? 'You\'re Online' : 'You\'re Offline'}
              </ThemedText>
              {isOnline && (
                <ThemedText style={styles.demandLabel}>
                  🔥 High Demand Area
                </ThemedText>
              )}
            </View>
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
            onPress={() => setShowMenu(true)}
          >
            <Ionicons name="menu-outline" size={24} color={tintColor} />
          </TouchableOpacity>
        </View>

        {/* Dev: Simulate Request Button */}
<<<<<<< HEAD
        {__DEV__ && !incomingRequest && (
          <TouchableOpacity
            style={styles.devSimulateButton}
            onPress={simulateRequest}
          >
            <ThemedText style={styles.devButtonText}>Simulate Job</ThemedText>
          </TouchableOpacity>
        )}
=======
        {/* (Dev simulate button removed – dashboard now only shows real backend requests) */}
>>>>>>> 251dbc372cae9e405a1ff68a0bfb97b0e61a3171

        {/* Stats Card - Clickable for Earnings */}
        {!incomingRequest && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setShowEarningsModal(true)}
            style={[styles.statsCard, { backgroundColor: useThemeColor({ light: '#ffffff', dark: '#1F2937' }, 'background') }]}
          >
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
          </TouchableOpacity>
        )}

        {/* Expanded View Spacer */}
        <View style={{ flex: 1 }} />

        {/* Current Active Job Card */}
        {activeJob && !incomingRequest && (
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.activeJobCard, { backgroundColor: tintColor }]}
            onPress={() => {
              const route = activeJob.status === 'accepted'
                ? '/screens/operator/navigation-to-pickup'
                : '/screens/operator/live-tracking';
              router.push({
                pathname: route as any,
                params: { requestId: activeJob.id },
              });
            }}
          >
            <View style={styles.activeJobHeader}>
              <View style={styles.activeJobPulse} />
              <ThemedText style={styles.activeJobTitle}>Ongoing Job</ThemedText>
            </View>
            <ThemedText style={styles.activeJobAddress} numberOfLines={1}>
              {activeJob.pickupAddress}
            </ThemedText>
            <View style={styles.activeJobFooter}>
              <ThemedText style={styles.activeJobStatus}>
                Status: {activeJob.status === 'accepted' ? 'Accepted' : 'In Progress'}
              </ThemedText>
              <ThemedText style={styles.activeJobResume}>Resume →</ThemedText>
            </View>
          </TouchableOpacity>
        )}

        {/* SOS Button */}
        <SOSButton onPress={handleSOS} />

        {/* Bottom Card / Job Preview */}
        {incomingRequest ? (
          <JobRequestPreview
            request={incomingRequest}
            onAccept={handleAcceptRequest}
            onDecline={handleDeclineRequest}
            isAccepting={isAccepting}
          />
        ) : (
          <ThemedView style={[styles.bottomCard, { backgroundColor: useThemeColor({ light: '#ffffff', dark: '#1F2937' }, 'background') }]}>
            <ThemedText style={styles.bottomTitle}>
              {activeJob ? 'You have an active job' : (isOnline ? 'Waiting for requests...' : 'Go online to receive requests')}
            </ThemedText>
            {!activeJob && isOnline && (
              <View style={[styles.pulseContainer, { backgroundColor: '#bae6fd' }]}>
                <View style={[styles.pulse, { backgroundColor: tintColor }]} />
              </View>
            )}
            {activeJob && (
              <TouchableOpacity
                style={[styles.resumeButton, { backgroundColor: tintColor }]}
                onPress={() => {
                  const route = activeJob.status === 'accepted'
                    ? '/screens/operator/navigation-to-pickup'
                    : '/screens/operator/live-tracking';
                  router.push({
                    pathname: route as any,
                    params: { requestId: activeJob.id },
                  });
                }}
              >
                <ThemedText style={styles.resumeButtonText}>Return to Job</ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>
        )}

      </SafeAreaView>

      {/* Modals */}
      <OperatorMenuModal visible={showMenu} onClose={() => setShowMenu(false)} />
      <EarningsModal
        visible={showEarningsModal}
        onClose={() => setShowEarningsModal(false)}
        earnings={earnings}
        tripsToday={tripsToday}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
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
  demandLabel: {
    fontSize: 10,
    color: '#ef4444',
    fontFamily: 'Gilroy-Medium',
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  devSimulateButton: {
    position: 'absolute',
    top: 120,
    right: 20,
    backgroundColor: '#F59E0B',
    padding: 8,
    borderRadius: 8,
    zIndex: 100,
  },
  devButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  activeJobCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeJobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeJobPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  activeJobTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  activeJobAddress: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
    opacity: 0.9,
  },
  activeJobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeJobStatus: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  activeJobResume: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resumeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
  },
  resumeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
