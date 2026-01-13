/**
 * Messages Screen
 *
 * Shows chat and notifications with:
 * - List of notifications
 * - Mark as read functionality
 * - Clear all option
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
  return (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !notification.read && styles.notificationCardUnread,
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: `${notification.iconColor}15` },
        ]}
      >
        <Ionicons
          name={notification.icon as keyof typeof Ionicons.glyphMap}
          size={24}
          color={notification.iconColor}
        />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.notificationTitle,
              !notification.read && styles.notificationTitleUnread,
            ]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          {!notification.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {notification.message}
        </Text>
        <Text style={styles.notificationTime}>{notification.time}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function MessagesScreen() {
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.subtitle}>
              {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="checkmark-done-outline" size={20} color="#3B82F6" />
          <Text style={styles.actionButtonText}>Mark all as read</Text>
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
    backgroundColor: '#F9FAFB',
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
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
    fontWeight: '500',
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F0F9FF',
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
    fontWeight: '500',
    color: '#374151',
  },
  notificationTitleUnread: {
    fontWeight: '600',
    color: '#111827',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
