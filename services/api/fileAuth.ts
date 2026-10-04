import { tokenStorage } from "./tokenStorage";

/**
 * Bearer headers for the binary file endpoints.
 *
 * Those endpoints return raw bytes and are consumed as a URL by the viewer
 * (`react-native-pdf` / `Image`) rather than fetched into JS memory, so the
 * token has to travel as an explicit header instead of going through the axios
 * interceptor that covers every other request.
 *
 * Returns `{}` rather than throwing when signed out: the caller is a viewer
 * that should render its own "couldn't load" state, not a crash.
 */
export async function fileAuthHeaders(): Promise<Record<string, string>> {
  const tokens = tokenStorage.getCached() ?? (await tokenStorage.load());
  return tokens?.accessToken
    ? { Authorization: `Bearer ${tokens.accessToken}` }
    : {};
}
