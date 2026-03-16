/**
 * Operator Trip History Screen
 * 
 * Shows completed trips for the operator with real API data.
 */

import { Ionicons } from '@expo/vector-icons';
import { StarIcon, Route01Icon } from 'hugeicons-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getCurrentUser } from '@/lib/api';
import { getOperatorRequests, TowingRequest } from '@/lib/api/requests';

type TimeFilter = 'today' | 'week' | 'month' | 'all';

function TripCard({ trip }: { trip: TowingRequest }) {
    const iconColor = useThemeColor({}, 'icon');
    const cardBg = useThemeColor({ light: '#ffffff', dark: '#1F2937' }, 'background');

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

    const statusColors: Record<string, string> = {
        completed: '#10B981',
        cancelled: '#EF4444',
        in_progress: '#F59E0B',
        accepted: '#3B82F6',
        pending: '#6B7280',
    };

    return (
        <ThemedView style={[styles.tripCard, { backgroundColor: cardBg }]}>
            <View style={styles.tripHeader}>
                <ThemedText style={styles.tripDate}>{dateLabel}</ThemedText>
                <View style={[styles.statusBadge, { backgroundColor: `${statusColors[trip.status] || '#6B7280'}15` }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColors[trip.status] || '#6B7280' }]} />
                    <ThemedText style={[styles.statusText, { color: statusColors[trip.status] || '#6B7280' }]}>
                        {trip.status.replace('_', ' ').charAt(0).toUpperCase() + trip.status.replace('_', ' ').slice(1)}
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

            {trip.user && (
                <View style={styles.customerRow}>
                    <Ionicons name="person-outline" size={14} color={iconColor} />
                    <ThemedText style={styles.customerName}>{trip.user.fullName}</ThemedText>
                </View>
            )}

            <View style={styles.tripFooter}>
                <View style={styles.footerLeft}>
                    <View style={styles.distanceContainer}>
                        <Route01Icon size={14} color={iconColor} strokeWidth={2} />
                        <ThemedText style={styles.distanceText}>{trip.distanceKm?.toFixed(1) || '0'} km</ThemedText>
                    </View>
                    {trip.user?.averageRating != null && trip.user.averageRating > 0 && (
                        <View style={styles.ratingContainer}>
                            <StarIcon size={14} color="#F59E0B" strokeWidth={2} />
                            <ThemedText style={styles.ratingText}>{trip.user.averageRating.toFixed(1)}</ThemedText>
                        </View>
                    )}
                </View>
                <ThemedText style={[styles.earningsText, trip.status === 'cancelled' && { color: '#EF4444' }]}>
                    {trip.status === 'cancelled' ? 'Cancelled' : `GH₵ ${(trip.finalPrice || trip.estimatedPrice || 0).toFixed(0)}`}
                </ThemedText>
            </View>
        </ThemedView>
    );
}

export default function OperatorHistoryScreen() {
    const backgroundColor = useThemeColor({}, 'background');
    const tintColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');

    const [trips, setTrips] = useState<TowingRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState<TimeFilter>('all');

    const fetchTrips = useCallback(async (showLoader = true) => {
        if (showLoader) setIsLoading(true);
        try {
            const user = await getCurrentUser();
            if (!user) return;

            const response = await getOperatorRequests(user.id, { limit: 100 });
            if (response.data) {
                setTrips(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch operator trip history:', error);
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
        if (activeFilter === 'all') return true;
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

    // Compute summary
    const completedTrips = filteredTrips.filter(t => t.status === 'completed');
    const totalEarnings = completedTrips.reduce((sum, t) => sum + (t.finalPrice || t.estimatedPrice || 0), 0);
    const totalDistance = completedTrips.reduce((sum, t) => sum + (t.distanceKm || 0), 0);

    const filters: { key: TimeFilter; label: string }[] = [
        { key: 'today', label: 'Today' },
        { key: 'week', label: 'Week' },
        { key: 'month', label: 'Month' },
        { key: 'all', label: 'All' },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.header}>
                <ThemedText style={styles.title}>Trip History</ThemedText>
            </View>

            <ThemedView style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                    <ThemedText style={[styles.summaryValue, { color: tintColor }]}>
                        GH₵ {totalEarnings.toFixed(0)}
                    </ThemedText>
                    <ThemedText style={styles.summaryLabel}>Earned</ThemedText>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <ThemedText style={[styles.summaryValue, { color: tintColor }]}>
                        {completedTrips.length}
                    </ThemedText>
                    <ThemedText style={styles.summaryLabel}>Trips</ThemedText>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <ThemedText style={[styles.summaryValue, { color: tintColor }]}>
                        {totalDistance.toFixed(1)} km
                    </ThemedText>
                    <ThemedText style={styles.summaryLabel}>Distance</ThemedText>
                </View>
            </ThemedView>

            <View style={styles.filterTabs}>
                {filters.map((f) => (
                    <TouchableOpacity
                        key={f.key}
                        style={[styles.filterTab, activeFilter === f.key && [styles.filterTabActive, { backgroundColor: tintColor }]]}
                        onPress={() => setActiveFilter(f.key)}
                    >
                        <ThemedText style={[styles.filterTabText, activeFilter === f.key && styles.filterTabTextActive]}>
                            {f.label}
                        </ThemedText>
                    </TouchableOpacity>
                ))}
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={tintColor} />
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
                            <Ionicons name="car-outline" size={48} color="#9ca3af" />
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
    container: { flex: 1 },
    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
    title: { fontSize: 28, fontWeight: '700', fontFamily: 'Gilroy-Bold' },
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
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryValue: { fontSize: 20, fontWeight: '700', marginBottom: 4, fontFamily: 'Gilroy-SemiBold' },
    summaryLabel: { fontSize: 12, color: '#6b7280', fontFamily: 'Gilroy-Regular' },
    summaryDivider: { width: 1, backgroundColor: '#E5E7EB' },
    filterTabs: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 8 },
    filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    filterTabActive: { backgroundColor: '#003554' },
    filterTabText: { fontSize: 14, fontFamily: 'Gilroy-Medium' },
    filterTabTextActive: { color: '#FFFFFF' },
    tripList: { flex: 1 },
    tripListContent: { paddingHorizontal: 20, paddingBottom: 120 },
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
    tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    tripDate: { fontSize: 13, fontFamily: 'Gilroy-SemiBold' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 11, fontWeight: '600', fontFamily: 'Gilroy-SemiBold' },
    addressContainer: { marginBottom: 10 },
    addressRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    pickupDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' },
    destinationDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' },
    addressLine: { width: 2, height: 16, backgroundColor: '#E5E7EB', marginLeft: 4, marginVertical: 2 },
    addressText: { flex: 1, fontSize: 13, fontFamily: 'Gilroy-Regular' },
    customerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, paddingTop: 4 },
    customerName: { fontSize: 13, color: '#6b7280', fontFamily: 'Gilroy-Medium' },
    tripFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    distanceContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    distanceText: { fontSize: 13, fontFamily: 'Gilroy-Regular' },
    ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingText: { fontSize: 13, fontFamily: 'Gilroy-SemiBold' },
    earningsText: { fontSize: 18, fontFamily: 'Gilroy-SemiBold', color: '#10B981' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { paddingVertical: 60, alignItems: 'center', gap: 12 },
    emptyText: { fontSize: 16, color: '#9ca3af', fontFamily: 'Gilroy-Regular' },
});
