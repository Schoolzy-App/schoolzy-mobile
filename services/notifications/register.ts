import * as SecureStore from "expo-secure-store";

import { notificationsApi } from "@/services/api";
import { generateId } from "@/utils/id";
import { ApiError } from "@/types/api";
import { createLogger, truncate } from "@/utils/logger";

import {
  currentDeviceName,
  currentDeviceType,
  deleteFcmToken,
  getFcmToken,
} from "./messaging";

const log = createLogger("push:register");

const KEY_DEVICE_ID = "push_device_id";
const KEY_LAST_TOKEN = "push_last_token";

/**
 * Device registration lifecycle.
 *
 * Every function here is intentionally non-throwing: the notifications
 * endpoints are not deployed yet (404 on dev), and a push-registration failure
 * must never prevent a parent from signing in or out.
 */

/** Stable per-install id, generated once and reused. */
async function getDeviceId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(KEY_DEVICE_ID);
  if (existing) return existing;

  const id = generateId();
  await SecureStore.setItemAsync(KEY_DEVICE_ID, id);
  return id;
}

/** The token most recently sent to the backend, if any. */
async function getLastRegisteredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY_LAST_TOKEN);
}

async function setLastRegisteredToken(token: string | null): Promise<void> {
  if (!token) {
    await SecureStore.deleteItemAsync(KEY_LAST_TOKEN);
    return;
  }
  await SecureStore.setItemAsync(KEY_LAST_TOKEN, token);
}

/**
 * Sends a token to the backend. Used both for the initial registration after
 * login and for Firebase's token-refresh callback — the contract is the same
 * POST in both cases.
 */
export async function registerDeviceToken(token: string): Promise<boolean> {
  const payload = {
    deviceToken: token,
    deviceType: currentDeviceType(),
    deviceId: await getDeviceId(),
    deviceName: currentDeviceName(),
  };

  log.info("registering device", {
    ...payload,
    deviceToken: truncate(token),
  });

  try {
    const response = await notificationsApi.registerDevice(payload);
    await setLastRegisteredToken(token);
    log.info("device registered ✓", response);
    return true;
  } catch (e) {
    // Endpoint missing or offline — the next login/refresh retries.
    const status = e instanceof ApiError ? e.status : undefined;
    log.error("device registration failed ✕", {
      status,
      message: (e as Error)?.message,
      hint:
        status === 404
          ? "POST /api/mobile/notifications/devices is not deployed yet"
          : undefined,
    });
    return false;
  }
}

/**
 * Called after a successful login: resolves the current FCM token (requesting
 * notification permission if needed) and registers it.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  log.info("starting push registration");

  const token = await getFcmToken();
  if (!token) {
    log.warn("push registration aborted: no FCM token available");
    return null;
  }

  await registerDeviceToken(token);
  return token;
}

/**
 * Called on logout: unregisters the device so the school stops pushing to it,
 * then drops the local token.
 *
 * Uses the last token we actually registered, falling back to the live one —
 * the two can differ if a refresh failed to reach the backend.
 */
export async function unregisterForPushNotifications(): Promise<void> {
  const token = (await getLastRegisteredToken()) ?? (await getFcmToken());

  if (!token) {
    log.warn("nothing to unregister: no known device token");
  } else {
    log.info(`unregistering device ${truncate(token)}`);
    try {
      const response = await notificationsApi.unregisterDevice(token);
      log.info("device unregistered ✓", response);
    } catch (e) {
      // Best effort — the session is ending regardless.
      const status = e instanceof ApiError ? e.status : undefined;
      log.error("device unregistration failed ✕", {
        status,
        message: (e as Error)?.message,
        hint:
          status === 404
            ? "DELETE /api/mobile/notifications/devices is not deployed yet"
            : undefined,
      });
    }
  }

  await setLastRegisteredToken(null);
  // Invalidate the token itself so the next account gets a fresh one.
  await deleteFcmToken();
}
