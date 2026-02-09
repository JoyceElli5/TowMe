/**
 * Operator Messages Screen
 * 
 * Lists active conversations with clients and support.
 * Allows initiating calls directly.
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    Linking,
    StatusBar,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ChatItem {
    id: string;
    name: string;
    message: string;
    timestamp: string;
    unread: number;
    avatar?: string;
    phone: string;
    online: boolean;
    type: 'client' | 'support';
}

const MOCK_CHATS: ChatItem[] = [
    {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Kwame Mensah',
        message: 'I am at the shell station near the roundabout.',
        timestamp: '2 min ago',
        unread: 2,
        phone: '+233241234567',
        online: true,
        type: 'client'
    },
    {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'TowMe Support',
        message: 'Your verification documents have been approved.',
        timestamp: '10:30 AM',
        unread: 0,
        phone: '+233302123456',
        online: true,
        type: 'support'
    },
    {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Ama Serwaa',
        message: 'Thanks for the quick service!',
        timestamp: 'Yesterday',
        unread: 0,
        phone: '+233209876543',
        online: false,
        type: 'client'
    },
    {
        id: '44444444-4444-4444-4444-444444444444',
        name: 'Joseph Osei',
        message: 'Is it possible to pay with cash?',
        timestamp: 'Yesterday',
        unread: 0,
        phone: '+233554321098',
        online: false,
        type: 'client'
    }
];

export default function OperatorMessagesScreen() {
    const backgroundColor = useThemeColor({}, 'background');
    const tintColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');
    const cardBg = useThemeColor({ light: '#ffffff', dark: '#1F2937' }, 'background');
    const textColor = useThemeColor({}, 'text');
    const subtitleColor = useThemeColor({ light: '#6b7280', dark: '#9ca3af' }, 'text');
    const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');

    const [searchQuery, setSearchQuery] = useState('');

    const handleCall = (phone: string) => {
        Linking.openURL(`tel:${phone}`);
    };

    const filteredChats = MOCK_CHATS.filter(chat =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: ChatItem }) => (
        <TouchableOpacity
            style={[styles.chatItem, { backgroundColor: cardBg }]}
            onPress={() => router.push({
                pathname: '/screens/operator/chat-screen',
                params: { requestId: item.id } // In a real app, this would be a conversation or request ID
            })}
        >
            <View style={styles.avatarContainer}>
                {item.type === 'support' ? (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: '#003554' }]}>
                        <ThemedText style={styles.avatarText}>TS</ThemedText>
                    </View>
                ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: '#e5e7eb' }]}>
                        <ThemedText style={[styles.avatarText, { color: '#6b7280' }]}>
                            {item.name.split(' ').map(n => n[0]).join('')}
                        </ThemedText>
                    </View>
                )}
                {item.online && <View style={styles.onlineBadge} />}
            </View>

            <View style={styles.contentContainer}>
                <View style={styles.headerRow}>
                    <ThemedText style={styles.name}>{item.name}</ThemedText>
                    <ThemedText style={styles.timestamp}>{item.timestamp}</ThemedText>
                </View>

                <View style={styles.messageRow}>
                    <ThemedText
                        style={[
                            styles.message,
                            item.unread > 0 && styles.unreadMessage
                        ]}
                        numberOfLines={1}
                    >
                        {item.message}
                    </ThemedText>
                    {item.unread > 0 && (
                        <View style={[styles.unreadBadge, { backgroundColor: tintColor }]}>
                            <ThemedText style={styles.unreadText}>{item.unread}</ThemedText>
                        </View>
                    )}
                </View>
            </View>

            <TouchableOpacity
                style={styles.callButton}
                onPress={() => handleCall(item.phone)}
            >
                <Ionicons name="call-outline" size={20} color={tintColor} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <ThemedView style={[styles.container, { backgroundColor }]}>
            <StatusBar barStyle={backgroundColor === '#151718' ? 'light-content' : 'dark-content'} />
            <SafeAreaView edges={['top']} style={styles.safeArea}>

                {/* Header */}
                <View style={styles.header}>
                    <ThemedText style={styles.headerTitle}>Messages</ThemedText>
                    <TouchableOpacity>
                        <Ionicons name="chatbubbles-outline" size={24} color={tintColor} />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={[styles.searchContainer, { backgroundColor: '#f3f4f6' }]}>
                    <Ionicons name="search-outline" size={20} color="#9ca3af" />
                    <TextInput
                        style={[styles.searchInput, { color: textColor }]}
                        placeholder="Search messages..."
                        placeholderTextColor="#9ca3af"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Chat List */}
                <FlatList
                    data={filteredChats}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <ThemedText style={styles.emptyText}>No messages found</ThemedText>
                        </View>
                    }
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 20,
        paddingHorizontal: 16,
        height: 48,
        borderRadius: 16,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontFamily: 'Gilroy-Medium',
        fontSize: 16,
    },
    listContent: {
        paddingBottom: 40,
    },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: 16,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#ffffff',
        fontFamily: 'Gilroy-Bold',
        fontSize: 16,
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#22c55e',
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    contentContainer: {
        flex: 1,
        marginRight: 12,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    name: {
        fontSize: 16,
        fontFamily: 'Gilroy-SemiBold',
    },
    timestamp: {
        fontSize: 12,
        color: '#9ca3af',
        fontFamily: 'Gilroy-Regular',
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    message: {
        fontSize: 14,
        color: '#6b7280',
        fontFamily: 'Gilroy-Regular',
        flex: 1,
        marginRight: 8,
    },
    unreadMessage: {
        color: '#1f2937',
        fontFamily: 'Gilroy-SemiBold',
    },
    unreadBadge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 5,
    },
    unreadText: {
        color: '#ffffff',
        fontSize: 10,
        fontFamily: 'Gilroy-Bold',
    },
    callButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyText: {
        color: '#9ca3af',
        fontFamily: 'Gilroy-Medium',
    },
});
