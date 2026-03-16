

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
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
import { getCurrentUser } from '@/lib/api';
import { getUserRequests, TowingRequest } from '@/lib/api/requests';

type TimeFilter = 'today' | 'week' | 'month';

function TripCard({ trip }: { trip: TowingRequest }) {
  const iconColor = useThemeColor({}, 'icon');
  const cardBg = useThemeColor({}, 'background');

  const tripDate = new Date(trip.completedAt || trip.createdAt);
  const now = new Date();
  const isToday = tripDate.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = tripDate.toDateString() === yesterday.toDateString();

  const dateLabel = isToday
    ? `Today, ${tripDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : isYesterday
    ? `Yesterday, ${tripDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : `${tripDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${tripDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <TouchableOpacity>
      <ThemedView style={[styles.tripCard, { backgroundColor: cardBg }]}>
        <View style={styles.tripHeader}>
          <ThemedText style={styles.tripDate}>{dateLabel}</ThemedText>
          <View style={styles.ratingContainer}>
            <StarIcon size={14} color="#F59E0B" strokeWidth={2} />
            <ThemedText style={styles.ratingText}>
              {trip.operator?.averageRating?.toFixed(1) || '-'}
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
            <ThemedText style={styles.distanceText}>{trip.distanceKm?.toFixed(1) || '0'} km</ThemedText>
          </View>
          <ThemedText style={styles.earningsText}>
            GH₵ {(trip.finalPrice || trip.estimatedPrice || 0).toFixed(0)}
          </ThemedText>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const filterButtonBg = useThemeColor({ light: '#EBF5FF', dark: '#1E3A5F' }, 'background');
  
  const [trips, setTrips] = useState<TowingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<TimeFilter>('today');
  const [userId, setUserId] = useState<string | null>(null);

  const fetchTrips = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) return;
      setUserId(user.id);

      const response = await getUserRequests(user.id, {
        status: 'completed',
        limit: 100,
      });

      if (response.data) {
        setTrips(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch trip history:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchTrips(false);
  }, [fetchTrips]);

  // Filter trips by time period
  const filteredTrips = trips.filter((trip) => {
    const tripDate = new Date(trip.completedAt || trip.createdAt);
    const now = new Date();

    if (activeFilter === 'today') {
      return tripDate.toDateString() === now.toDateString();
    } else if (activeFilter === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return tripDate >= weekAgo;
    } else {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return tripDate >= monthAgo;
    }
  });

  // Compute summary from filtered trips
  const totalEarnings = filteredTrips.reduce((sum, t) => sum + (t.finalPrice || t.estimatedPrice || 0), 0);
  const totalDistance = filteredTrips.reduce((sum, t) => sum + (t.distanceKm || 0), 0);

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
          <ThemedText type="defaultSemiBold" style={styles.summaryValue}>GH₵ {totalEarnings.toFixed(0)}</ThemedText>
          <ThemedText style={styles.summaryLabel}>Total Spent</ThemedText>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <ThemedText type="defaultSemiBold" style={styles.summaryValue}>{filteredTrips.length}</ThemedText>
          <ThemedText style={styles.summaryLabel}>Trips</ThemedText>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <ThemedText type="defaultSemiBold" style={styles.summaryValue}>{totalDistance.toFixed(1)} km</ThemedText>
          <ThemedText style={styles.summaryLabel}>Distance</ThemedText>
        </View>
      </ThemedView>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['today', 'week', 'month'] as TimeFilter[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterTab, activeFilter === filter && styles.filterTabActive]}
            onPress={() => setActiveFilter(filter)}
          >
            <ThemedText style={[styles.filterTabText, activeFilter === filter && styles.filterTabTextActive]}>
              {filter === 'today' ? 'Today' : filter === 'week' ? 'This Week' : 'This Month'}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Trip List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#003554" />
        </View>
      ) : (
        <ScrollView
          style={styles.tripList}
          contentContainerStyle={styles.tripListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        >
          {filteredTrips.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>No trips found for this period</ThemedText>
            </View>
          ) : (
            filteredTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))
          )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontFamily: Fonts.semiBold,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  filterTabActive: {
    backgroundColor: '#3B82F6',
  },
  filterTabText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
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
  tripDate: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
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
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  destinationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  addressLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginLeft: 4,
    marginVertical: 2,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  earningsText: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: '#10B981',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    fontFamily: Fonts.regular,
  },
});
