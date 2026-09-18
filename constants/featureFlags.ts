import { AppConfig } from "@/apps";

/**
 * Build-time feature flags.
 *
 * Resolution order, highest priority first:
 *
 * 1. `EXPO_PUBLIC_*` environment variable — a local/QA override, inlined at
 *    bundle time.
 * 2. The active app's `features` block in `apps/<variant>.ts` — the committed
 *    source of truth for what each school ships with.
 *
 * Ship changes by editing the app's config and running `eas update`; the
 * environment variables are for trying something locally, not for releases.
 * `darkMode` is the exception — it has no per-app entry because it also drives
 * the native `userInterfaceStyle`, so changing it needs `eas build`.
 */

/** `"1"` / `"true"` → true, `"0"` / `"false"` → false, anything else → fallback. */
function envFlag(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

const appFeatures = AppConfig.features;

export const FeatureFlags = {
  /**
   * Whether the app may follow the device's dark colour scheme.
   *
   * Disabled: the app renders in light mode regardless of the system setting.
   * The dark palettes in `apps/<variant>.ts` are kept intact so this can be
   * switched back on without redoing any theming work.
   *
   * Override for testing with `EXPO_PUBLIC_ENABLE_DARK_MODE=1`.
   */
  darkMode: envFlag(process.env.EXPO_PUBLIC_ENABLE_DARK_MODE, false),

  /**
   * Whether the Chat tab appears in the bottom navigation bar.
   *
   * When off the tab is not registered at all, so `ChattingScreen` is never
   * mounted. `ChatWithSchool` stays reachable as a root screen, so any other
   * entry point to it keeps working.
   *
   * Per-app default in `apps/<variant>.ts`; override with
   * `EXPO_PUBLIC_ENABLE_CHAT_TAB=1`.
   */
  chatTab: envFlag(process.env.EXPO_PUBLIC_ENABLE_CHAT_TAB, appFeatures.chatTab),

  /**
   * Whether Requests appears as a tab in the bottom navigation bar.
   *
   * The two placements are mutually exclusive by design: when this is on the
   * tab is shown and the Requests row is removed from the Account screen; when
   * it is off the tab disappears and the Account row comes back. Requests is
   * therefore always reachable through exactly one route.
   *
   * Override with `EXPO_PUBLIC_ENABLE_REQUESTS_TAB=0`.
   */
  requestsTab: envFlag(
    process.env.EXPO_PUBLIC_ENABLE_REQUESTS_TAB,
    appFeatures.requestsTab,
  ),

  /**
   * Which payment methods are offered on the Payment Details screen.
   *
   * Only InstaPay is live today — Apple Pay and the in-app wallet have no
   * payment-submission endpoint behind them, so offering them would show a
   * success screen that never reached the server. Each can be switched on
   * independently, per app, once its backend exists.
   */
  paymentMethods: {
    /** `EXPO_PUBLIC_ENABLE_APPLE_PAY=1` */
    applePay: envFlag(
      process.env.EXPO_PUBLIC_ENABLE_APPLE_PAY,
      appFeatures.paymentMethods.applePay,
    ),
    /** `EXPO_PUBLIC_ENABLE_INSTAPAY=0` */
    instapay: envFlag(
      process.env.EXPO_PUBLIC_ENABLE_INSTAPAY,
      appFeatures.paymentMethods.instapay,
    ),
    /** `EXPO_PUBLIC_ENABLE_WALLET=1` */
    wallet: envFlag(
      process.env.EXPO_PUBLIC_ENABLE_WALLET,
      appFeatures.paymentMethods.wallet,
    ),
  },
} as const;

export type FeatureFlagKey = keyof typeof FeatureFlags;
