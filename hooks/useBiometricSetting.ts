import { useCallback, useEffect, useState } from "react";

import {
  getBiometricCapability,
  isBiometricEnabled,
  setBiometricEnabled,
  type BiometricType,
} from "@/services/biometric";

/**
 * Biometric capability plus the stored preference, for the Account toggle and
 * the login button.
 *
 * `ready` exists so the login screen can avoid flashing the biometric button
 * on and then off again while the keychain read is in flight.
 */
export function useBiometricSetting() {
  const [available, setAvailable] = useState(false);
  const [type, setType] = useState<BiometricType>(null);
  const [label, setLabel] = useState("Fingerprint");
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const capability = await getBiometricCapability();
      // The stored preference is meaningless without the hardware, so it is
      // only read when there is something to enable.
      const stored = capability.available ? await isBiometricEnabled() : false;
      if (cancelled) return;

      setAvailable(capability.available);
      setType(capability.type);
      setLabel(capability.label);
      setEnabled(stored);
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Applied optimistically: the switch should follow the thumb immediately.
   * A failed write rolls it back rather than leaving the UI lying about what
   * is stored.
   */
  const toggle = useCallback(async (next: boolean) => {
    setEnabled(next);
    try {
      await setBiometricEnabled(next);
    } catch {
      setEnabled(!next);
    }
  }, []);

  return { available, type, label, enabled, ready, toggle };
}
