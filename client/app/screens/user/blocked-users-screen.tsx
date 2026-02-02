/**
 * Blocked Users Screen
 * 
 * Manage blocked users
 */

import { router } from 'expo-router';
import { ArrowLeft01Icon, UserBlock01Icon } from 'hugeicons-react-native';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useToast } from '@/hooks/use-toast';

interface BlockedUser {
  id: string;
  name: string;
  blockedAt: string;
}

export default function BlockedUsersScreen() {
  const { showToast } = useToast();
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'background');
  const iconColor = useThemeColor({}, 'icon');

  // Mock blocked users - in real app, fetch from API
  const [blockedUsers] = React.useState<BlockedUser[]>([
    {
      id: '1',
      name: 'John Doe',
      blockedAt: '2024-01-15',
    },
    {
      id: '2',
      name: 'Jane Smith',
      blockedAt: '2024-01-10',
    },
  ]);

  const handleUnblock = (userId: string, userName: string) => {
    showToast(`${userName} has been unblocked`, 'success');
    // In real app, call API to unblock user
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft01Icon size={24} color={iconColor} strokeWidth={2} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Blocked Users</ThemedText>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.intro}>
          Users you've blocked won't be able to contact you or see your profile
        </ThemedText>

        {blockedUsers.length === 0 ? (
          <ThemedView style={styles.emptyContainer}>
            <UserBlock01Icon size={64} color={iconColor} strokeWidth={1.5} opacity={0.3} />
            <ThemedText style={styles.emptyText}>No blocked users</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Users you block will appear here
            </ThemedText>
          </ThemedView>
        ) : (
          blockedUsers.map((user) => (
            <ThemedView
              key={user.id}
              style={[styles.userCard, { borderColor }]}
            >
              <View style={styles.userContent}>
                <View style={styles.avatar}>
                  <ThemedText style={styles.avatarText}>
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </ThemedText>
                </View>
                <View style={styles.userInfo}>
                  <ThemedText style={styles.userName}>{user.name}</ThemedText>
                  <ThemedText style={styles.blockedDate}>
                    Blocked on {new Date(user.blockedAt).toLocaleDateString()}
                  </ThemedText>
                </View>
              </View>
              <TouchableOpacity
                style={styles.unblockButton}
                onPress={() => handleUnblock(user.id, user.name)}
              >
                <ThemedText style={styles.unblockText}>Unblock</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  intro: {
    fontSize: 16,
    marginBottom: 24,
    opacity: 0.7,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
  userCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  blockedDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  unblockButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  unblockText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});

