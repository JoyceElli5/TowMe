
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/api';
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead, type Notification } from '@/lib/services/notificationService';
import {
  CheckmarkCircle01Icon,
  Location01Icon,
  MessageDone01Icon,
  StarIcon,
  Wallet01Icon
} from 'hugeicons-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

// Icon mapping for notifications
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  request: Location01Icon,
  payment: Wallet01Icon,
  status_update: CheckmarkCircle01Icon,
  rating: StarIcon,
};

// Get icon color based on notification type
function getIconColor(type: string): string {
  switch (type) {
    case 'request':
      return '#3B82F6';
    case 'payment':
      return '#10B981';
    case 'status_update':
      return '#10B981';
    case 'rating':
      return '#F59E0B';
    default:
      return '#6B7280';
  }
}

// Format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

function NotificationCard({
  notification,
  onPress,
}: {
  notification: Notification;
  onPress: () => void;
}) {
  const Icon = ICON_MAP[notification.type] || Location01Icon;
  const iconColor = getIconColor(notification.type);
  const cardBg = useThemeColor({}, 'background');
  const unreadBg = useThemeColor({ light: '#F0F9FF', dark: '#1E3A5F' }, 'background');
  
  return (
    <TouchableOpacity onPress={onPress}>
      <ThemedView
        style={[
          styles.notificationCard,
          { backgroundColor: !notification.is_read ? unreadBg : cardBg },
          !notification.is_read && styles.notificationCardUnread,
        ]}
      >
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${iconColor}15` },
          ]}
        >
          <Icon
            size={24}
            color={iconColor}
            strokeWidth={2}
          />
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <ThemedText
              style={[
                styles.notificationTitle,
                !notification.is_read && styles.notificationTitleUnread,
              ]}
              numberOfLines={1}
            >
              {notification.title}
            </ThemedText>
            {!notification.is_read && <View style={styles.unreadDot} />}
          </View>
          <ThemedText style={styles.notificationMessage} numberOfLines={2}>
            {notification.message}
          </ThemedText>
          <ThemedText style={styles.notificationTime}>
            {formatTimeAgo(notification.created_at)}
          </ThemedText>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}

export default function MessagesScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  const backgroundColor = useThemeColor({}, 'background');
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadNotifications = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        const userNotifications = await getNotifications(user.id);
        setNotifications(userNotifications);
      }
    } catch (error: any) {
      console.error('Error loading notifications:', error);
      showToast('Failed to load notifications', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.is_read) {
      try {
        await markNotificationAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        await markAllNotificationsAsRead(user.id);
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true }))
        );
        showToast('All notifications marked as read', 'success');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      showToast('Failed to mark all as read', 'error');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <ThemedText type="title" style={styles.title}>Notifications</ThemedText>
          {unreadCount > 0 && (
            <ThemedText style={styles.subtitle}>
              {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
            </ThemedText>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={handleMarkAllAsRead}>
            <ThemedText style={styles.clearButtonText}>Mark all as read</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Actions */}
      {unreadCount > 0 && (
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleMarkAllAsRead}>
            <MessageDone01Icon size={20} color="#3B82F6" strokeWidth={2} />
            <ThemedText style={styles.actionButtonText}>Mark all as read</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Notifications List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>No notifications</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            You&apos;ll see notifications here when you have updates
          </ThemedText>
        </View>
      ) : (
        <ScrollView
          style={styles.notificationList}
          contentContainerStyle={styles.notificationListContent}
          showsVerticalScrollIndicator={false}
        >
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onPress={() => handleNotificationPress(notification)}
            />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontFamily: Fonts.semiBold,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clearButtonText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: '#EF4444',
  },
  quickActions: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: '#3B82F6',
  },
  notificationList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
  notificationListContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  notificationCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  notificationCardUnread: {
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.medium,
  },
  notificationTitleUnread: {
    fontFamily: Fonts.semiBold,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    marginBottom: 6,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
});
