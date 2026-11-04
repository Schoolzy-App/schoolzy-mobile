import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

import { authApi } from "@/services/api";
import {
  clearBiometricEnrollment,
  getBiometricCapability,
  getEnrollment,
  getLastLoginIdentifier,
  storeBiometricToken,
  type BiometricType,
} from "@/services/biometric";
import { getDeviceId } from "@/services/deviceId";
import { createLogger } from "@/utils/logger";

const log = createLogger("biometric");

/**
 * Biometric capability plus whether a credential is enrolled on this phone,
 * for the Account toggle and the login button.
 *
 * `enabled` means "enrolled": a biometric credential from the server is in the
 * keychain. `ready` exists so the login screen can avoid flashing the
 * biometric button on and then off again while the keychain read is in
 * flight. `busy` covers an enroll in progress (network + a scan on Android).
 */
export function useBiometricSetting() {
  const [available, setAvailable] = useState(false);
  const [type, setType] = useState<BiometricType>(null);
  const [label, setLabel] = useState("Fingerprint");
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /**
   * Re-reads capability and enrollment. Enrollment is meaningless without the
   * hardware, so it is only read when there is something to enable. A read
   * failure counts as "not enrolled" rather than throwing.
   */
  const refresh = useCallback(async () => {
    const capability = await getBiometricCapability();
    let enrolled = false;
    if (capability.available) {
      try {
        enrolled = (await getEnrollment()) !== null;
      } catch {
        enrolled = false;
      }
    }
    if (!mounted.current) return;

    setAvailable(capability.available);
    setType(capability.type);
    setLabel(capability.label);
    setEnabled(enrolled);
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /**
   * Not optimistic: turning it on needs the network and (on Android) a scan,
   * so the switch moves only once the credential is actually stored. Turning
   * it off is local and instant; the server revoke is best-effort.
   */
  const toggle = useCallback(
    async (next: boolean) => {
      if (busy) return;

      if (!next) {
        try {
          await clearBiometricEnrollment();
        } catch (e) {
          log.warn("could not clear biometric enrollment", {
            message: (e as Error)?.message,
          });
          return;
        }
        setEnabled(false);
        // The local credential is already gone, so a failed revoke only leaves
        // an unreachable row that expires on its own.
        void getDeviceId()
          .then((deviceId) => authApi.biometricRevoke(deviceId))
          .catch((e) => {
            log.warn("biometric revoke failed — ignored", {
              message: (e as Error)?.message,
            });
          });
        return;
      }

      setBusy(true);
      try {
        const identifier = await getLastLoginIdentifier();
        // Only a session signed in before this release has no identifier.
        // Enrolling it would leave the credential without an owner.
        if (!identifier) {
          Alert.alert(
            "Sign in again",
            "Sign out and back in with your password, then turn " +
              label +
              " on.",
          );
          return;
        }

        const token = await authApi.biometricEnroll(await getDeviceId());
        await storeBiometricToken(token, identifier, label);
        if (mounted.current) setEnabled(true);
      } catch (e) {
        log.warn("biometric enrollment failed", {
          message: (e as Error)?.message,
        });
        await clearBiometricEnrollment().catch(() => undefined);
        Alert.alert("Couldn't turn on " + label, "Please try again.");
      } finally {
        if (mounted.current) setBusy(false);
      }
    },
    [busy, label],
  );

  return { available, type, label, enabled, ready, busy, toggle, refresh };
}
