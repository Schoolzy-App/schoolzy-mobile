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
  clearBiometricEnrollment,
  getEnrollment,
  readBiometricToken,
  setLastLoginIdentifier,
} from "@/services/biometric";
import { getDeviceId } from "@/services/deviceId";
import {
  onTokenRefresh,
  registerDeviceToken,
  registerForPushNotifications,
  unregisterForPushNotifications,
} from "@/services/notifications";
import { ApiError, type AuthUser } from "@/types/api";
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
  /**
   * Sign in with the device's biometric credential. One scan: reading the
   * credential is the prompt.
   * - `"cancelled"`: the scan was cancelled or failed; nothing changed.
   * - `"invalidated"`: the device's biometrics changed; enrollment cleared.
   * - `"rejected"`: the server refused the credential (401 — e.g. the password
   *   changed); enrollment cleared.
   * Throws `ApiError` for anything else (network, lockout, …); enrollment kept.
   */
  loginWithBiometric: (
    label: string,
  ) => Promise<"ok" | "cancelled" | "invalidated" | "rejected">;
  /** Sign out, clear tokens and drop all cached server state. */
  logout: () => Promise<void>;
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

  /** Local teardown — no server call. Used by both logout and 401 handling. */
  const clearSession = useCallback(() => {
    log.info("clearing local session + query cache");
    setAuthenticated(false);
    setUser(null);
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

      /**
       * Biometric enrollment belongs to whoever turned it on. A different
       * parent signing in on this phone must not keep a button that would
       * sign them in as someone else, so it is dropped here. Best-effort: a
       * keychain hiccup must not fail a login that already succeeded.
       */
      try {
        const id = email.trim().toLowerCase();
        const enrollment = await getEnrollment();
        if (enrollment && enrollment.identifier !== id) {
          log.info("different account signed in — clearing biometric enrollment");
          await clearBiometricEnrollment();
        }
        await setLastLoginIdentifier(id);
      } catch (e) {
        log.warn("could not update biometric enrollment after login", {
          message: (e as Error)?.message,
        });
      }

      setUser(session.user);
      setAuthenticated(true);

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
   * Exchanges the device-bound biometric credential for a brand-new session.
   * The password is never on the device, and logout does not affect this
   * credential — only the server (password change, revoke, expiry) or the
   * device (biometrics changed) can end it.
   */
  const loginWithBiometric = useCallback(async (label: string) => {
    const read = await readBiometricToken(label);
    if (read.status === "cancelled") {
      log.info("biometric scan cancelled");
      return "cancelled" as const;
    }
    if (read.status === "invalidated") {
      log.warn("biometric credential unreadable — device biometrics changed");
      await clearBiometricEnrollment();
      return "invalidated" as const;
    }

    setIsLoggingIn(true);
    try {
      const session = await authApi.biometricLogin(
        await getDeviceId(),
        read.token,
      );
      log.info("biometric login succeeded ✓", {
        user: session.user,
        hasRefreshToken: !!session.tokens.refreshToken,
      });
      setUser(session.user);
      setAuthenticated(true);

      // Fire-and-forget: a push-registration failure must not fail the login.
      void registerForPushNotifications();
      return "ok" as const;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        log.warn("biometric credential rejected by server — clearing enrollment");
        await clearBiometricEnrollment();
        return "rejected" as const;
      }
      log.error("biometric login failed ✕", { message: (e as Error)?.message });
      throw e;
    } finally {
      setIsLoggingIn(false);
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
      loginWithBiometric,
      logout,
    }),
    [
      authenticated,
      user,
      isRestoring,
      isLoggingIn,
      login,
      loginWithBiometric,
      logout,
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
