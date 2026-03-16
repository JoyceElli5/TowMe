/**
 * Push Notification Service
 * Handles Firebase Cloud Messaging (FCM) via expo-notifications.
 *
 * Setup required:
 *  Android – add google-services.json to the project root (from Firebase console).
 *  iOS     – add GoogleService-Info.plist and configure APNs in Firebase.
 *
 * In app.json / app.config.js add:
 *   "plugins": ["expo-notifications"],
 *   "android": { "googleServicesFile": "./google-services.json" },
 *   "ios":     { "googleServicesFile": "./GoogleService-Info.plist" }
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import apiClient from '../api/client';

// How notifications behave while the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request permission and return the Expo push token (which wraps the FCM token).
 * Returns null if permission is denied or registration fails.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Check existing permission
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Push] Permission not granted');
      return null;
    }

    // Android requires a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'TowMe Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#003554',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
      });
    }

    // Get Expo push token (this works with FCM internally)
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });

    return tokenData.data;
  } catch (error) {
    console.warn('[Push] Failed to register:', error);
    return null;
  }
}

/**
 * Register the push token with the backend so the server can send targeted notifications.
 */
export async function savePushTokenToBackend(token: string): Promise<void> {
  try {
    await apiClient.patch('/users/push-token', { pushToken: token });
  } catch (error) {
    // Non-fatal: the app works without push notifications
    console.warn('[Push] Failed to save token to backend:', error);
  }
}

/**
 * Full initialisation: request permission, get token, save to backend.
 * Call this once after the user logs in.
 */
export async function initPushNotifications(): Promise<void> {
  const token = await registerForPushNotifications();
  if (token) {
    await savePushTokenToBackend(token);
    if (__DEV__) console.log('[Push] Token registered:', token);
  }
}

/**
 * Add a listener for notifications received while the app is foregrounded.
 * Returns a subscription that should be removed on cleanup.
 */
export function addForegroundNotificationListener(
  handler: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(handler);
}

/**
 * Add a listener for when the user taps a notification.
 * Returns a subscription that should be removed on cleanup.
 */
export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

/**
 * Display a local notification immediately (useful for in-app alerts).
 */
export async function showLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data ?? {},
      sound: 'default',
    },
    trigger: null, // show immediately
  });
}

/** Clear the app's notification badge count */
export async function clearBadgeCount(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}
