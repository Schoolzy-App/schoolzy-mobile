import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

/**
 * A one-line description of this phone for signed records, e.g.
 * "ios 18.1 · app 3.0.0 · iPhone 15 Pro". Every part is optional; whatever the
 * platform can't tell is left out.
 */
export function describeDevice(): string {
  const os = [Platform.OS, Device.osVersion ?? String(Platform.Version ?? "")]
    .filter(Boolean)
    .join(" ");
  const version = Constants.expoConfig?.version;
  const parts = [
    os,
    version ? `app ${version}` : null,
    Device.modelName ?? null,
  ].filter(Boolean);
  return parts.join(" · ").slice(0, 250);
}
