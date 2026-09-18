import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Updates from 'expo-updates';

async function checkAndApplyUpdate() {
  if (__DEV__ || !Updates.isEnabled) return;
  try {
    const result = await Updates.checkForUpdateAsync();
    if (result.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  } catch {
    /* offline or update server unreachable — ignore */
  }
}

// Cap the cold-start check so a slow network can't keep the splash on screen forever.
const INITIAL_CHECK_TIMEOUT_MS = 4000;

export function useUpdateCheck() {
  const appState = useRef(AppState.currentState);
  const [ready, setReady] = useState(__DEV__ || !Updates.isEnabled);

  // ── Cold-start check — runs once, gates the splash ─────────────────────
  useEffect(() => {
    // In dev, or with updates disabled, `ready` already starts true.
    if (__DEV__ || !Updates.isEnabled) return;

    let cancelled = false;
    const timeout = new Promise<void>((resolve) =>
      setTimeout(resolve, INITIAL_CHECK_TIMEOUT_MS),
    );

    Promise.race([checkAndApplyUpdate(), timeout]).finally(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Re-check whenever the app returns to the foreground ────────────────
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        checkAndApplyUpdate();
      }
      appState.current = next;
    });

    return () => subscription.remove();
  }, []);

  return { ready };
}
