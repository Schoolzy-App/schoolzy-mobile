import * as SecureStore from "expo-secure-store";

/**
 * Whether the parent has deliberately cleared their quick actions.
 *
 * ⚠️ This is device-local on purpose, because the API cannot express it:
 * `PUT /quick-actions` with an empty list "removes the saved choices and
 * restores the defaults", and DELETE does the same. So there is no way to
 * persist "I want none" server-side — saving zero would come back as the
 * five defaults on the next load.
 *
 * Until the backend can store an empty selection, the flag is kept here: the
 * section still renders, with its Edit link and an empty line, rather than
 * silently showing the defaults the server hands back. Saving any non-empty
 * list clears it.
 */

const KEY = "quick_actions_hidden";

export async function isQuickActionsCleared(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(KEY)) === "true";
  } catch {
    return false;
  }
}

export async function setQuickActionsCleared(cleared: boolean): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, cleared ? "true" : "false");
  } catch {
    // A preference that can't be written shouldn't break the save itself.
  }
}
