import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useRequests } from '@/hooks/use-requests';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useToast } from '@/hooks/use-toast';
import { TowingRequest, cancelRequest } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

function RequestCard({ request, isActive = false, onCancel }: { request: TowingRequest; isActive?: boolean; onCancel?: (id: string) => void }) {
  const iconColor = useThemeColor({}, 'icon');
  const cardBg = useThemeColor({ light: '#ffffff', dark: '#1F2937' }, 'background');
  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');
  const tintColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <TouchableOpacity
      onPress={() => {
        if (isActive) {
          const route = request.status === 'pending'
            ? '/screens/user/searching-operator'
            : request.status === 'accepted'
              ? '/screens/user/operator-found'
              : '/screens/user/live-tracking';
          router.push({
            pathname: route as any,
            params: { requestId: request.id },
          });
        }
      }}
    >
      <ThemedView style={[styles.tripCard, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.tripHeader}>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: isActive ? '#3B82F6' : '#9ca3af' }]} />
            <ThemedText style={styles.statusText}>{formatStatus(request.status)}</ThemedText>
          </View>
          <ThemedText style={styles.tripDate}>
            {new Date(request.createdAt).toLocaleDateString()}
          </ThemedText>
        </View>

        <View style={styles.addressContainer}>
          <View style={styles.addressRow}>
            <View style={styles.pickupDot} />
            <ThemedText style={styles.addressText} numberOfLines={1}>
              {request.pickupAddress}
            </ThemedText>
          </View>
          <View style={styles.addressLine} />
          <View style={styles.addressRow}>
            <View style={styles.destinationDot} />
            <ThemedText style={styles.addressText} numberOfLines={1}>
              {request.destinationAddress}
            </ThemedText>
          </View>
        </View>

        <View style={styles.tripFooter}>
          <View style={styles.footerInfo}>
            <ThemedText style={styles.vehicleText}>{request.vehicleType.toUpperCase()}</ThemedText>
            <ThemedText style={styles.earningsText}>GH₵ {request.estimatedPrice.toFixed(0)}</ThemedText>
          </View>
          {isActive && onCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => onCancel(request.id)}
            >
              <ThemedText style={styles.cancelText}>Cancel</ThemedText>
            </TouchableOpacity>
          )}
          {!isActive && (
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          )}
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');
  const { activeRequests, pastRequests, isLoading, error, refresh } = useRequests('user');
  const { showToast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const handleCancelRequest = (requestId: string) => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelRequest(requestId, 'Cancelled by user from history');
              showToast('Request cancelled', 'success');
              refresh();
            } catch (err) {
              showToast('Failed to cancel request', 'error');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>My Requests</ThemedText>
      </View>

      {/* Trip List */}
      <ScrollView
        style={styles.tripList}
        contentContainerStyle={styles.tripListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={tintColor} />
        }
      >
        {error && !isLoading && !isRefreshing && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={18} color="#b91c1c" />
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <TouchableOpacity onPress={onRefresh}>
              <ThemedText style={styles.errorAction}>Tap to retry</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {activeRequests.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Active Requests</ThemedText>
            {activeRequests.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                isActive
                onCancel={handleCancelRequest}
              />
            ))}
          </View>
        )}

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Past Requests</ThemedText>
          {isLoading && !isRefreshing ? (
            <ActivityIndicator size="large" color={tintColor} style={styles.loader} />
          ) : pastRequests.length > 0 ? (
            pastRequests.map((req) => (
              <RequestCard key={req.id} request={req} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={48} color="#9ca3af" />
              <ThemedText style={styles.emptyText}>No request history</ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontFamily: Fonts.semiBold,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: '#9ca3af',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tripList: {
    flex: 1,
  },
  tripListContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#991b1b',
  },
  errorAction: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: '#b91c1c',
  },
  tripCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
  },
  tripDate: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: '#9ca3af',
  },
  addressContainer: {
    marginBottom: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pickupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  destinationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  addressLine: {
    width: 1,
    height: 16,
    backgroundColor: '#E5E7EB',
    marginLeft: 3.5,
    marginVertical: 2,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  vehicleText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#9ca3af',
  },
  earningsText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: '#10B981',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  cancelText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: '#ef4444',
  },
  loader: {
    marginTop: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    color: '#9ca3af',
    fontFamily: Fonts.medium,
  },
});
