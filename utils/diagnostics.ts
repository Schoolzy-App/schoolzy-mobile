import Constants from "expo-constants";
import { Platform } from "react-native";

import { FeatureFlags } from "@/constants/featureFlags";

import { createLogger, LOGGING_ENABLED } from "./logger";

const log = createLogger("startup");

/**
 * One-shot summary of the resolved runtime configuration, printed at launch.
 *
 * This is the quickest way to diagnose "nothing works" reports: a blank
 * `apiUrl`, the wrong variant, or a missing Firebase file all show up here
 * before any request is made.
 */
export function logStartupDiagnostics(apiBaseUrl: string) {
  if (!LOGGING_ENABLED) return;

  const expo = Constants.expoConfig;
  const androidPackage = expo?.android?.package;
  const iosBundle = expo?.ios?.bundleIdentifier;

  log.info("app starting", {
    variant: process.env.APP_VARIANT ?? "(default)",
    name: expo?.name,
    version: expo?.version,
    platform: `${Platform.OS} ${Platform.Version}`,
    bundleId: Platform.OS === "ios" ? iosBundle : androidPackage,
    apiBaseUrl: apiBaseUrl || "⚠️ EMPTY — every request will fail",
    firebaseConfig:
      Platform.OS === "ios"
        ? (expo?.ios?.googleServicesFile ?? "⚠️ missing")
        : (expo?.android?.googleServicesFile ?? "⚠️ missing"),
    // Firebase is a native module: absent in Expo Go, present in dev/preview builds.
    executionEnvironment: Constants.executionEnvironment,
    featureFlags: FeatureFlags,
    userInterfaceStyle: expo?.userInterfaceStyle,
  });
}
