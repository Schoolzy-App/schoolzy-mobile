import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Biometric sign-in: what the device can do, and the device-bound credential
 * that backs it.
 *
 * Both the login screen and the Account toggle need the same answers, so the
 * capability probe lives here rather than inline in a screen — otherwise the
 * toggle could offer a setting the login screen ignores, or vice versa.
 *
 * The credential model: turning the setting on asks the server for a biometric
 * token bound to this device (`getDeviceId`). It is stored behind
 * `requireAuthentication`, so only a successful scan can read it back — the
 * read IS the biometric prompt; there is no separate `authenticateAsync` step.
 * Signing in exchanges it for a brand-new session. Logout leaves it alone;
 * turning the setting off, a password change/reset, or the device's
 * biometrics changing ends it. Nothing here stores a password.
 */

/** The secret. Readable only after a biometric scan. */
const KEY_TOKEN = "biometric_token";
/** `{ identifier }` — who enrolled. Readable without a scan, so the UI can ask "enrolled?". */
const KEY_ENROLLMENT = "biometric_enrollment";
/** Identifier of the last password login. Survives logout. */
const KEY_LAST_IDENTIFIER = "last_login_identifier";
/** The on/off preference from before the credential model. Only ever deleted now. */
const KEY_LEGACY_ENABLED = "biometric_login_enabled";

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

/** Login identifiers are compared case- and whitespace-insensitively. */
function normalizeIdentifier(identifier: string): string {
  return identifier.trim().toLowerCase();
}

/**
 * Hardware *and* enrolment. A device with a Face ID sensor the owner never set
 * up cannot authenticate, so offering the button there is a dead end.
 *
 * On Android it also needs a Class 3 (strong) biometric: SecureStore's
 * `requireAuthentication` only accepts those, so a phone with weak face unlock
 * alone could never read the credential back. Fingerprint wins the label on
 * Android because it is the sensor the keystore will actually prompt for.
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
  const hasFace = types.includes(
    LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
  );
  const hasFingerprint = types.includes(
    LocalAuthentication.AuthenticationType.FINGERPRINT,
  );

  if (Platform.OS === "android") {
    const level = await LocalAuthentication.getEnrolledLevelAsync();
    const type: BiometricType = hasFingerprint
      ? "fingerprint"
      : hasFace
        ? "faceid"
        : null;
    return {
      available: level === LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG,
      type,
      label: biometricLabel(type),
    };
  }

  const type: BiometricType = hasFace
    ? "faceid"
    : hasFingerprint
      ? "fingerprint"
      : null;

  return { available: true, type, label: biometricLabel(type) };
}

/**
 * Who enrolled biometric sign-in on this phone, or null when nobody has.
 * Non-null is what "the setting is on" means. Reading it never prompts.
 */
export async function getEnrollment(): Promise<{ identifier: string } | null> {
  const raw = await SecureStore.getItemAsync(KEY_ENROLLMENT);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { identifier?: unknown };
    return typeof parsed.identifier === "string"
      ? { identifier: parsed.identifier }
      : null;
  } catch {
    return null;
  }
}

/**
 * Saves the server-issued token behind the biometric, then records who it
 * belongs to. On Android the write itself shows a scan prompt; a cancelled
 * scan throws and nothing is recorded.
 *
 * Any earlier token is deleted first: replacing an access-controlled keychain
 * item in place can itself demand authentication on iOS.
 */
export async function storeBiometricToken(
  token: string,
  identifier: string,
  label: string,
): Promise<void> {
  await SecureStore.deleteItemAsync(KEY_TOKEN);
  await SecureStore.setItemAsync(KEY_TOKEN, token, {
    requireAuthentication: true,
    authenticationPrompt: `Turn on ${label} sign-in`,
    keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
  });
  await SecureStore.setItemAsync(
    KEY_ENROLLMENT,
    JSON.stringify({ identifier: normalizeIdentifier(identifier) }),
  );
}

export type BiometricTokenRead =
  | { status: "ok"; token: string }
  | { status: "cancelled" }
  | { status: "invalidated" };

/**
 * Reads the token — this is the biometric prompt.
 *
 * - A resolved `null` means the OS dropped the item because the device's
 *   biometrics changed (a new face or fingerprint): `"invalidated"`.
 * - A throw is a cancelled or failed scan: `"cancelled"`. Nothing is cleared
 *   here, so the parent can simply try again.
 */
export async function readBiometricToken(
  label: string,
): Promise<BiometricTokenRead> {
  try {
    const token = await SecureStore.getItemAsync(KEY_TOKEN, {
      requireAuthentication: true,
      authenticationPrompt: `Sign in with ${label}`,
    });
    return token ? { status: "ok", token } : { status: "invalidated" };
  } catch {
    return { status: "cancelled" };
  }
}

/**
 * The identifier of the last password login on this phone. Enrolling records
 * it as the owner of the credential, so a second parent signing in can be
 * told apart from the one who turned biometrics on.
 */
export async function getLastLoginIdentifier(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY_LAST_IDENTIFIER);
}

export async function setLastLoginIdentifier(
  identifier: string,
): Promise<void> {
  await SecureStore.setItemAsync(
    KEY_LAST_IDENTIFIER,
    normalizeIdentifier(identifier),
  );
}

/**
 * Forgets the local credential. Local only — revoking it on the server is the
 * caller's job. Deleting does not prompt. Also sweeps the legacy preference key.
 */
export async function clearBiometricEnrollment(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEY_TOKEN),
    SecureStore.deleteItemAsync(KEY_ENROLLMENT),
    SecureStore.deleteItemAsync(KEY_LEGACY_ENABLED),
  ]);
}
