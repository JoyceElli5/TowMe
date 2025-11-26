/**
 * History Screen
 *
 * Shows the user's trip history with:
 * - List of completed trips
 * - Date, time, addresses, distance, and earnings
 * - Filter options
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Mock trip data
const MOCK_TRIPS = [
  {
    id: '1',
    date: 'Today, 2:30 PM',
    pickup: 'Ring Road Central, Accra',
    destination: 'Accra Mall',
    distance: '12.5 km',
    earnings: 'GHS 156',
    rating: 5,
  },
  {
    id: '2',
    date: 'Yesterday, 10:15 AM',
    pickup: 'Osu Oxford Street',
    destination: 'Kotoka Airport',
    distance: '8.2 km',
    earnings: 'GHS 98',
    rating: 4,
  },
  {
    id: '3',
    date: 'Nov 24, 4:45 PM',
    pickup: 'East Legon',
    destination: 'University of Ghana',
    distance: '15.0 km',
    earnings: 'GHS 180',
    rating: 5,
  },
];

function TripCard({ trip }: { trip: typeof MOCK_TRIPS[0] }) {
  return (
    <TouchableOpacity style={styles.tripCard}>
      <View style={styles.tripHeader}>
        <Text style={styles.tripDate}>{trip.date}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={14} color="#F59E0B" />
          <Text style={styles.ratingText}>{trip.rating}</Text>
        </View>
      </View>

      <View style={styles.addressContainer}>
        <View style={styles.addressRow}>
          <View style={styles.pickupDot} />
          <Text style={styles.addressText} numberOfLines={1}>
            {trip.pickup}
          </Text>
        </View>
        <View style={styles.addressLine} />
        <View style={styles.addressRow}>
          <View style={styles.destinationDot} />
          <Text style={styles.addressText} numberOfLines={1}>
            {trip.destination}
          </Text>
        </View>
      </View>

      <View style={styles.tripFooter}>
        <View style={styles.distanceContainer}>
          <Ionicons name="navigate-outline" size={16} color="#6B7280" />
          <Text style={styles.distanceText}>{trip.distance}</Text>
        </View>
        <Text style={styles.earningsText}>{trip.earnings}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Trip History</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter-outline" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>GHS 434</Text>
          <Text style={styles.summaryLabel}>Total Earnings</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>3</Text>
          <Text style={styles.summaryLabel}>Trips</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>35.7 km</Text>
          <Text style={styles.summaryLabel}>Distance</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity style={[styles.filterTab, styles.filterTabActive]}>
          <Text style={[styles.filterTabText, styles.filterTabTextActive]}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterTab}>
          <Text style={styles.filterTabText}>This Week</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterTab}>
          <Text style={styles.filterTabText}>This Month</Text>
        </TouchableOpacity>
      </View>

      {/* Trip List */}
      <ScrollView
        style={styles.tripList}
        contentContainerStyle={styles.tripListContent}
        showsVerticalScrollIndicator={false}
      >
        {MOCK_TRIPS.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
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
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
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
    backgroundColor: '#FFFFFF',
  },
  filterTabActive: {
    backgroundColor: '#3B82F6',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
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
    backgroundColor: '#FFFFFF',
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
    fontWeight: '600',
    color: '#374151',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
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
    color: '#374151',
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
    color: '#6B7280',
  },
  earningsText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
});
