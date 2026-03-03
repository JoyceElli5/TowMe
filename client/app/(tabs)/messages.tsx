import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useRequests } from '@/hooks/use-requests';
import { useThemeColor } from '@/hooks/use-theme-color';
import { TowingRequest } from '@/lib/api';
import { getMessagesByRequest, type Message } from '@/lib/services/chatService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Linking,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ChatItem {
  id: string;
  requestId: string;
  operatorName: string;
  timestamp: string;
  phone: string;
  lastMessage?: string;
}

export default function UserMessagesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const cardBg = useThemeColor({}, 'background');
  const inputBg = useThemeColor({ light: '#F3F4F6', dark: '#374151' }, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const { activeRequests, pastRequests, isLoading } = useRequests('user');
  const [lastMessages, setLastMessages] = useState<Record<string, Message | null>>({});

  // Load the last message for each conversation (active + past requests)
  useEffect(() => {
    const loadLastMessages = async () => {
      const all: TowingRequest[] = [...activeRequests, ...pastRequests];
      const ids = Array.from(new Set(all.map((req) => req.id)));

      const results: Record<string, Message | null> = {};

      await Promise.all(
        ids.map(async (id) => {
          const messages = await getMessagesByRequest(id);
          if (messages.length > 0) {
            const last = messages[messages.length - 1];
            results[id] = last;
          } else {
            results[id] = null;
          }
        }),
      );

      setLastMessages(results);
    };

    if (!isLoading) {
      loadLastMessages().catch((err) => {
        if (__DEV__) {
          console.warn('Failed to load last messages for conversations:', err);
        }
      });
    }
  }, [activeRequests, pastRequests, isLoading]);

  const conversations: ChatItem[] = useMemo(() => {
    const all: TowingRequest[] = [...activeRequests, ...pastRequests];
    return all
      .filter((req) => !!req.operatorId && !!req.operator)
      .map((req) => {
        const last = lastMessages[req.id] || null;
        const tsSource = last?.createdAt || req.completedAt || req.acceptedAt || req.createdAt;
        return {
          id: req.id,
          requestId: req.id,
          operatorName: req.operator?.fullName || 'Operator',
          timestamp: new Date(tsSource).toLocaleString(),
          phone: req.operator?.phone || '',
          lastMessage: last?.content,
        };
      });
  }, [activeRequests, pastRequests, lastMessages]);

  const filteredChats = conversations.filter(chat =>
    chat.operatorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleChatPress = (chat: ChatItem) => {
    router.push({
      pathname: '/screens/user/chat-screen',
      params: {
        requestId: chat.requestId,
        operatorName: chat.operatorName,
        operatorPhone: chat.phone
      }
    });
  };

  const renderItem = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity
      style={[styles.chatItem, { backgroundColor: cardBg }]}
      onPress={() => handleChatPress(item)}
    >
      <View style={[styles.avatar, { backgroundColor: tintColor + '20' }]}>
        <ThemedText style={[styles.avatarText, { color: tintColor }]}>
          {item.operatorName.charAt(0)}
        </ThemedText>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <ThemedText style={styles.name}>{item.operatorName}</ThemedText>
          <ThemedText style={styles.timestamp}>{item.timestamp}</ThemedText>
        </View>
        <View style={styles.messageRow}>
          <ThemedText
            style={styles.message}
            numberOfLines={1}
          >
            {item.lastMessage || 'Tap to open chat'}
          </ThemedText>
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="default" />
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>Messages</ThemedText>
        <ThemedText style={styles.subtitle}>Recent chats with operators</ThemedText>
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
        data={filteredChats}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#9CA3AF" />
            <ThemedText style={styles.emptyText}>
              {isLoading ? 'Loading conversations...' : 'No conversations yet'}
            </ThemedText>
            {!isLoading && (
              <ThemedText style={styles.emptySubtext}>
                When you start a request, you'll be able to chat with your operator here.
              </ThemedText>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  title: {
    fontFamily: Fonts.semiBold,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
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
  avatarText: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.5,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  message: {
    flex: 1,
    fontSize: 14,
    opacity: 0.6,
    marginRight: 8,
  },
  unreadMessage: {
    opacity: 1,
    fontFamily: Fonts.medium,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: Fonts.semiBold,
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.5,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
});
