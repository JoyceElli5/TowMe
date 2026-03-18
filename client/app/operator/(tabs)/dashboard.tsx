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

  // Hook-based logic
  const {
    isOnline,
    earnings,
    tripsToday,
    rating,
    isLoadingStatus,
    incomingRequest,
    isAccepting,
    handleOnlineToggle,
    handleAcceptRequest,
    handleDeclineRequest,
    activeJob,
  } = useOperatorDashboard();

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
                <View style={styles.demandRow}>
                  <Ionicons name="flame" size={11} color="#ef4444" />
                  <ThemedText style={styles.demandLabel}> High Demand Area</ThemedText>
                </View>
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
  demandRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    paddingBottom: 200,
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
