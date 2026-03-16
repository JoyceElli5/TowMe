import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
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

export default function UserMessagesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cardBg = useThemeColor({ light: '#ffffff', dark: '#1F2937' }, 'background');
  const inputBg = useThemeColor({ light: '#F3F4F6', dark: '#374151' }, 'background');
  const tintColor = useThemeColor({}, 'tint');

  const unsubscribeRef = useRef<(() => void) | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    const data = await getConversations();
    // Sort by latest message
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

  // Reload when tab comes into focus (e.g. after returning from chat)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Live-update by reloading summaries when any message arrives via socket
  useEffect(() => {
    let active = true;
    subscribeToAnyMessage(() => {
      if (!active) return;
      load(true);
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
    // Clear the local unread badge immediately for snappiness
    setConversations((prev) =>
      prev.map((c) =>
        c.requestId === item.requestId ? { ...c, unreadCount: 0 } : c
      )
    );
    router.push({
      pathname: '/screens/user/chat-screen',
      params: {
        requestId: item.requestId,
        operatorName: item.otherUserName,
        operatorPhone: item.otherUserPhone ?? '',
      },
    });
  };

  const filtered = conversations.filter((c) =>
    c.otherUserName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderItem = ({ item }: { item: ConversationSummary }) => (
    <TouchableOpacity
      style={[styles.chatItem, { backgroundColor: cardBg }]}
      onPress={() => handleChatPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, { backgroundColor: tintColor + '20' }]}>
        <ThemedText style={[styles.avatarText, { color: tintColor }]}>
          {item.otherUserName.charAt(0).toUpperCase()}
        </ThemedText>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <ThemedText style={[styles.name, item.unreadCount > 0 && styles.bold]}>
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
              <ThemedText style={styles.unreadCount}>
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="default" />
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>Messages</ThemedText>
        <ThemedText style={styles.subtitle}>Your conversations</ThemedText>
      </ThemedView>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: inputBg }]}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Search chats..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item.requestId}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#9CA3AF" />
            <ThemedText style={styles.emptyText}>
              {isLoading ? 'Loading conversations...' : 'No conversations yet'}
            </ThemedText>
            {!isLoading && (
              <ThemedText style={styles.emptySubtext}>
                Once an operator accepts your request, you can chat with them here.
              </ThemedText>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  title: { fontFamily: Fonts.semiBold },
  subtitle: { fontSize: 14, opacity: 0.6, marginTop: 2 },
  searchContainer: { paddingHorizontal: 20, marginBottom: 15 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 16, height: '100%' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontFamily: Fonts.semiBold },
  contentContainer: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: { fontSize: 16, fontFamily: Fonts.semiBold },
  bold: { fontFamily: Fonts.bold ?? Fonts.semiBold },
  timestamp: { fontSize: 12, opacity: 0.5 },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  message: { flex: 1, fontSize: 14, opacity: 0.6, marginRight: 8 },
  unreadMessage: { opacity: 1, fontFamily: Fonts.semiBold },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: { color: '#FFFFFF', fontSize: 10, fontFamily: Fonts.semiBold },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { fontSize: 18, fontFamily: Fonts.semiBold, marginTop: 16 },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.5,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
});
