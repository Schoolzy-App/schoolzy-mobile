import type { NewsletterDto, NewsletterItemSource } from "@/types/api";

import { request } from "./client";
import { API_BASE_URL, API_VERSION, ROUTES } from "./config";
import { fileAuthHeaders } from "./fileAuth";

export const newslettersApi = {
  /** GET /api/mobile/newsletters */
  list(): Promise<NewsletterDto[]> {
    return request<NewsletterDto[]>({
      method: "GET",
      url: ROUTES.newsletters.list,
    });
  },

  /**
   * GET /api/mobile/newsletters/{source}/{id}/file returns raw bytes.
   *
   * `source` is not optional: the list mixes newsletters with student reports
   * whose ids come from different tables, so the id alone is ambiguous and the
   * backend picks the file location from `source`.
   */
  getFileUrl(source: NewsletterItemSource, id: number): string {
    return `${API_BASE_URL}${ROUTES.newsletters.file(source, id)}?api-version=${API_VERSION}`;
  },

  /** Auth headers for the binary endpoint above. */
  getFileHeaders: fileAuthHeaders,
};
