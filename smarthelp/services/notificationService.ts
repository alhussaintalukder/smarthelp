/**
 * Push notification service using expo-notifications.
 *
 * Handles:
 * - FCM token registration
 * - Incoming call notifications
 * - Notification listeners
 *
 * NOTE for production:
 * - FCM data-only messages should be sent from a server (Cloud Function)
 *   not from the client device. For development, we use Firebase RTDB
 *   listeners as the primary mechanism for incoming calls when the app
 *   is in the foreground.
 * - For background/killed state, a Cloud Function should trigger an FCM
 *   push when a call record is written to /calls/{channelId}.
 */

import * as Notifications from 'expo-notifications';

import { ref, update } from 'firebase/database';

import { getFirebaseDatabase } from './firebase';
import { DB_PATHS } from '@/constants/firebase';

/**
 * Configure notification handler — show notifications in foreground.
 */
export function configureNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Request notification permissions and get Expo push token / FCM token.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Request permissions
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permission not granted');
      return null;
    }

    // Get the Expo push token (uses FCM under the hood on Android)
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '27dd8b70-5874-4fee-aba3-ebd823f51aa5',
    });

    return tokenData.data;
  } catch (error) {
    console.error('Failed to register for push notifications:', error);
    return null;
  }
}

/**
 * Save FCM/Expo push token to the user's RTDB record.
 */
export async function saveFcmToken(
  userId: string,
  token: string
): Promise<void> {
  const db = getFirebaseDatabase();
  await update(ref(db, `${DB_PATHS.USERS}/${userId}`), {
    fcmToken: token,
  });
}

/**
 * Add a listener for notifications received while the app is in the foreground.
 * Returns a subscription that should be removed on cleanup.
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add a listener for when a user taps on a notification.
 * Returns a subscription that should be removed on cleanup.
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Send a local notification (used for incoming call alerts in foreground).
 */
export async function showIncomingCallNotification(
  callerName: string,
  channelId: string
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Incoming Video Call',
      body: `${callerName} is calling you...`,
      data: {
        type: 'incoming_call',
        channelId,
        callerName,
      },
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: null, // Show immediately
  });
}
