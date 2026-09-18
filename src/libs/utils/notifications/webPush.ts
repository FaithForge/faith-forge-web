/**
 * Converts a base64 encoded URL-safe string to a Uint8Array
 * required by the browser's PushManager.subscribe call.
 *
 * @param {string} base64String - Base64 string from VAPID public key.
 * @returns {Uint8Array}
 */
export const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

/**
 * Checks if Push Notifications and Service Workers are supported by the current browser.
 *
 * @returns {boolean}
 */
export const isPushNotificationSupported = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
};

/**
 * Returns current permission state: 'default', 'granted', or 'denied'.
 *
 * @returns {NotificationPermission}
 */
export const getPushPermissionState = (): NotificationPermission => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
};

/**
 * Requests push notification permission from the user.
 *
 * @returns {Promise<NotificationPermission>}
 */
export const requestPushPermission = async (): Promise<NotificationPermission> => {
  if (!isPushNotificationSupported()) return 'denied';
  return await Notification.requestPermission();
};

/**
 * Retrieves the current push subscription from the active Service Worker registration, if any.
 *
 * @returns {Promise<PushSubscription | null>}
 */
export const getExistingPushSubscription = async (): Promise<PushSubscription | null> => {
  if (!isPushNotificationSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
};

/**
 * Subscribes the current device to Web Push using the VAPID public key.
 *
 * @param {string} vapidPublicKey - The VAPID public key provided by the backend.
 * @returns {Promise<PushSubscription | null>}
 */
export const subscribeToPushNotifications = async (
  vapidPublicKey: string
): Promise<PushSubscription | null> => {
  if (!isPushNotificationSupported()) return null;

  const permission = await requestPushPermission();
  if (permission !== 'granted') return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    return subscription;
  } catch (err) {
    console.warn('Failed to subscribe to Web Push:', err);
    return null;
  }
};

/**
 * Unsubscribes the current device from Web Push notifications.
 *
 * @returns {Promise<boolean>}
 */
export const unsubscribeFromPushNotifications = async (): Promise<boolean> => {
  try {
    const subscription = await getExistingPushSubscription();
    if (subscription) {
      return await subscription.unsubscribe();
    }
    return true;
  } catch {
    return false;
  }
};
