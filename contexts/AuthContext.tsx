import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { queryClient } from "@/providers/QueryProvider";
import { authApi, setUnauthorizedHandler } from "@/services/api";
import {
  onTokenRefresh,
  registerDeviceToken,
  registerForPushNotifications,
  unregisterForPushNotifications,
} from "@/services/notifications";
import type { AuthUser } from "@/types/api";
import { createLogger } from "@/utils/logger";

const log = createLogger("auth");

// ─── Context ──────────────────────────────────────────────────────────────────
interface AuthContextValue {
  /** Whether the user is currently signed in. */
  authenticated: boolean;
  /** The signed-in user, when the login response exposed one. */
  user: AuthUser | null;
  /** True until the persisted session has been restored on app start. */
  isRestoring: boolean;
  /** True while a login request is in flight. */
  isLoggingIn: boolean;
  /** Sign in with email + password. Throws `ApiError` on failure. */
  login: (email: string, password: string) => Promise<void>;
  /** Sign out, clear tokens and drop all cached server state. */
  logout: () => Promise<void>;
  /**
   * True when a refresh token is on the device, so the session can be resumed
   * without re-entering a password (used to gate the biometric button).
   */
  hasStoredSession: boolean;
  /** Resume a stored session via the refresh token. Returns false if it failed. */
  resumeSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
interface AuthProviderProps {
  children: React.ReactNode;
  /** Optional initial state — useful for tests or feature toggles. */
  initialAuthenticated?: boolean;
}

export function AuthProvider({
  children,
  initialAuthenticated = false,
}: AuthProviderProps) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [hasStoredSession, setHasStoredSession] = useState(false);

  /** Local teardown — no server call. Used by both logout and 401 handling. */
  const clearSession = useCallback(() => {
    log.info("clearing local session + query cache");
    setAuthenticated(false);
    setUser(null);
    setHasStoredSession(false);
    // Drop cached server state so the next account never sees stale data.
    queryClient.clear();
  }, []);

  // ── Restore a persisted session on start ────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const session = await authApi.restoreSession();
        if (cancelled) return;

        log.info(
          session
            ? `session restored for ${session.user?.email ?? "(unknown user)"}`
            : "no stored session — showing login",
        );

        if (session) {
          setUser(session.user);
          setAuthenticated(true);
          setHasStoredSession(!!session.tokens.refreshToken);
          // Re-assert the device token — it may have rotated while signed out.
          void registerForPushNotifications();
        }
      } finally {
        if (!cancelled) setIsRestoring(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Tear the session down when a refresh fails anywhere in the app ──────
  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  // ── Re-register whenever Firebase rotates the FCM token ─────────────────
  useEffect(() => {
    if (!authenticated) return;
    const unsubscribe = onTokenRefresh((token) => {
      void registerDeviceToken(token);
    });
    return unsubscribe;
  }, [authenticated]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoggingIn(true);
    try {
      log.info(`login attempt for ${email}`);
      const session = await authApi.login({ email, password });
      log.info("login succeeded ✓", {
        user: session.user,
        hasRefreshToken: !!session.tokens.refreshToken,
        expiresAt: session.tokens.expiresAt,
      });
      setUser(session.user);
      setAuthenticated(true);
      setHasStoredSession(!!session.tokens.refreshToken);

      // Fire-and-forget: a push-registration failure must not fail the login.
      void registerForPushNotifications();
    } catch (e) {
      log.error("login failed ✕", { message: (e as Error)?.message });
      throw e;
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  /**
   * Exchanges the stored refresh token for a fresh session. Backs the biometric
   * sign-in path, so the app never has to keep the user's password on device.
   */
  const resumeSession = useCallback(async () => {
    try {
      const session = await authApi.refresh();
      if (!session) {
        log.warn("session resume failed — refresh token rejected or missing");
        return false;
      }
      log.info("session resumed ✓");
      setUser(session.user);
      setAuthenticated(true);
      void registerForPushNotifications();
      return true;
    } catch (e) {
      log.error("session resume failed ✕", { message: (e as Error)?.message });
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    log.info("logging out");
    try {
      // Unregister first: the call is authenticated, so it has to happen
      // before the tokens are cleared.
      await unregisterForPushNotifications();
      await authApi.logout();
      log.info("logout complete ✓");
    } catch (e) {
      log.error("logout call failed — clearing session anyway", {
        message: (e as Error)?.message,
      });
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      authenticated,
      user,
      isRestoring,
      isLoggingIn,
      login,
      logout,
      hasStoredSession,
      resumeSession,
    }),
    [
      authenticated,
      user,
      isRestoring,
      isLoggingIn,
      login,
      logout,
      hasStoredSession,
      resumeSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
