import { supabase } from '@/lib/supabase';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    body: string; // Changed message to body to match schema
    is_read: boolean;
    created_at: string;
}

/**
 * Get all notifications for current user
 */
export async function getNotifications(userId: string): Promise<Notification[]> {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        return (data || []) as Notification[];
    } catch (error: any) {
        console.error('Error fetching notifications:', error);
        throw new Error(`Failed to fetch notifications: ${error.message}`);
    }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
    notificationId: string
): Promise<void> {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) {
            throw error;
        }
    } catch (error: any) {
        console.error('Error marking notification as read:', error);
        throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(
    userId: string
): Promise<void> {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) {
            throw error;
        }
    } catch (error: any) {
        console.error('Error marking all notifications as read:', error);
        throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
    try {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) {
            throw error;
        }

        return count || 0;
    } catch (error: any) {
        console.error('Error getting unread count:', error);
        return 0;
    }
}
