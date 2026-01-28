/**
 * Trip History Screen
 * Displays completed trips for the user
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  getUserTripHistory,
  getCompletedRequests,
  type TripWithDetails,
} from '@/services/tripHistoryService';

export default function TripHistoryScreen() {
  const [trips, setTrips] = useState<TripWithDetails[]>([]);
  const [completedRequests, setCompletedRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      // Try to load from trip_history first
      const tripHistory = await getUserTripHistory();
      setTrips(tripHistory);

      // Also load completed requests as fallback
      const completed = await getCompletedRequests();
      setCompletedRequests(completed);
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return 'N/A';
    return `GH₵${amount.toFixed(2)}`;
  };

  const renderTripItem = ({ item }: { item: TripWithDetails | any }) => {
    const isFromHistory = !!item.final_cost;
    const isTowRequest = !!item.status;

    return (
      <TouchableOpacity style={styles.tripCard}>
        <View style={styles.tripHeader}>
          <View style={styles.tripIcon}>
            <Ionicons name="car-outline" size={24} color="#3B82F6" />
          </View>
          <View style={styles.tripInfo}>
            <Text style={styles.tripDate}>
              {formatDate(item.created_at)}
            </Text>
            <Text style={styles.tripStatus}>
              {isFromHistory ? 'Completed' : item.status}
            </Text>
          </View>
          <View style={styles.tripCost}>
            <Text style={styles.tripPrice}>
              {formatCurrency(item.final_cost || item.estimated_cost)}
            </Text>
          </View>
        </View>

        <View style={styles.tripDetails}>
          <View style={styles.tripLocation}>
            <Ionicons name="location" size={16} color="#10B981" />
            <Text style={styles.tripAddress} numberOfLines={1}>
              {isTowRequest ? item.pickup_address : item.tow_request?.pickup_address || 'Pickup location'}
            </Text>
          </View>
          <View style={styles.tripDivider} />
          <View style={styles.tripLocation}>
            <Ionicons name="location" size={16} color="#EF4444" />
            <Text style={styles.tripAddress} numberOfLines={1}>
              {isTowRequest ? item.dest_address : item.tow_request?.dest_address || 'Destination'}
            </Text>
          </View>
        </View>

        {item.final_distance_km && (
          <View style={styles.tripMeta}>
            <Text style={styles.tripMetaText}>
              {item.final_distance_km.toFixed(2)} km
            </Text>
            {item.rating && (
              <>
                <Text style={styles.tripMetaDot}>•</Text>
                <Ionicons name="star" size={14} color="#FBBF24" />
                <Text style={styles.tripMetaText}>{item.rating}/5</Text>
              </>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const allTrips = [...trips, ...completedRequests];
  const hasTrips = allTrips.length > 0;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip History</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      {hasTrips ? (
        <FlatList
          data={allTrips}
          renderItem={renderTripItem}
          keyExtractor={(item, index) => item.id || index.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>No Trip History</Text>
          <Text style={styles.emptyStateText}>
            Your completed trips will appear here
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  listContent: {
    padding: 16,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tripInfo: {
    flex: 1,
  },
  tripDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  tripStatus: {
    fontSize: 14,
    color: '#10B981',
    textTransform: 'capitalize',
  },
  tripCost: {
    alignItems: 'flex-end',
  },
  tripPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  tripDetails: {
    paddingLeft: 60,
  },
  tripLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripAddress: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  tripDivider: {
    width: 2,
    height: 16,
    backgroundColor: '#D1D5DB',
    marginLeft: 7,
    marginBottom: 8,
  },
  tripMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 60,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 8,
  },
  tripMetaText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  tripMetaDot: {
    fontSize: 12,
    color: '#D1D5DB',
    marginHorizontal: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
