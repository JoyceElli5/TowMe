/**
 * Operator Messages Screen
 * Lists conversations with clients, with live unread counts and socket-driven updates.
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
    ConversationSummary,
    getConversations,
    subscribeToAnyMessage,
} from '@/lib/services/chatService';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    FlatList,
    Linking,
    RefreshControl,
    StatusBar,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OperatorMessagesScreen() {
    const backgroundColor = useThemeColor({}, 'background');
    const tintColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');
    const cardBg = useThemeColor({ light: '#ffffff', dark: '#1F2937' }, 'background');
    const textColor = useThemeColor({}, 'text');

    const [searchQuery, setSearchQuery] = useState('');
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const unsubscribeRef = useRef<(() => void) | null>(null);

    const load = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        const data = await getConversations();
        data.sort((a, b) => {
            const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return tb - ta;
        });
        setConversations(data);
        if (!silent) setIsLoading(false);
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await load(true);
        setRefreshing(false);
    };

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    useEffect(() => {
        let active = true;
        subscribeToAnyMessage((msg) => {
            if (!active) return;
            setConversations((prev) => {
                const idx = prev.findIndex((c) => c.requestId === msg.requestId);
                if (idx === -1) {
                    load(true);
                    return prev;
                }
                const updated = [...prev];
                updated[idx] = {
                    ...updated[idx],
                    lastMessageContent: msg.content,
                    lastMessageAt: msg.createdAt,
                    lastMessageSenderId: msg.senderId,
                    unreadCount:
                        msg.receiverId === updated[idx].otherUserId
                            ? updated[idx].unreadCount
                            : updated[idx].unreadCount + 1,
                };
                updated.sort((a, b) => {
                    const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
                    const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
                    return tb - ta;
                });
                return updated;
            });
        }).then((unsub) => {
            if (active) unsubscribeRef.current = unsub;
            else unsub();
        });

        return () => {
            active = false;
            unsubscribeRef.current?.();
            unsubscribeRef.current = null;
        };
    }, [load]);

    const handleChatPress = (item: ConversationSummary) => {
        setConversations((prev) =>
            prev.map((c) =>
                c.requestId === item.requestId ? { ...c, unreadCount: 0 } : c
            )
        );
        router.push({
            pathname: '/screens/operator/chat-screen',
            params: { requestId: item.requestId },
        });
    };

    const formatTime = (iso: string | null) => {
        if (!iso) return '';
        const d = new Date(iso);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        return isToday
            ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const filtered = conversations.filter((c) =>
        c.otherUserName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: ConversationSummary }) => (
        <TouchableOpacity
            style={[styles.chatItem, { backgroundColor: cardBg }]}
            onPress={() => handleChatPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.avatarContainer}>
                <View style={[styles.avatarPlaceholder, { backgroundColor: tintColor + '20' }]}>
                    <ThemedText style={[styles.avatarText, { color: tintColor }]}>
                        {item.otherUserName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </ThemedText>
                </View>
            </View>

            <View style={styles.contentContainer}>
                <View style={styles.headerRow}>
                    <ThemedText style={[styles.name, item.unreadCount > 0 && styles.nameBold]}>
                        {item.otherUserName}
                    </ThemedText>
                    <ThemedText style={styles.timestamp}>{formatTime(item.lastMessageAt)}</ThemedText>
                </View>
                <View style={styles.messageRow}>
                    <ThemedText
                        style={[styles.message, item.unreadCount > 0 && styles.unreadMessage]}
                        numberOfLines={1}
                    >
                        {item.lastMessageContent || 'Tap to open chat'}
                    </ThemedText>
                    {item.unreadCount > 0 && (
                        <View style={[styles.unreadBadge, { backgroundColor: tintColor }]}>
                            <ThemedText style={styles.unreadText}>
                                {item.unreadCount > 99 ? '99+' : item.unreadCount}
                            </ThemedText>
                        </View>
                    )}
                </View>
            </View>

            <TouchableOpacity
                style={styles.callButton}
                onPress={() => item.otherUserPhone && Linking.openURL(`tel:${item.otherUserPhone}`)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <Ionicons name="call-outline" size={20} color={tintColor} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <ThemedView style={[styles.container, { backgroundColor }]}>
            <StatusBar barStyle={backgroundColor === '#151718' ? 'light-content' : 'dark-content'} />
            <SafeAreaView edges={['top']} style={styles.safeArea}>

                <View style={styles.header}>
                    <ThemedText style={styles.headerTitle}>Messages</ThemedText>
                    <Ionicons name="chatbubbles-outline" size={24} color={tintColor} />
                </View>

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

                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.requestId}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="chatbubbles-outline" size={48} color="#9ca3af" />
                            <ThemedText style={styles.emptyText}>
                                {isLoading ? 'Loading conversations...' : 'No messages yet'}
                            </ThemedText>
                        </View>
                    }
                />
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
    headerTitle: { fontSize: 24, fontFamily: 'Gilroy-Bold', fontWeight: '700' },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 20,
        paddingHorizontal: 16,
        height: 48,
        borderRadius: 16,
    },
    searchInput: { flex: 1, marginLeft: 10, fontFamily: 'Gilroy-Medium', fontSize: 16 },
    listContent: { paddingBottom: 40 },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    avatarContainer: { position: 'relative', marginRight: 16 },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { fontFamily: 'Gilroy-Bold', fontSize: 16 },
    contentContainer: { flex: 1, marginRight: 12 },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    name: { fontSize: 16, fontFamily: 'Gilroy-SemiBold' },
    nameBold: { fontFamily: 'Gilroy-Bold' },
    timestamp: { fontSize: 12, color: '#9ca3af', fontFamily: 'Gilroy-Regular' },
    messageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    message: { fontSize: 14, color: '#6b7280', fontFamily: 'Gilroy-Regular', flex: 1, marginRight: 8 },
    unreadMessage: { color: '#1f2937', fontFamily: 'Gilroy-SemiBold' },
    unreadBadge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 5,
    },
    unreadText: { color: '#ffffff', fontSize: 10, fontFamily: 'Gilroy-Bold' },
    callButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
    emptyText: { color: '#9ca3af', fontFamily: 'Gilroy-Medium' },
});
