

import React from 'react';
import {
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
  const iconColor = useThemeColor({}, 'icon');
  const cardBg = useThemeColor({}, 'background');
  return (
    <TouchableOpacity>
      <ThemedView style={[styles.tripCard, { backgroundColor: cardBg }]}>
      <View style={styles.tripHeader}>
        <ThemedText style={styles.tripDate}>{trip.date}</ThemedText>
        <View style={styles.ratingContainer}>
          <StarIcon size={14} color="#F59E0B" strokeWidth={2} />
          <ThemedText style={styles.ratingText}>{trip.rating}</ThemedText>
        </View>
      </View>

      <View style={styles.addressContainer}>
        <View style={styles.addressRow}>
          <View style={styles.pickupDot} />
          <ThemedText style={styles.addressText} numberOfLines={1}>
            {trip.pickup}
          </ThemedText>
        </View>
        <View style={styles.addressLine} />
        <View style={styles.addressRow}>
          <View style={styles.destinationDot} />
          <ThemedText style={styles.addressText} numberOfLines={1}>
            {trip.destination}
          </ThemedText>
        </View>
      </View>

      <View style={styles.tripFooter}>
        <View style={styles.distanceContainer}>
          <Route01Icon size={16} color={iconColor} strokeWidth={2} />
          <ThemedText style={styles.distanceText}>{trip.distance}</ThemedText>
        </View>
        <ThemedText style={styles.earningsText}>{trip.earnings}</ThemedText>
      </View>
      </ThemedView>
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const filterButtonBg = useThemeColor({ light: '#EBF5FF', dark: '#1E3A5F' }, 'background');
  
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
          <ThemedText type="defaultSemiBold" style={styles.summaryValue}>GHS 434</ThemedText>
          <ThemedText style={styles.summaryLabel}>Total Earnings</ThemedText>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <ThemedText type="defaultSemiBold" style={styles.summaryValue}>3</ThemedText>
          <ThemedText style={styles.summaryLabel}>Trips</ThemedText>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <ThemedText type="defaultSemiBold" style={styles.summaryValue}>35.7 km</ThemedText>
          <ThemedText style={styles.summaryLabel}>Distance</ThemedText>
        </View>
      </ThemedView>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity style={[styles.filterTab, styles.filterTabActive]}>
          <ThemedText style={[styles.filterTabText, styles.filterTabTextActive]}>Today</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterTab}>
          <ThemedText style={styles.filterTabText}>This Week</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterTab}>
          <ThemedText style={styles.filterTabText}>This Month</ThemedText>
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
});
