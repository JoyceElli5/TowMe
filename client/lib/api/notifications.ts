/**
 * Notifications API
 */

import apiClient from './client';

// Types
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  total: number;
  unreadCount: number;
}

/**
 * Get notifications for the current user
 */
export async function getNotifications(
  page: number = 1,
  limit: number = 30,
  unreadOnly: boolean = false
): Promise<NotificationsResponse> {
  try {
    const response = await apiClient.get<NotificationsResponse>('/notifications', {
      page,
      limit,
      unreadOnly: unreadOnly ? 'true' : undefined,
    });

    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to fetch notifications');
  } catch {
    if (__DEV__) {
      console.log('⚠️ Notifications API unavailable, returning empty list');
    }
    // Return empty result so the screen shows "no notifications" instead of crashing
    return { notifications: [], total: 0, unreadCount: 0 };
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    await apiClient.patch(`/notifications/${notificationId}/read`);
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to mark notification as read:', error);
    }
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  try {
    await apiClient.patch('/notifications/read-all');
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to mark all notifications as read:', error);
    }
  }
}
