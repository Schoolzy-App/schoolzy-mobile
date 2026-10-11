import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

/**
 * Biometric sign-in: what the device can do, and whether the parent wants it.
 *
 * Both the login screen and the Account toggle need the same answers, so the
 * capability probe lives here rather than inline in a screen — otherwise the
 * toggle could offer a setting the login screen ignores, or vice versa.
 *
 * Nothing here stores a password. Biometrics only unlock the refresh token
 * that is already in the keychain; see `AuthContext.resumeSession`.
 */

const KEY_ENABLED = "biometric_login_enabled";

export type BiometricType = "faceid" | "fingerprint" | null;

export interface BiometricCapability {
  /** The device has biometric hardware AND the user has enrolled on it. */
  available: boolean;
  type: BiometricType;
  /** "Face ID" / "Fingerprint" — safe to show even when unavailable. */
  label: string;
}

export function biometricLabel(type: BiometricType): string {
  return type === "faceid" ? "Face ID" : "Fingerprint";
}

/**
 * Hardware *and* enrolment. A device with a Face ID sensor the owner never set
 * up cannot authenticate, so offering the button there is a dead end.
 */
export async function getBiometricCapability(): Promise<BiometricCapability> {
  const [compatible, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);

  if (!compatible || !enrolled) {
    return { available: false, type: null, label: biometricLabel(null) };
  }

  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  const type: BiometricType = types.includes(
    LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
  )
    ? "faceid"
    : types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
      ? "fingerprint"
      : null;

  return { available: true, type, label: biometricLabel(type) };
}

/**
 * Defaults to ON, which is the behaviour before this setting existed: anyone
 * who had the button keeps it without having to go and find the toggle.
 *
 * A read failure also returns the default rather than throwing — a preference
 * that cannot be read should not keep someone out of the app.
 */
export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(KEY_ENABLED);
    return value === null ? true : value === "true";
  } catch {
    return true;
  }
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(KEY_ENABLED, enabled ? "true" : "false");
}

/**
 * Prompts for the biometric. `disableDeviceFallback: false` lets the OS offer
 * the device passcode, so a failed face scan does not strand the parent.
 */
export async function authenticateBiometric(
  promptMessage = "Authenticate to sign in",
): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    fallbackLabel: "Use password",
    cancelLabel: "Cancel",
    disableDeviceFallback: false,
  });
  return result.success;
}
