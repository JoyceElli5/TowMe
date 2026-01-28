/**
 * Notification Service
 * Handles notification CRUD operations
 */

import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Get all notifications for current user
 */
export async function getUserNotifications(): Promise<Notification[]> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) {
    throw new Error('No authenticated user');
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<number> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) {
    return 0;
  }

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    throw error;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) {
    throw new Error('No authenticated user');
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    throw error;
  }
}
