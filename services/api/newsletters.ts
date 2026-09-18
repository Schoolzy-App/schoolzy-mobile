import type { NewsletterDto } from "@/types/api";

import { request } from "./client";
import { API_BASE_URL, API_VERSION, ROUTES } from "./config";
import { tokenStorage } from "./tokenStorage";

export const newslettersApi = {
  /** GET /api/mobile/newsletters */
  list(): Promise<NewsletterDto[]> {
    return request<NewsletterDto[]>({
      method: "GET",
      url: ROUTES.newsletters.list,
    });
  },

  /**
   * GET /api/mobile/newsletters/{newsletterId}/file returns raw bytes.
   * Prefer `NewsletterDto.fileUrl` when the API supplies one; fall back to this.
   */
  getFileUrl(newsletterId: number): string {
    return `${API_BASE_URL}${ROUTES.newsletters.file(newsletterId)}?api-version=${API_VERSION}`;
  },

  /** Auth headers for the binary endpoint above. */
  async getFileHeaders(): Promise<Record<string, string>> {
    const tokens = tokenStorage.getCached() ?? (await tokenStorage.load());
    return tokens?.accessToken
      ? { Authorization: `Bearer ${tokens.accessToken}` }
      : {};
  },
};
