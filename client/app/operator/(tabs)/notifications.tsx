/**
 * Notifications & Activity Screen
 * 
 * Displays alerts, activity logs, and system notices for the operator.
 * Fetches real data from the notifications API.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
    getCurrentUser,
    getNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from '@/lib/api';
import type { AppNotification } from '@/lib/api';

// Map backend notification types to icon categories
type IconCategory = 'job' | 'payment' | 'system' | 'missed';

function getIconCategory(type: string): IconCategory {
    switch (type) {
        case 'request':
        case 'status_update':
            return 'job';
        case 'payment':
            return 'payment';
        case 'rating':
        case 'system':
            return 'system';
        default:
            return 'system';
    }
}

function formatTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}

const FILTER_TABS = ['All', 'Alerts', 'Payment', 'System'] as const;

export default function NotificationsScreen() {
    const backgroundColor = useThemeColor({}, 'background');
    const tintColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');
    const subtitleColor = useThemeColor({ light: '#6b7280', dark: '#9ca3af' }, 'text');
    const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');

    const [activeTab, setActiveTab] = useState<typeof FILTER_TABS[number]>('All');
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            const user = await getCurrentUser();
            if (!user?.id) return;

            const result = await getNotifications(1, 50);
            setNotifications(result.notifications);
            setUnreadCount(result.unreadCount);
        } catch (error) {
            if (__DEV__) console.warn('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchNotifications();
    }, [fetchNotifications]);

    const getIcon = (type: string) => {
        const category = getIconCategory(type);
        switch (category) {
            case 'job':
                return <Ionicons name="notifications-outline" size={24} color="#003554" />;
            case 'payment':
                return <Ionicons name="card-outline" size={24} color="#16a34a" />;
            case 'missed':
                return <Ionicons name="alert-circle-outline" size={24} color="#dc2626" />;
            case 'system':
                return <Ionicons name="settings-outline" size={24} color="#6b7280" />;
            default:
                return <Ionicons name="notifications-outline" size={24} color={tintColor} />;
        }
    };

    const getIconBg = (type: string) => {
        const category = getIconCategory(type);
        switch (category) {
            case 'job': return '#bae6fd';
            case 'payment': return '#dcfce7';
            case 'missed': return '#fee2e2';
            case 'system': return '#f3f4f6';
            default: return '#f3f4f6';
        }
    };

    const handleMarkAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        // Fire-and-forget API call
        markNotificationAsRead(id);
    };

    const handleMarkAllAsRead = async () => {
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        // Fire-and-forget API call
        markAllNotificationsAsRead();
    };

    const filteredNotifications = notifications.filter(n => {
        const category = getIconCategory(n.type);
        if (activeTab === 'All') return true;
        if (activeTab === 'Alerts') return category === 'job' || category === 'missed';
        if (activeTab === 'Payment') return category === 'payment';
        if (activeTab === 'System') return category === 'system';
        return true;
    });

    const renderItem = ({ item }: { item: AppNotification }) => (
        <TouchableOpacity
            style={[
                styles.notificationItem,
                { backgroundColor: item.isRead ? 'transparent' : `${tintColor}08` }
            ]}
            onPress={() => !item.isRead && handleMarkAsRead(item.id)}
        >
            <View style={[styles.iconContainer, { backgroundColor: getIconBg(item.type) }]}>
                {getIcon(item.type)}
            </View>

            <View style={styles.contentContainer}>
                <View style={styles.headerRow}>
                    <ThemedText style={[styles.itemTitle, !item.isRead && styles.unreadTitle]}>
                        {item.title}
                    </ThemedText>
                    <ThemedText style={styles.timestamp}>
                        {formatTimeAgo(item.createdAt)}
                    </ThemedText>
                </View>

                <ThemedText style={styles.message} numberOfLines={2}>
                    {item.message}
                </ThemedText>
            </View>

            {!item.isRead && (
                <View style={[styles.unreadDot, { backgroundColor: tintColor }]} />
            )}
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <ThemedView style={[styles.container, { backgroundColor }]}>
                <StatusBar barStyle={backgroundColor === '#151718' ? 'light-content' : 'dark-content'} />
                <SafeAreaView edges={['top']} style={styles.safeArea}>
                    <View style={styles.header}>
                        <ThemedText style={styles.headerTitle}>Activity</ThemedText>
                    </View>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={tintColor} />
                        <ThemedText style={styles.loadingText}>Loading notifications...</ThemedText>
                    </View>
                </SafeAreaView>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={[styles.container, { backgroundColor }]}>
            <StatusBar barStyle={backgroundColor === '#151718' ? 'light-content' : 'dark-content'} />
            <SafeAreaView edges={['top']} style={styles.safeArea}>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <ThemedText style={styles.headerTitle}>Activity</ThemedText>
                        {unreadCount > 0 && (
                            <View style={[styles.badge, { backgroundColor: tintColor }]}>
                                <Text style={styles.badgeText}>{unreadCount}</Text>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity onPress={handleMarkAllAsRead}>
                        <Ionicons name="checkmark-done-outline" size={24} color={tintColor} />
                    </TouchableOpacity>
                </View>

                {/* Filter Tabs */}
                <View style={styles.tabContainer}>
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={FILTER_TABS}
                        keyExtractor={item => item}
                        contentContainerStyle={{ paddingHorizontal: 20 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.filterTab,
                                    activeTab === item && { backgroundColor: tintColor, borderWidth: 0 },
                                    { borderColor }
                                ]}
                                onPress={() => setActiveTab(item)}
                            >
                                <Text style={[
                                    styles.filterText,
                                    { color: activeTab === item ? '#ffffff' : subtitleColor }
                                ]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                {/* Notifications List */}
                <FlatList
                    data={filteredNotifications}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={tintColor}
                            colors={[tintColor]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="checkmark-circle-outline" size={48} color="#d1d5db" />
                            <ThemedText style={styles.emptyTitle}>
                                {"You're all caught up!"}
                            </ThemedText>
                            <ThemedText style={styles.emptyText}>
                                No notifications to show right now.
                            </ThemedText>
                        </View>
                    }
                    ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: borderColor }]} />}
                />

            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: 'Gilroy-Bold',
        fontWeight: '700',
    },
    badge: {
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    badgeText: {
        color: '#ffffff',
        fontSize: 12,
        fontFamily: 'Gilroy-Bold',
        fontWeight: '700',
    },
    tabContainer: {
        marginBottom: 16,
        height: 40,
    },
    filterTab: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
    },
    filterText: {
        fontFamily: 'Gilroy-Medium',
        fontSize: 14,
    },
    listContent: {
        paddingBottom: 100,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 20,
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    contentContainer: {
        flex: 1,
        marginRight: 8,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    itemTitle: {
        fontSize: 16,
        fontFamily: 'Gilroy-SemiBold',
        flex: 1,
        marginRight: 8,
    },
    unreadTitle: {
        fontFamily: 'Gilroy-Bold',
    },
    timestamp: {
        fontSize: 12,
        color: '#9ca3af',
        fontFamily: 'Gilroy-Regular',
    },
    message: {
        fontSize: 14,
        color: '#6b7280',
        fontFamily: 'Gilroy-Regular',
        lineHeight: 20,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: 6,
    },
    separator: {
        height: 1,
        marginLeft: 84,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    loadingText: {
        color: '#9ca3af',
        fontFamily: 'Gilroy-Medium',
        fontSize: 16,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    emptyTitle: {
        fontFamily: 'Gilroy-SemiBold',
        fontSize: 18,
        marginTop: 4,
    },
    emptyText: {
        color: '#9ca3af',
        fontFamily: 'Gilroy-Medium',
        fontSize: 14,
    },
});
