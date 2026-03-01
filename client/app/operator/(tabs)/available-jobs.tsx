import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useToast } from '@/hooks/use-toast';
import { acceptRequest, getPendingRequests, TowingRequest } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OperatorAvailableJobsScreen() {
    const [availableRequests, setAvailableRequests] = useState<TowingRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isAccepting, setIsAccepting] = useState<string | null>(null);
    const { showToast } = useToast();

    const tintColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');
    const backgroundColor = useThemeColor({}, 'background');
    const cardBg = useThemeColor({ light: '#ffffff', dark: '#1F2937' }, 'background');
    const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');

    const fetchRequests = async () => {
        try {
            const requests = await getPendingRequests();
            setAvailableRequests(requests);
        } catch (error) {
            console.error('Error fetching pending requests:', error);
            showToast('Failed to load available jobs', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchRequests();
        }, [])
    );

    const onRefresh = async () => {
        setIsRefreshing(true);
        await fetchRequests();
        setIsRefreshing(false);
    };

    const handleAcceptJob = (requestId: string) => {
        Alert.alert(
            'Accept Job',
            'Are you sure you want to accept this job?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes, Accept',
                    onPress: async () => {
                        try {
                            setIsAccepting(requestId);
                            await acceptRequest(requestId);
                            showToast('Job accepted successfully!', 'success');
                            
                            // Remove from list
                            setAvailableRequests(prev => prev.filter(req => req.id !== requestId));
                            
                            // Navigate to navigation screen
                            router.push({
                                pathname: '/screens/operator/navigation-to-pickup',
                                params: { requestId },
                            });
                        } catch (err: any) {
                            console.error('Error accepting job:', err);
                            showToast(err.message || 'Failed to accept job', 'error');
                            // Refresh just in case it was taken
                            fetchRequests();
                        } finally {
                            setIsAccepting(null);
                        }
                    }
                }
            ]
        );
    };

    const RequestCard = ({ request }: { request: TowingRequest }) => (
        <ThemedView style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.cardHeader}>
                <View style={styles.vehicleBadge}>
                    <Ionicons name="car-sport-outline" size={14} color={tintColor} />
                    <ThemedText style={[styles.vehicleText, { color: tintColor }]}>
                        {request.vehicleType?.toUpperCase() || 'UNKNOWN'}
                    </ThemedText>
                </View>
                <ThemedText style={styles.dateText}>
                    {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </ThemedText>
            </View>

            <View style={styles.addressSection}>
                <View style={styles.addressRow}>
                    <Ionicons name="location-outline" size={16} color="#22c55e" />
                    <ThemedText style={styles.addressText} numberOfLines={2}>{request.pickupAddress}</ThemedText>
                </View>
                <View style={styles.addressRow}>
                    <Ionicons name="flag-outline" size={16} color="#ef4444" />
                    <ThemedText style={styles.addressText} numberOfLines={2}>{request.destinationAddress}</ThemedText>
                </View>
            </View>

            <View style={styles.distanceRow}>
                <Ionicons name="git-commit-outline" size={14} color="#9ca3af" />
                <ThemedText style={styles.distanceText}>
                    {(request.distanceKm || 0).toFixed(1)} km distance
                </ThemedText>
            </View>

            <View style={styles.cardFooter}>
                <ThemedText style={styles.priceText}>GH₵ {(request.estimatedPrice || 0).toFixed(0)}</ThemedText>
                
                <TouchableOpacity
                    style={[styles.acceptButton, { backgroundColor: tintColor }]}
                    onPress={() => handleAcceptJob(request.id)}
                    disabled={isAccepting === request.id}
                >
                    {isAccepting === request.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <ThemedText style={styles.acceptText}>Accept Job</ThemedText>
                    )}
                </TouchableOpacity>
            </View>
        </ThemedView>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
            <View style={styles.header}>
                <ThemedText style={styles.title}>Available Jobs</ThemedText>
                <ThemedText style={styles.subtitle}>
                    Jobs matching your vehicle type that need operators
                </ThemedText>
            </View>

            {isLoading && !isRefreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={tintColor} />
                </View>
            ) : availableRequests.length === 0 ? (
                <ScrollView 
                    contentContainerStyle={styles.centerContainer}
                    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={tintColor} />}
                >
                    <Ionicons name="checkmark-circle-outline" size={64} color="#9ca3af" />
                    <ThemedText style={styles.emptyText}>No available jobs right now.</ThemedText>
                    <ThemedText style={styles.emptySubtext}>We'll notify you when a new request comes in.</ThemedText>
                    <TouchableOpacity style={[styles.refreshButton, { backgroundColor: tintColor }]} onPress={onRefresh}>
                        <ThemedText style={styles.refreshButtonText}>Refresh</ThemedText>
                    </TouchableOpacity>
                </ScrollView>
            ) : (
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={tintColor} />
                    }
                >
                    {availableRequests.map(req => (
                        <RequestCard key={req.id} request={req} />
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
        paddingVertical: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#9ca3af',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        marginBottom: 24,
    },
    refreshButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    refreshButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    vehicleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 6,
    },
    vehicleText: {
        fontSize: 12,
        fontWeight: '700',
    },
    dateText: {
        fontSize: 12,
        color: '#9ca3af',
        fontWeight: '500',
    },
    addressSection: {
        gap: 12,
        marginBottom: 12,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    addressText: {
        fontSize: 14,
        flex: 1,
        lineHeight: 20,
    },
    distanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    distanceText: {
        fontSize: 13,
        color: '#6b7280',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#22c55e',
    },
    acceptButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 120,
        alignItems: 'center',
    },
    acceptText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
