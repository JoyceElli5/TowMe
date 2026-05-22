/**
 * Job Detail Screen (Operator)
 *
 * Shows full details for a completed or past job including
 * route, earnings, duration, and customer info.
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { operatorSafeBack } from '@/lib/navigation';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeColor } from '@/hooks/use-theme-color';
import { useToast } from '@/hooks/use-toast';
import { getRequestById, type TowingRequest } from '@/lib/api';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function JobDetailScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const { showToast } = useToast();
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');

  const [request, setRequest] = useState<TowingRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!requestId) {
      showToast('Request ID not found', 'error');
      operatorSafeBack();
      return;
    }
    loadRequest();
  }, [requestId]);

  const loadRequest = async () => {
    try {
      const data = await getRequestById(requestId!);
      setRequest(data);
    } catch {
      showToast('Failed to load job details', 'error');
      operatorSafeBack();
    } finally {
      setIsLoading(false);
    }
  };

  const getDuration = () => {
    if (!request?.startedAt || !request?.completedAt) return 'N/A';
    const minutes = Math.round(
      (new Date(request.completedAt).getTime() - new Date(request.startedAt).getTime()) / 60000
    );
    return `${minutes} min`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatStatus = (status: string) =>
    status.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#003554" />
        </View>
      </SafeAreaView>
    );
  }

  if (!request) return null;

  const earnings = request.finalPrice || request.estimatedPrice || 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => operatorSafeBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Earnings Hero */}
        <View style={[styles.earningsHero, { backgroundColor: tintColor }]}>
          <Text style={styles.earningsLabel}>Your Earnings</Text>
          <Text style={styles.earningsAmount}>GH₵ {earnings.toFixed(2)}</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{formatStatus(request.status)}</Text>
          </View>
        </View>

        {/* Route */}
        <SectionCard title="Route">
          <View style={styles.routeRow}>
            <View style={styles.routeDot}>
              <View style={styles.dotGreen} />
              <View style={styles.routeLine} />
              <View style={styles.dotRed} />
            </View>
            <View style={styles.routeAddresses}>
              <Text style={styles.routeAddress} numberOfLines={2}>{request.pickupAddress}</Text>
              <View style={{ height: 16 }} />
              <Text style={styles.routeAddress} numberOfLines={2}>{request.destinationAddress}</Text>
            </View>
          </View>
        </SectionCard>

        {/* Trip Info */}
        <SectionCard title="Trip Info">
          <InfoRow label="Distance" value={`${request.distanceKm?.toFixed(1) || '0'} km`} />
          <InfoRow label="Duration" value={getDuration()} />
          <InfoRow label="Vehicle Type" value={request.vehicleType.charAt(0).toUpperCase() + request.vehicleType.slice(1)} />
          <InfoRow label="Date" value={formatDate(request.completedAt || request.createdAt)} />
        </SectionCard>

        {/* Customer Info */}
        {request.user && (
          <SectionCard title="Customer">
            <InfoRow label="Name" value={request.user.fullName} />
            {request.user.phone && (
              <InfoRow label="Phone" value={request.user.phone} />
            )}
          </SectionCard>
        )}

        {/* Payment */}
        <SectionCard title="Payment">
          <InfoRow label="Estimated" value={`GH₵ ${(request.estimatedPrice || 0).toFixed(2)}`} />
          {request.finalPrice && (
            <InfoRow label="Final Amount" value={`GH₵ ${request.finalPrice.toFixed(2)}`} />
          )}
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backBtn: { width: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Gilroy-Bold', color: '#111827' },
  scrollContent: { paddingBottom: 48 },
  earningsHero: {
    margin: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 13,
    fontFamily: 'Gilroy-Medium',
    color: '#bae6fd',
    marginBottom: 8,
  },
  earningsAmount: {
    fontSize: 40,
    fontFamily: 'Gilroy-Bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  statusPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusPillText: {
    fontSize: 13,
    fontFamily: 'Gilroy-SemiBold',
    color: '#ffffff',
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: 'Gilroy-SemiBold',
    color: '#6b7280',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  infoLabel: { fontSize: 14, fontFamily: 'Gilroy-Regular', color: '#6b7280' },
  infoValue: { fontSize: 14, fontFamily: 'Gilroy-SemiBold', color: '#111827' },
  routeRow: { flexDirection: 'row', gap: 12 },
  routeDot: { alignItems: 'center', paddingTop: 2 },
  dotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e' },
  routeLine: { width: 2, flex: 1, backgroundColor: '#e5e7eb', marginVertical: 4 },
  dotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444' },
  routeAddresses: { flex: 1 },
  routeAddress: { fontSize: 14, fontFamily: 'Gilroy-Medium', color: '#111827', lineHeight: 20 },
});
