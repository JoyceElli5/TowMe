/**
 * Notifications & Activity Screen
 * 
 * Displays alerts, activity logs, and system notices for the operator.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    FlatList,
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

// Types
type NotificationType = 'job' | 'payment' | 'system' | 'missed';

interface NotificationItem {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    actionUrl?: string;
}

// Mock Data
const MOCK_NOTIFICATIONS: NotificationItem[] = [
    {
        id: '1',
        type: 'job',
        title: 'New Job Request',
        message: 'Tow request nearby: Toyota Camry needs assistance at Achimota Mall.',
        timestamp: '2 mins ago',
        read: false,
    },
    {
        id: '2',
        type: 'payment',
        title: 'Payment Received',
        message: 'You received GH₵ 150.00 for trip #TR-88392 via Mobile Money.',
        timestamp: '1 hour ago',
        read: false,
    },
    {
        id: '3',
        type: 'missed',
        title: 'Missed Request',
        message: 'You missed a job request while you were offline in East Legon.',
        timestamp: '3 hours ago',
        read: true,
    },
    {
        id: '4',
        type: 'system',
        title: 'Document Expiry Warning',
        message: 'Your vehicle insurance is due for renewal in 5 days. Please update it to avoid suspension.',
        timestamp: 'Yesterday',
        read: true,
    },
    {
        id: '5',
        type: 'job',
        title: 'Job Cancelled',
        message: 'Trip #TR-99201 was cancelled by the user. Cancellation fee applied.',
        timestamp: 'Yesterday',
        read: true,
    },
    {
        id: '6',
        type: 'system',
        title: 'Weekly Report',
        message: 'Your weekly performance report is ready. You completed 25 trips this week!',
        timestamp: '2 days ago',
        read: true,
    },
];

const FILTER_TABS = ['All', 'Alerts', 'Payment', 'System'] as const;

export default function NotificationsScreen() {
    const backgroundColor = useThemeColor({}, 'background');
    const tintColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');
    const cardBg = useThemeColor({ light: '#ffffff', dark: '#1F2937' }, 'background');
    const textColor = useThemeColor({}, 'text');
    const subtitleColor = useThemeColor({ light: '#6b7280', dark: '#9ca3af' }, 'text');
    const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');

    const [activeTab, setActiveTab] = useState<typeof FILTER_TABS[number]>('All');
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'job':
                return <Ionicons name="notifications-outline" size={24} color="#003554" />; // Job alerts
            case 'payment':
                return <Ionicons name="card-outline" size={24} color="#16a34a" />; // Success green
            case 'missed':
                return <Ionicons name="alert-circle-outline" size={24} color="#dc2626" />; // Warning red
            case 'system':
                return <Ionicons name="settings-outline" size={24} color="#6b7280" />; // Neutral grey
            default:
                return <Ionicons name="notifications-outline" size={24} color={tintColor} />;
        }
    };

    const getIconBg = (type: NotificationType) => {
        switch (type) {
            case 'job': return '#bae6fd'; // Light blue
            case 'payment': return '#dcfce7'; // Light green
            case 'missed': return '#fee2e2'; // Light red
            case 'system': return '#f3f4f6'; // Light grey
            default: return '#f3f4f6';
        }
    };

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const filteredNotifications = notifications.filter(n => {
        if (activeTab === 'All') return true;
        if (activeTab === 'Alerts') return n.type === 'job' || n.type === 'missed';
        if (activeTab === 'Payment') return n.type === 'payment';
        if (activeTab === 'System') return n.type === 'system';
        return true;
    });

    const renderItem = ({ item }: { item: NotificationItem }) => (
        <TouchableOpacity
            style={[
                styles.notificationItem,
                { backgroundColor: item.read ? 'transparent' : `${tintColor}08` } // Slight tint for unread
            ]}
            onPress={() => markAsRead(item.id)}
        >
            <View style={[styles.iconContainer, { backgroundColor: getIconBg(item.type) }]}>
                {getIcon(item.type)}
            </View>

            <View style={styles.contentContainer}>
                <View style={styles.headerRow}>
                    <ThemedText style={[styles.itemTitle, !item.read && styles.unreadTitle]}>
                        {item.title}
                    </ThemedText>
                    <ThemedText style={styles.timestamp}>{item.timestamp}</ThemedText>
                </View>

                <ThemedText style={styles.message} numberOfLines={2}>
                    {item.message}
                </ThemedText>
            </View>

            {!item.read && (
                <View style={[styles.unreadDot, { backgroundColor: tintColor }]} />
            )}
        </TouchableOpacity>
    );

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
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="checkmark-circle-outline" size={48} color="#d1d5db" />
                            <ThemedText style={styles.emptyText}>No notifications here!</ThemedText>
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
    listContent: {
        paddingBottom: 40,
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
        marginLeft: 84, // Align with text content
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
