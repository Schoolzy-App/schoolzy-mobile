import * as SecureStore from "expo-secure-store";

import type { AuthTokens, AuthUser } from "@/types/api";

const KEY_ACCESS_TOKEN = "auth_access_token";
const KEY_REFRESH_TOKEN = "auth_refresh_token";
const KEY_EXPIRES_AT = "auth_expires_at";
const KEY_USER = "auth_user";

/**
 * Tokens are read on every request, so they are also mirrored in memory to
 * avoid hitting the keychain on each call. SecureStore stays the source of
 * truth across app launches.
 */
let cachedTokens: AuthTokens | null = null;

export const tokenStorage = {
  /** Synchronous read of the in-memory mirror — used by the request interceptor. */
  getCached(): AuthTokens | null {
    return cachedTokens;
  },

  /** Load tokens from the keychain and refresh the in-memory mirror. */
  async load(): Promise<AuthTokens | null> {
    const [accessToken, refreshToken, expiresAt] = await Promise.all([
      SecureStore.getItemAsync(KEY_ACCESS_TOKEN),
      SecureStore.getItemAsync(KEY_REFRESH_TOKEN),
      SecureStore.getItemAsync(KEY_EXPIRES_AT),
    ]);

    if (!accessToken) {
      cachedTokens = null;
      return null;
    }

    cachedTokens = {
      accessToken,
      refreshToken,
      expiresAt: expiresAt ? Number(expiresAt) : null,
    };
    return cachedTokens;
  },

  async save(tokens: AuthTokens): Promise<void> {
    cachedTokens = tokens;
    await Promise.all([
      SecureStore.setItemAsync(KEY_ACCESS_TOKEN, tokens.accessToken),
      tokens.refreshToken
        ? SecureStore.setItemAsync(KEY_REFRESH_TOKEN, tokens.refreshToken)
        : SecureStore.deleteItemAsync(KEY_REFRESH_TOKEN),
      tokens.expiresAt != null
        ? SecureStore.setItemAsync(KEY_EXPIRES_AT, String(tokens.expiresAt))
        : SecureStore.deleteItemAsync(KEY_EXPIRES_AT),
    ]);
  },

  async clear(): Promise<void> {
    cachedTokens = null;
    await Promise.all([
      SecureStore.deleteItemAsync(KEY_ACCESS_TOKEN),
      SecureStore.deleteItemAsync(KEY_REFRESH_TOKEN),
      SecureStore.deleteItemAsync(KEY_EXPIRES_AT),
      SecureStore.deleteItemAsync(KEY_USER),
    ]);
  },

  async saveUser(user: AuthUser | null): Promise<void> {
    if (!user) {
      await SecureStore.deleteItemAsync(KEY_USER);
      return;
    }
    await SecureStore.setItemAsync(KEY_USER, JSON.stringify(user));
  },

  async loadUser(): Promise<AuthUser | null> {
    const raw = await SecureStore.getItemAsync(KEY_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },
};
