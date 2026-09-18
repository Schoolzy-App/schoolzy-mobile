import {
  AuthorizationStatus,
  deleteToken,
  getInitialNotification as fbGetInitialNotification,
  onTokenRefresh as fbOnTokenRefresh,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  requestPermission,
  setBackgroundMessageHandler,
} from "@react-native-firebase/messaging";
import * as Device from "expo-device";
import { Platform } from "react-native";

import { DeviceType, type PushMessage } from "@/types/api";
import { createLogger, truncate } from "@/utils/logger";

/**
 * Thin wrapper over `@react-native-firebase/messaging` (v26 modular API).
 *
 * Everything here is best-effort: Firebase is unavailable in Expo Go and on
 * simulators without push support, so each call is guarded rather than allowed
 * to throw into the auth flow.
 */

/** Loosely typed to avoid leaking the SDK's internal types across the app. */
type RemoteMessage = {
  notification?: { title?: string; body?: string } | null;
  data?: Record<string, unknown> | null;
};

const log = createLogger("push");

const noop = () => { };

/** 1 = Android, 2 = iOS, per the backend's `deviceType` contract. */
export const currentDeviceType = (): DeviceType =>
  Platform.OS === "ios" ? DeviceType.iOS : DeviceType.Android;

/** e.g. "iPhone 15 Pro" — sent as `deviceName` when available. */
export const currentDeviceName = (): string | undefined =>
  Device.modelName ?? undefined;

/**
 * Asks the OS for notification permission.
 * Android 13+ and iOS both require an explicit grant; older Android is
 * granted implicitly.
 */
export async function requestPushPermission(): Promise<boolean> {
  try {
    const status = await requestPermission(getMessaging());
    const granted =
      status === AuthorizationStatus.AUTHORIZED ||
      status === AuthorizationStatus.PROVISIONAL;

    log.info(`permission status=${status} granted=${granted}`);
    return granted;
  } catch (e) {
    log.error("permission request failed (Firebase unavailable?)", {
      message: (e as Error)?.message,
    });
    return false;
  }
}

/**
 * Current FCM registration token, or null when unavailable (permission denied,
 * no Google Play services, Expo Go, simulator without push support).
 *
 * On iOS the APNs token must arrive before FCM issues one; the SDK handles
 * that handshake as long as the app carries the push entitlement.
 */
export async function getFcmToken(): Promise<string | null> {
  try {
    const granted = await requestPushPermission();
    if (!granted) {
      log.warn("no FCM token: notification permission denied");
      return null;
    }

    const token = await getToken(getMessaging());
    if (!token) {
      log.warn("no FCM token: Firebase returned an empty token");
      return null;
    }

    log.info(`FCM token acquired: ${token}`);
    return token;
  } catch (e) {
    log.error("getToken failed", {
      message: (e as Error)?.message,
      hint: "Firebase not configured for this package, or running in Expo Go",
    });
    return null;
  }
}

/** Invalidates the current token — used when unregistering on logout. */
export async function deleteFcmToken(): Promise<void> {
  try {
    await deleteToken(getMessaging());
    log.info("FCM token deleted");
  } catch (e) {
    log.warn("deleteToken failed (nothing to delete?)", {
      message: (e as Error)?.message,
    });
  }
}

/**
 * Fires whenever Firebase rotates the token. The backend contract says to
 * re-POST the registration endpoint with the new value.
 */
export function onTokenRefresh(handler: (token: string) => void): () => void {
  try {
    return fbOnTokenRefresh(getMessaging(), (token: string) => {
      log.info(`FCM token refreshed: ${truncate(token)}`);
      handler(token);
    });
  } catch (e) {
    log.error("onTokenRefresh subscription failed", {
      message: (e as Error)?.message,
    });
    return noop;
  }
}

/** Normalizes a Firebase message into the app's own shape. */
export function toPushMessage(remote: RemoteMessage): PushMessage {
  const data = (remote.data ?? {}) as Record<string, unknown>;
  return {
    title: remote.notification?.title ?? null,
    body: remote.notification?.body ?? null,
    data: {
      type: data.type != null ? String(data.type) : undefined,
      referenceId:
        data.referenceId != null ? String(data.referenceId) : undefined,
    },
  };
}

/** Message received while the app is in the foreground. */
export function onForegroundMessage(
  handler: (message: PushMessage) => void,
): () => void {
  try {
    return onMessage(getMessaging(), (remote: RemoteMessage) => {
      const message = toPushMessage(remote);
      log.info("message received (foreground)", message);
      handler(message);
    });
  } catch (e) {
    log.error("onMessage subscription failed", {
      message: (e as Error)?.message,
    });
    return noop;
  }
}

/** User tapped a notification that opened the app from the background. */
export function onNotificationOpened(
  handler: (message: PushMessage) => void,
): () => void {
  try {
    return onNotificationOpenedApp(getMessaging(), (remote: RemoteMessage) => {
      const message = toPushMessage(remote);
      log.info("notification tapped (from background)", message);
      handler(message);
    });
  } catch (e) {
    log.error("onNotificationOpenedApp subscription failed", {
      message: (e as Error)?.message,
    });
    return noop;
  }
}

/**
 * The notification that launched the app from a fully quit state, if any.
 * Returns null on a normal cold start.
 */
export async function getInitialNotification(): Promise<PushMessage | null> {
  try {
    const remote = await fbGetInitialNotification(getMessaging());
    if (!remote) return null;

    const message = toPushMessage(remote);
    log.info("app launched from notification (cold start)", message);
    return message;
  } catch (e) {
    log.error("getInitialNotification failed", {
      message: (e as Error)?.message,
    });
    return null;
  }
}

/**
 * Registers the background/quit-state handler. Must be called at module scope
 * (outside any component) so it is set before React mounts — see `index.js`.
 */
export function registerBackgroundHandler(): void {
  try {
    setBackgroundMessageHandler(getMessaging(), async (remote: RemoteMessage) => {
      // The OS renders the notification itself; nothing to do here yet.
      // Data-only messages that need work while backgrounded go here later.
      log.info("message received (background)", toPushMessage(remote));
    });
    log.info("background message handler registered");
  } catch (e) {
    log.error("background handler registration failed", {
      message: (e as Error)?.message,
    });
  }
}
