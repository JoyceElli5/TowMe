/**
 * Notifications & Activity Screen
 *
 * Displays alerts, activity logs, and system notices for the operator.
 * Fetches real data from the notifications table via notificationService.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/services/authService';
import {
    getNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    type Notification,
} from '@/lib/services/notificationService';

type FilterTab = 'All' | 'Alerts' | 'Payment' | 'System';
const FILTER_TABS: FilterTab[] = ['All', 'Alerts', 'Payment', 'System'];

type DisplayType = 'job' | 'payment' | 'system' | 'missed';

function getDisplayType(apiType: Notification['type']): DisplayType {
    switch (apiType) {
        case 'request': return 'job';
        case 'payment': return 'payment';
        case 'status_update': return 'missed';
        case 'rating': return 'system';
        default: return 'system';
    }
}

function formatTimeAgo(dateString: string): string {
    const now = Date.now();
    const diff = now - new Date(dateString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
}

export default function NotificationsScreen() {
    const backgroundColor = useThemeColor({}, 'background');
    const tintColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');
    const subtitleColor = useThemeColor({ light: '#6b7280', dark: '#9ca3af' }, 'text');
    const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');

    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<FilterTab>('All');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async (isRefresh = false) => {
        if (isRefresh) setIsRefreshing(true);
        else setIsLoading(true);
        try {
            const user = await getCurrentUser();
            if (user) {
                const data = await getNotifications(user.id);
                setNotifications(data);
            }
        } catch {
            showToast('Failed to load notifications', 'error');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const getIcon = (type: DisplayType) => {
        switch (type) {
            case 'job': return <Ionicons name="notifications-outline" size={24} color="#003554" />;
            case 'payment': return <Ionicons name="card-outline" size={24} color="#16a34a" />;
            case 'missed': return <Ionicons name="alert-circle-outline" size={24} color="#dc2626" />;
            case 'system': return <Ionicons name="settings-outline" size={24} color="#6b7280" />;
        }
    };

    const getIconBg = (type: DisplayType) => {
        switch (type) {
            case 'job': return '#bae6fd';
            case 'payment': return '#dcfce7';
            case 'missed': return '#fee2e2';
            case 'system': return '#f3f4f6';
        }
    };

    const markAsRead = async (notification: Notification) => {
        if (notification.is_read) return;
        try {
            await markNotificationAsRead(notification.id);
            setNotifications(prev =>
                prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
            );
        } catch {
            // Silent — UI already reflects optimistically if needed
        }
    };

    const markAllAsRead = async () => {
        try {
            const user = await getCurrentUser();
            if (user) {
                await markAllNotificationsAsRead(user.id);
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                showToast('All notifications marked as read', 'success');
            }
        } catch {
            showToast('Failed to mark all as read', 'error');
        }
    };

    const filteredNotifications = notifications.filter(n => {
        const dt = getDisplayType(n.type);
        if (activeTab === 'All') return true;
        if (activeTab === 'Alerts') return dt === 'job' || dt === 'missed';
        if (activeTab === 'Payment') return dt === 'payment';
        if (activeTab === 'System') return dt === 'system';
        return true;
    });

    const renderItem = ({ item }: { item: Notification }) => {
        const dt = getDisplayType(item.type);
        return (
            <TouchableOpacity
                style={[
                    styles.notificationItem,
                    { backgroundColor: item.is_read ? 'transparent' : `${tintColor}08` },
                ]}
                onPress={() => markAsRead(item)}
            >
                <View style={[styles.iconContainer, { backgroundColor: getIconBg(dt) }]}>
                    {getIcon(dt)}
                </View>
                <View style={styles.contentContainer}>
                    <View style={styles.headerRow}>
                        <ThemedText style={[styles.itemTitle, !item.is_read && styles.unreadTitle]}>
                            {item.title}
                        </ThemedText>
                        <ThemedText style={styles.timestamp}>{formatTimeAgo(item.created_at)}</ThemedText>
                    </View>
                    <ThemedText style={styles.message} numberOfLines={2}>
                        {item.message}
                    </ThemedText>
                </View>
                {!item.is_read && (
                    <View style={[styles.unreadDot, { backgroundColor: tintColor }]} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <ThemedView style={[styles.container, { backgroundColor }]}>
            <StatusBar barStyle={backgroundColor === '#151718' ? 'light-content' : 'dark-content'} />
            <SafeAreaView edges={['top']} style={styles.safeArea}>

                {/* Header */}
                <View style={styles.header}>
                    <ThemedText style={styles.headerTitle}>Activity</ThemedText>
                    <TouchableOpacity onPress={markAllAsRead}>
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
                                    { borderColor },
                                ]}
                                onPress={() => setActiveTab(item)}
                            >
                                <Text style={[
                                    styles.filterText,
                                    { color: activeTab === item ? '#ffffff' : subtitleColor },
                                ]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                {/* Notifications List */}
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={tintColor} />
                    </View>
                ) : (
                    <FlatList
                        data={filteredNotifications}
                        keyExtractor={item => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={() => loadNotifications(true)}
                                tintColor={tintColor}
                            />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Ionicons name="checkmark-circle-outline" size={48} color="#d1d5db" />
                                <ThemedText style={styles.emptyText}>No notifications here!</ThemedText>
                            </View>
                        }
                        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: borderColor }]} />}
                    />
                )}

            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
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
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: { paddingBottom: 40 },
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
    unreadTitle: { fontFamily: 'Gilroy-Bold' },
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
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 16,
    },
    emptyText: {
        color: '#9ca3af',
        fontFamily: 'Gilroy-Medium',
        fontSize: 16,
    },
});
