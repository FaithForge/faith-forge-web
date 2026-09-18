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
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    if (subscription) {
      const currentRawKey = subscription.options?.applicationServerKey;
      if (currentRawKey) {
        const currentBytes = new Uint8Array(currentRawKey);
        const keysMatch =
          currentBytes.length === applicationServerKey.length &&
          currentBytes.every((b, idx) => b === applicationServerKey[idx]);

        if (!keysMatch) {
          await subscription.unsubscribe();
          subscription = null;
        }
      }
    }

    if (!subscription) {
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

/**
 * Unregisters the push subscription from the backend and unsubscribes the device from PushManager.
 *
 * @returns {Promise<boolean>}
 */
export const unregisterAndRemovePushSubscription = async (): Promise<boolean> => {
  try {
    const subscription = await getExistingPushSubscription();
    if (subscription?.endpoint) {
      const { store } = await import('@/libs/state/redux/store');
      const { userApi } = await import('@/libs/state/redux/api/userApi');

      const unregisterPromise = store.dispatch(
        userApi.endpoints.unsubscribePushNotification.initiate({
          endpoint: subscription.endpoint,
        })
      );
      await unregisterPromise.unwrap().catch(() => {});
      unregisterPromise.unsubscribe();
    }

    if (subscription) {
      await subscription.unsubscribe();
    }

    return true;
  } catch (err) {
    console.warn('Failed to unregister push subscription:', err);
    return false;
  }
};

/**
 * Requests push notification permission from the user and, if granted and an authenticated session exists,
 * subscribes the device via Web Push and registers the subscription in the backend.
 *
 * @param {string} [authToken] - Optional token to use instead of reading from store state.
 * @returns {Promise<boolean>} True if notifications are permitted and registered with the server.
 */
export const requestAndSyncPushSubscription = async (
  authToken?: string
): Promise<boolean> => {
  if (!isPushNotificationSupported()) return false;

  try {
    const permission = await requestPushPermission();
    if (permission !== 'granted') {
      return false;
    }

    // Delay checking store slightly if token is not passed, in case Redux persist is hydrating
    const { store } = await import('@/libs/state/redux/store');
    const { userApi } = await import('@/libs/state/redux/api/userApi');

    const token = authToken || store.getState().authSlice?.token;
    if (!token) {
      return true;
    }

    // Retrieve VAPID public key
    const vapidPromise = store.dispatch(
      userApi.endpoints.getVapidPublicKey.initiate(token ? { token } : undefined)
    );
    const vapidResult = await vapidPromise.unwrap();
    vapidPromise.unsubscribe();

    if (!vapidResult?.publicKey) {
      return false;
    }

    // Subscribe to browser PushManager
    const subscription = await subscribeToPushNotifications(vapidResult.publicKey);
    if (!subscription) {
      return false;
    }

    // Register with backend User microservice
    const subPromise = store.dispatch(
      userApi.endpoints.subscribePushNotification.initiate({
        subscription: subscription.toJSON(),
        token,
      })
    );
    await subPromise.unwrap();
    subPromise.unsubscribe();

    return true;
  } catch (err) {
    console.warn('Auto push subscription registration failed:', err);
    return false;
  }
};

