import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRequests } from '@/hooks/use-requests';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useToast } from '@/hooks/use-toast';
import { cancelRequest, TowingRequest } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
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

export default function OperatorJobsScreen() {
    const { activeRequests, pastRequests, isLoading, error, refresh } = useRequests('operator');
    const { showToast } = useToast();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isCancelling, setIsCancelling] = useState<string | null>(null);

    const tintColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');
    const backgroundColor = useThemeColor({}, 'background');
    const cardBg = useThemeColor({ light: '#ffffff', dark: '#1F2937' }, 'background');
    const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');

    const onRefresh = async () => {
        setIsRefreshing(true);
        await refresh();
        setIsRefreshing(false);
    };

    const handleCancelJob = (requestId: string) => {
        Alert.alert(
            'Cancel Job',
            'Are you sure you want to cancel this job?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsCancelling(requestId);
                            await cancelRequest(requestId, 'Cancelled by operator from jobs list');
                            showToast('Job cancelled successfully', 'success');
                            refresh();
                        } catch (err) {
                            showToast('Failed to cancel job', 'error');
                        } finally {
                            setIsCancelling(null);
                        }
                    }
                }
            ]
        );
    };

    const formatStatus = (status: string) => {
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const RequestCard = ({ request, isActive = false }: { request: TowingRequest; isActive?: boolean }) => (
        <ThemedView style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.cardHeader}>
                <View style={styles.statusBadge}>
                    <View style={[styles.statusDot, { backgroundColor: isActive ? '#22c55e' : '#9ca3af' }]} />
                    <ThemedText style={styles.statusText}>{formatStatus(request.status)}</ThemedText>
                </View>
                <ThemedText style={styles.dateText}>
                    {new Date(request.createdAt).toLocaleDateString()}
                </ThemedText>
            </View>

            <View style={styles.addressSection}>
                <View style={styles.addressRow}>
                    <Ionicons name="location-outline" size={16} color="#22c55e" />
                    <ThemedText style={styles.addressText} numberOfLines={1}>{request.pickupAddress}</ThemedText>
                </View>
                <View style={styles.addressRow}>
                    <Ionicons name="flag-outline" size={16} color="#ef4444" />
                    <ThemedText style={styles.addressText} numberOfLines={1}>{request.destinationAddress}</ThemedText>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <ThemedText style={styles.priceText}>GH₵ {request.estimatedPrice.toFixed(0)}</ThemedText>
                <View style={styles.actionRow}>
                    {isActive && (
                        <>
                            <TouchableOpacity
                                style={[styles.cancelButton, { borderColor: '#ef4444' }]}
                                onPress={() => handleCancelJob(request.id)}
                                disabled={isCancelling === request.id}
                            >
                                {isCancelling === request.id ? (
                                    <ActivityIndicator size="small" color="#ef4444" />
                                ) : (
                                    <ThemedText style={styles.cancelText}>Cancel</ThemedText>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.resumeButton, { backgroundColor: tintColor }]}
                                onPress={() => {
                                    const route = request.status === 'accepted'
                                        ? '/screens/operator/navigation-to-pickup'
                                        : '/screens/operator/live-tracking';
                                    router.push({
                                        pathname: route as any,
                                        params: { requestId: request.id },
                                    });
                                }}
                            >
                                <ThemedText style={styles.resumeText}>Resume</ThemedText>
                            </TouchableOpacity>
                        </>
                    )}
                    {!isActive && (
                        <TouchableOpacity
                            onPress={() => router.push({
                                pathname: '/screens/operator/job-detail',
                                params: { requestId: request.id },
                            })}
                        >
                            <ThemedText style={[styles.viewDetailsText, { color: '#003554' }]}>View Details →</ThemedText>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </ThemedView>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
            <View style={styles.header}>
                <ThemedText style={styles.title}>My Jobs</ThemedText>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
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
                        <ThemedText style={styles.sectionTitle}>Active Jobs</ThemedText>
                        {activeRequests.map(req => (
                            <RequestCard key={req.id} request={req} isActive />
                        ))}
                    </View>
                )}

                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Job History</ThemedText>
                    {isLoading && !isRefreshing ? (
                        <ActivityIndicator size="large" color={tintColor} style={styles.loader} />
                    ) : pastRequests.length > 0 ? (
                        pastRequests.map(req => (
                            <RequestCard key={req.id} request={req} />
                        ))
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="document-text-outline" size={48} color="#9ca3af" />
                            <ThemedText style={styles.emptyText}>No job history found</ThemedText>
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
        paddingVertical: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
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
        color: '#b91c1c',
        fontWeight: '600',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#9ca3af',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
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
        marginBottom: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    dateText: {
        fontSize: 12,
        color: '#9ca3af',
    },
    addressSection: {
        gap: 8,
        marginBottom: 16,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    addressText: {
        fontSize: 14,
        flex: 1,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    priceText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#22c55e',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 10,
    },
    resumeButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    resumeText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    cancelButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
    },
    cancelText: {
        color: '#ef4444',
        fontSize: 14,
        fontWeight: '600',
    },
    viewDetailsText: {
        fontSize: 14,
        color: '#9ca3af',
        fontWeight: '500',
    },
    loader: {
        marginTop: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    emptyText: {
        color: '#9ca3af',
        fontSize: 16,
    },
});
