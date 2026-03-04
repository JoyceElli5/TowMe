

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { StarIcon, Route01Icon, FilterIcon } from 'hugeicons-react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import { ApiError, getCurrentUser, getUserRequests, type TowingRequest } from '@/lib/api';

type HistoryFilter = 'today' | 'week' | 'month';

function formatTripDate(trip: TowingRequest): string {
  const raw = trip.completedAt || trip.createdAt;
  if (!raw) return 'Unknown date';
  const date = new Date(raw);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function TripCard({ trip }: { trip: TowingRequest }) {
  const iconColor = useThemeColor({}, 'icon');
  const cardBg = useThemeColor({}, 'background');

  const distanceText =
    typeof trip.distanceKm === 'number'
      ? `${trip.distanceKm.toFixed(1)} km`
      : '—';

  const priceValue =
    (trip.finalPrice ?? undefined) ??
    (trip.estimatedPrice ?? undefined);

  const earningsText =
    typeof priceValue === 'number'
      ? `GHS ${priceValue.toFixed(0)}`
      : 'GHS 0';

  const rating =
    trip.operator?.averageRating ??
    trip.user?.averageRating ??
    0;

  return (
    <TouchableOpacity>
      <ThemedView style={[styles.tripCard, { backgroundColor: cardBg }]}>
      <View style={styles.tripHeader}>
        <ThemedText style={styles.tripDate}>{formatTripDate(trip)}</ThemedText>
        <View style={styles.ratingContainer}>
          <StarIcon size={14} color="#F59E0B" strokeWidth={2} />
          <ThemedText style={styles.ratingText}>
            {rating ? rating.toFixed(1) : '—'}
          </ThemedText>
        </View>
      </View>

      <View style={styles.addressContainer}>
        <View style={styles.addressRow}>
          <View style={styles.pickupDot} />
          <ThemedText style={styles.addressText} numberOfLines={1}>
            {trip.pickupAddress}
          </ThemedText>
        </View>
        <View style={styles.addressLine} />
        <View style={styles.addressRow}>
          <View style={styles.destinationDot} />
          <ThemedText style={styles.addressText} numberOfLines={1}>
            {trip.destinationAddress}
          </ThemedText>
        </View>
      </View>

      <View style={styles.tripFooter}>
        <View style={styles.distanceContainer}>
          <Route01Icon size={16} color={iconColor} strokeWidth={2} />
          <ThemedText style={styles.distanceText}>{distanceText}</ThemedText>
        </View>
        <ThemedText style={styles.earningsText}>{earningsText}</ThemedText>
      </View>
      </ThemedView>
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const filterButtonBg = useThemeColor({ light: '#EBF5FF', dark: '#1E3A5F' }, 'background');
  const { showToast } = useToast();

  const [trips, setTrips] = useState<TowingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<HistoryFilter>('today');

  useEffect(() => {
    const loadTrips = async () => {
      try {
        setIsLoading(true);
        const user = await getCurrentUser();
        if (!user) {
          setTrips([]);
          return;
        }

        const response = await getUserRequests(user.id, {
          status: 'completed',
          limit: 100,
        });

        setTrips(response.data ?? []);
      } catch (error) {
        console.error('Error loading trip history:', error);
        const message =
          error instanceof ApiError
            ? error.message
            : 'Failed to load trip history';
        showToast(message, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadTrips();
  }, [showToast]);

  const filteredTrips = useMemo(() => {
    if (!trips.length) return [];

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    let startDate: Date;

    if (selectedFilter === 'today') {
      startDate = startOfToday;
    } else if (selectedFilter === 'week') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
    }

    return trips.filter((trip) => {
      const raw = trip.completedAt || trip.createdAt;
      if (!raw) return false;
      const dt = new Date(raw);
      return dt >= startDate;
    });
  }, [trips, selectedFilter]);

  const summary = useMemo(() => {
    const totalTrips = filteredTrips.length;

    let totalDistance = 0;
    let totalEarnings = 0;

    for (const trip of filteredTrips) {
      if (typeof trip.distanceKm === 'number') {
        totalDistance += trip.distanceKm;
      }
      const price =
        (trip.finalPrice ?? undefined) ??
        (trip.estimatedPrice ?? undefined);
      if (typeof price === 'number') {
        totalEarnings += price;
      }
    }

    return {
      totalTrips,
      totalDistance,
      totalEarnings,
    };
  }, [filteredTrips]);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>Trip History</ThemedText>
        <TouchableOpacity style={[styles.filterButton, { backgroundColor: filterButtonBg }]}>
          <FilterIcon size={24} color="#3B82F6" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <ThemedView style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <ThemedText type="defaultSemiBold" style={styles.summaryValue}>
            GHS {summary.totalEarnings.toFixed(0)}
          </ThemedText>
          <ThemedText style={styles.summaryLabel}>Total Earnings</ThemedText>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <ThemedText type="defaultSemiBold" style={styles.summaryValue}>
            {summary.totalTrips}
          </ThemedText>
          <ThemedText style={styles.summaryLabel}>Trips</ThemedText>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <ThemedText type="defaultSemiBold" style={styles.summaryValue}>
            {summary.totalDistance.toFixed(1)} km
          </ThemedText>
          <ThemedText style={styles.summaryLabel}>Distance</ThemedText>
        </View>
      </ThemedView>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === 'today' && styles.filterTabActive,
          ]}
          onPress={() => setSelectedFilter('today')}
        >
          <ThemedText
            style={[
              styles.filterTabText,
              selectedFilter === 'today' && styles.filterTabTextActive,
            ]}
          >
            Today
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === 'week' && styles.filterTabActive,
          ]}
          onPress={() => setSelectedFilter('week')}
        >
          <ThemedText
            style={[
              styles.filterTabText,
              selectedFilter === 'week' && styles.filterTabTextActive,
            ]}
          >
            This Week
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === 'month' && styles.filterTabActive,
          ]}
          onPress={() => setSelectedFilter('month')}
        >
          <ThemedText
            style={[
              styles.filterTabText,
              selectedFilter === 'month' && styles.filterTabTextActive,
            ]}
          >
            This Month
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Trip List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : filteredTrips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyTitle}>No trips yet</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Your completed trips will appear here.
          </ThemedText>
        </View>
      ) : (
        <ScrollView
          style={styles.tripList}
          contentContainerStyle={styles.tripListContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </ScrollView>
      )}
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
