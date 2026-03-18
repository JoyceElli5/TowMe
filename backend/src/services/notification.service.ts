/**
 * Notification Service
 * Handles push notifications and in-app notifications
 */

import * as admin from 'firebase-admin';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseAdmin } from '../config/database';
import { createError } from '../middleware/error.middleware';
import type { Notification, NotificationType } from '../types/database.types';
import logger from '../utils/logger';

// ── Firebase Admin SDK ──────────────────────────────────────────────────────
const serviceAccountPath = path.resolve(__dirname, '../../firebase-service-account.json');

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });
    logger.info('Firebase Admin SDK initialised');
  } catch (err) {
    logger.warn('Firebase Admin SDK failed to initialise:', err);
  }
}

/**
 * Send a push notification via Expo's push API (for ExponentPushToken[...] tokens).
 */
async function sendExpoPush(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ to: pushToken, title, body, data: data ?? {}, sound: 'default', priority: 'high' }),
  });
  const result = await response.json() as { data?: { status: string; message?: string } };
  if (result.data?.status === 'error') {
    logger.warn('[Expo Push] Error:', result.data.message);
  }
}

/**
 * Send a push notification to a single device token.
 * Supports both Expo push tokens and native FCM tokens.
 * Silently skips if token is missing.
 */
export async function sendFcmPush(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  if (!pushToken) return;

  try {
    if (pushToken.startsWith('ExponentPushToken[')) {
      // Expo push token — use Expo's push API
      await sendExpoPush(pushToken, title, body, data);
    } else if (admin.apps.length) {
      // Native FCM token — use Firebase Admin SDK
      await admin.messaging().send({
        token: pushToken,
        notification: { title, body },
        data: data ?? {},
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default' } } },
      });
    }
  } catch (err) {
    // Non-fatal — log and continue
    logger.warn('[Push] Failed to send push:', err);
  }
}

/**
 * Lookup a user's push token from the database.
 */
async function getUserPushToken(userId: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('users')
    .select('push_token')
    .eq('id', userId)
    .single();
  return data?.push_token ?? null;
}

/**
 * Create an in-app notification AND send an FCM push in one call.
 */
export async function notifyUser(
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
  metadata?: Record<string, unknown>
): Promise<void> {
  // Fire both concurrently; DB notification is the source of truth
  const [pushToken] = await Promise.all([
    getUserPushToken(userId),
    createNotification(userId, title, message, type, metadata),
  ]);

  if (pushToken) {
    const stringMeta: Record<string, string> = {};
    if (metadata) {
      for (const [k, v] of Object.entries(metadata)) {
        stringMeta[k] = String(v);
      }
    }
    await sendFcmPush(pushToken, title, message, stringMeta);
  }
}

/**
 * Create a notification
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
  metadata?: Record<string, unknown>
): Promise<Notification> {
  const supabase = getSupabaseAdmin();

  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      id: uuidv4(),
      user_id: userId,
      title,
      message,
      type,
      is_read: false,
      metadata: metadata || null,
    })
    .select()
    .single();

  if (error) {
    logger.error('Error creating notification:', error);
    throw createError.internal('Failed to create notification');
  }

  return notification;
}

/**
 * Get user notifications
 */
export async function getUserNotifications(
  userId: string,
  page: number = 1,
  limit: number = 20,
  unreadOnly: boolean = false
): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
  const supabase = getSupabaseAdmin();
  const offset = (page - 1) * limit;

  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data: notifications, error, count } = await query;

  if (error) {
    logger.error('Error fetching notifications:', error);
    throw createError.internal('Failed to fetch notifications');
  }

  // Get unread count
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  return {
    notifications: notifications || [],
    total: count || 0,
    unreadCount: unreadCount || 0,
  };
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string, userId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) {
    logger.error('Error marking notification as read:', error);
    throw createError.internal('Failed to update notification');
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    logger.error('Error marking all notifications as read:', error);
    throw createError.internal('Failed to update notifications');
  }
}

// Notification templates for common events
export const notificationTemplates = {
  requestAccepted: (operatorName: string) => ({
    title: 'Request Accepted! 🚛',
    message: `${operatorName} has accepted your towing request and is on the way.`,
    type: 'status_update' as NotificationType,
  }),

  operatorArrived: (operatorName: string) => ({
    title: 'Operator Arrived 📍',
    message: `${operatorName} has arrived at your location.`,
    type: 'status_update' as NotificationType,
  }),

  tripStarted: () => ({
    title: 'Trip Started 🚗',
    message: 'Your vehicle is now being towed to the destination.',
    type: 'status_update' as NotificationType,
  }),

  tripCompleted: (amount: number) => ({
    title: 'Trip Completed! ✅',
    message: `Your trip has been completed. Total: GH₵${amount.toFixed(2)}`,
    type: 'status_update' as NotificationType,
  }),

  newRequest: (vehicleType: string, distance: number) => ({
    title: 'New Request! 🔔',
    message: `New ${vehicleType} towing request, ${distance}km away.`,
    type: 'request' as NotificationType,
  }),

  newRating: (rating: number) => ({
    title: 'New Rating ⭐',
    message: `You received a ${rating}-star rating!`,
    type: 'rating' as NotificationType,
  }),

  paymentReceived: (amount: number) => ({
    title: 'Payment Received 💰',
    message: `You received GH₵${amount.toFixed(2)} for your trip.`,
    type: 'payment' as NotificationType,
  }),
};
