
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { TowingRequest } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

// Estimated minutes per kilometer
const MINUTES_PER_KM_ESTIMATE = 2.5;

interface JobRequestPreviewProps {
    request: TowingRequest;
    onAccept: () => void;
    onDecline: () => void;
    isAccepting?: boolean;
    timeLeft?: number;
}

export default function JobRequestPreview({
    request,
    onAccept,
    onDecline,
    isAccepting = false,
    timeLeft
}: JobRequestPreviewProps) {
    const tintColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');
    const backgroundColor = useThemeColor({ light: '#ffffff', dark: '#1F2937' }, 'background');
    const locationBgColor = useThemeColor({ light: '#f9fafb', dark: '#374151' }, 'background');
    const errorColor = '#ef4444';
    const successColor = '#22c55e';

    const formatVehicleType = (vehicleType?: string): string => {
        if (!vehicleType) return 'Unknown';
        return vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1);
    };

    return (
        <ThemedView style={[styles.container, { backgroundColor }]}>
            {/* Header with Timer and Price */}
            <View style={styles.header}>
                <View>
                    <ThemedText style={styles.newJobText}>New Job Request!</ThemedText>
                    {timeLeft !== undefined && (
                        <ThemedText style={[styles.timerText, { color: timeLeft < 10 ? errorColor : tintColor }]}>
                            Closing in {timeLeft}s
                        </ThemedText>
                    )}
                </View>
                <View style={styles.priceContainer}>
                    <ThemedText style={styles.priceValue}>GH₵ {request.estimatedPrice?.toFixed(0) || '0'}</ThemedText>
                    <ThemedText style={styles.priceLabel}>Est. Earnings</ThemedText>
                </View>
            </View>

            <View style={styles.divider} />

            {/* Trip Info Grid */}
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Ionicons name="location-outline" size={20} color={tintColor} />
                    <ThemedText style={styles.statValue}>{request.distanceKm?.toFixed(1) || '0'} km</ThemedText>
                    <ThemedText style={styles.statLabel}>Distance</ThemedText>
                </View>
                <View style={styles.statItem}>
                    <Ionicons name="time-outline" size={20} color={tintColor} />
                    <ThemedText style={styles.statValue}>~{Math.ceil((request.distanceKm || 0) * MINUTES_PER_KM_ESTIMATE)} min</ThemedText>
                    <ThemedText style={styles.statLabel}>Duration</ThemedText>
                </View>
                <View style={styles.statItem}>
                    <Ionicons name="car-outline" size={20} color={tintColor} />
                    <ThemedText style={styles.statValue}>{formatVehicleType(request.vehicleType)}</ThemedText>
                    <ThemedText style={styles.statLabel}>Vehicle</ThemedText>
                </View>
            </View>

            {/* Locations */}
            <View style={[styles.locationsContainer, { backgroundColor: locationBgColor }]}>
                <View style={styles.locationRow}>
                    <View style={[styles.dot, { backgroundColor: successColor }]} />
                    <ThemedText numberOfLines={1} style={styles.locationText}>{request.pickupAddress}</ThemedText>
                </View>
                <View style={styles.locationRow}>
                    <View style={[styles.dot, { backgroundColor: errorColor }]} />
                    <ThemedText numberOfLines={1} style={styles.locationText}>{request.destinationAddress}</ThemedText>
                </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.button, styles.declineButton]}
                    onPress={onDecline}
                    disabled={isAccepting}
                >
                    <ThemedText style={styles.declineText}>Decline</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.acceptButton, { backgroundColor: successColor }]}
                    onPress={onAccept}
                    disabled={isAccepting}
                >
                    {isAccepting ? (
                        <ActivityIndicator color="white" size="small" />
                    ) : (
                        <ThemedText style={styles.acceptText}>Accept Job</ThemedText>
                    )}
                </TouchableOpacity>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 100 : 90, // Increased to lift buttons above tab bar
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    newJobText: {
        fontSize: 18,
        fontWeight: '700',
        fontFamily: 'Gilroy-Bold',
        marginBottom: 4,
    },
    timerText: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Gilroy-SemiBold',
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    priceValue: {
        fontSize: 22,
        fontWeight: '700',
        color: '#22c55e',
        fontFamily: 'Gilroy-Bold',
    },
    priceLabel: {
        fontSize: 12,
        color: '#9ca3af',
        fontFamily: 'Gilroy-Regular',
    },
    divider: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        marginTop: 4,
        fontFamily: 'Gilroy-SemiBold',
    },
    statLabel: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 2,
        fontFamily: 'Gilroy-Regular',
    },
    locationsContainer: {
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        gap: 8,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    locationText: {
        flex: 1,
        fontSize: 14,
        fontFamily: 'Gilroy-Medium',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
    },
    declineButton: {
        flex: 1,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    acceptButton: {
        flex: 2,
        shadowColor: '#22c55e',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    declineText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4b5563',
        fontFamily: 'Gilroy-SemiBold',
    },
    acceptText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        fontFamily: 'Gilroy-SemiBold',
    },
});
