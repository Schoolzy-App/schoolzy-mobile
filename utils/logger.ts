/**
 * Lightweight namespaced logger.
 *
 * Enabled in development automatically. Push notifications and native Firebase
 * can only be exercised in a real build (where `__DEV__` is false), so release
 * builds can opt in with `EXPO_PUBLIC_DEBUG_LOGS=1` in `.env` — view the output
 * with `npx react-native log-android` / `log-ios`, Xcode, or `adb logcat`.
 */
export const LOGGING_ENABLED =
  __DEV__ || process.env.EXPO_PUBLIC_DEBUG_LOGS === "1";

/** Keys whose values must never reach the console. */
const SENSITIVE_KEYS = [
  "password",
  "currentpassword",
  "newpassword",
  "accesstoken",
  "refreshtoken",
  "token",
  "authorization",
  "resettoken",
];

/** FCM tokens are ~160 chars; log enough to correlate, not the whole value. */
export function truncate(value: string, keep = 12): string {
  if (value.length <= keep * 2) return value;
  return `${value.slice(0, keep)}…${value.slice(-6)} (len ${value.length})`;
}

/**
 * Deep-copies a payload, replacing sensitive values. Never mutates the input,
 * so redaction can't corrupt an in-flight request body.
 */
export function redact(value: unknown, depth = 0): unknown {
  if (value == null || depth > 4) return value;

  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));

  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
        out[key] =
          typeof val === "string" && val.length > 0
            ? `«redacted ${truncate(val, 6)}»`
            : "«redacted»";
      } else {
        out[key] = redact(val, depth + 1);
      }
    }
    return out;
  }

  return value;
}

type Level = "debug" | "info" | "warn" | "error";

function write(level: Level, scope: string, message: string, data?: unknown) {
  if (!LOGGING_ENABLED) return;

  const prefix = `[schoolzy:${scope}]`;
  const payload = data === undefined ? undefined : redact(data);

  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;

  if (payload === undefined) fn(`${prefix} ${message}`);
  else fn(`${prefix} ${message}`, payload);
}

/** `logger.api.info("…")` style namespaced logging. */
export function createLogger(scope: string) {
  return {
    debug: (message: string, data?: unknown) =>
      write("debug", scope, message, data),
    info: (message: string, data?: unknown) =>
      write("info", scope, message, data),
    warn: (message: string, data?: unknown) =>
      write("warn", scope, message, data),
    error: (message: string, data?: unknown) =>
      write("error", scope, message, data),
  };
}

export type Logger = ReturnType<typeof createLogger>;
