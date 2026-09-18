/**
 * Per-app feature configuration.
 *
 * These flags differ per school, so they live with the rest of the white-label
 * config in `apps/<variant>.ts` rather than being global. Read them through
 * `FeatureFlags` in `constants/featureFlags.ts` — never import an app's config
 * directly in a screen — so the environment override keeps working.
 *
 * `darkMode` is deliberately NOT here: it is a product-wide decision and it
 * also drives the native `userInterfaceStyle` in `app.config.ts`, which cannot
 * be resolved per app at runtime.
 */
export interface AppFeatures {
  /** Chat tab in the bottom navigation bar. */
  chatTab: boolean;
  /**
   * Requests as a bottom-bar tab. When true the Account screen drops its
   * Requests row, so the two placements stay mutually exclusive.
   */
  requestsTab: boolean;
  /** Payment methods offered on the Payment Details screen. */
  paymentMethods: {
    applePay: boolean;
    instapay: boolean;
    wallet: boolean;
  };
}

/**
 * Baseline every app starts from. Spread it and override only what differs:
 *
 *   features: { ...DEFAULT_FEATURES, chatTab: true }
 */
export const DEFAULT_FEATURES: AppFeatures = {
  chatTab: false,
  requestsTab: true,
  paymentMethods: {
    // InstaPay -> POST /student-payments/online (proof upload, starts Pending).
    // Wallet   -> POST /student-payments/wallet (completes immediately).
    // Apple Pay has no backend counterpart, so it stays off.
    applePay: false,
    instapay: true,
    wallet: true,
  },
};
