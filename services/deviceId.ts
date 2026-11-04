import * as SecureStore from "expo-secure-store";

/**
 * A stable, random id for this install, sent with biometric enroll / login /
 * revoke so the server can bind the biometric credential to one phone.
 *
 * It is an identifier, not a secret — the biometric token is the secret — so
 * `Math.random` is enough and it is stored without `requireAuthentication`.
 * It survives logout. On Android a reinstall wipes it along with the
 * enrollment. On iOS keychain items survive an uninstall, so `device_id` and
 * the `biometric_*` items come back together after a reinstall — the
 * credential still matches the id it was bound to, so behaviour is consistent
 * on both platforms.
 */

const KEY_DEVICE_ID = "device_id";

function randomHex(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += Math.floor(Math.random() * 16).toString(16);
  }
  return out;
}

async function loadOrCreate(): Promise<string> {
  const stored = await SecureStore.getItemAsync(KEY_DEVICE_ID);
  if (stored) return stored;

  const id = randomHex(32);
  await SecureStore.setItemAsync(KEY_DEVICE_ID, id);
  return id;
}

/**
 * Memoised so two callers racing on first launch can't each mint and save a
 * different id. A failed read is not cached, so the next call retries.
 */
let pending: Promise<string> | null = null;

export function getDeviceId(): Promise<string> {
  pending =
    pending ??
    loadOrCreate().catch((e) => {
      pending = null;
      throw e;
    });
  return pending;
}
