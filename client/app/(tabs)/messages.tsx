
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  Location01Icon,
  MessageDone01Icon,
  StarIcon,
  Wallet01Icon
} from 'hugeicons-react-native';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

// Icon mapping for notifications
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  location: Location01Icon,
  wallet: Wallet01Icon,
  'checkmark-circle': CheckmarkCircle01Icon,
  star: StarIcon,
  'alert-circle': AlertCircleIcon,
};

// Mock notifications data
const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    type: 'request',
    title: 'New request nearby!',
    message: 'A user needs towing assistance 2.5 km away',
    time: '2 min ago',
    read: false,
    icon: 'location',
    iconColor: '#3B82F6',
  },
  {
    id: '2',
    type: 'earning',
    title: 'Trip completed - GHS 156 earned',
    message: 'Your earnings have been credited to your wallet',
    time: '1 hour ago',
    read: false,
    icon: 'wallet',
    iconColor: '#10B981',
  },
  {
    id: '3',
    type: 'withdrawal',
    title: 'Withdrawal processed successfully',
    message: 'GHS 500 has been sent to your mobile money account',
    time: '3 hours ago',
    read: true,
    icon: 'checkmark-circle',
    iconColor: '#10B981',
  },
  {
    id: '4',
    type: 'review',
    title: 'User left you a 5-star review!',
    message: '"Great service, very professional!"',
    time: 'Yesterday',
    read: true,
    icon: 'star',
    iconColor: '#F59E0B',
  },
  {
    id: '5',
    type: 'reminder',
    title: 'Reminder: Update your vehicle insurance',
    message: 'Your insurance expires in 7 days',
    time: '2 days ago',
    read: true,
    icon: 'alert-circle',
    iconColor: '#EF4444',
  },
];

function NotificationCard({
  notification,
}: {
  notification: typeof MOCK_NOTIFICATIONS[0];
}) {
  const Icon = ICON_MAP[notification.icon] || Location01Icon;
  const cardBg = useThemeColor({}, 'background');
  const unreadBg = useThemeColor({ light: '#F0F9FF', dark: '#1E3A5F' }, 'background');
  
  return (
    <TouchableOpacity>
      <ThemedView
        style={[
          styles.notificationCard,
          { backgroundColor: !notification.read ? unreadBg : cardBg },
          !notification.read && styles.notificationCardUnread,
        ]}
      >
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${notification.iconColor}15` },
          ]}
        >
          <Icon
            size={24}
            color={notification.iconColor}
            strokeWidth={2}
          />
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <ThemedText
              style={[
                styles.notificationTitle,
                !notification.read && styles.notificationTitleUnread,
              ]}
              numberOfLines={1}
            >
              {notification.title}
            </ThemedText>
            {!notification.read && <View style={styles.unreadDot} />}
          </View>
          <ThemedText style={styles.notificationMessage} numberOfLines={2}>
            {notification.message}
          </ThemedText>
          <ThemedText style={styles.notificationTime}>{notification.time}</ThemedText>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}

export default function MessagesScreen() {
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;
  const backgroundColor = useThemeColor({}, 'background');

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
        <TouchableOpacity style={styles.clearButton}>
          <ThemedText style={styles.clearButtonText}>Clear All</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton}>
          <MessageDone01Icon size={20} color="#3B82F6" strokeWidth={2} />
          <ThemedText style={styles.actionButtonText}>Mark all as read</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.notificationList}
        contentContainerStyle={styles.notificationListContent}
        showsVerticalScrollIndicator={false}
      >
        {MOCK_NOTIFICATIONS.map((notification) => (
          <NotificationCard key={notification.id} notification={notification} />
        ))}
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
