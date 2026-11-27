import type {
  ConsentFormDetailDto,
  ConsentFormListItemDto,
  ConsentRespondInput,
  ConsentRespondResultDto,
} from "@/types/api";

import { request } from "./client";
import { API_BASE_URL, API_VERSION, ROUTES } from "./config";
import { fileAuthHeaders } from "./fileAuth";

export type ConsentListFilter = "pending" | "answered";

export const consentFormsApi = {
  /** GET /api/mobile/consent-forms?status= — omit the filter for all. */
  list(status?: ConsentListFilter): Promise<ConsentFormListItemDto[]> {
    return request<ConsentFormListItemDto[]>({
      method: "GET",
      url: ROUTES.consentForms.list,
      params: status ? { status } : undefined,
    });
  },

  /** GET /api/mobile/consent-forms/pending-count */
  pendingCount(): Promise<number> {
    return request<number>({
      method: "GET",
      url: ROUTES.consentForms.pendingCount,
    });
  },

  /** GET /api/mobile/consent-forms/{recipientId} */
  detail(recipientId: number): Promise<ConsentFormDetailDto> {
    return request<ConsentFormDetailDto>({
      method: "GET",
      url: ROUTES.consentForms.detail(recipientId),
    });
  },

  /**
   * POST /api/mobile/consent-forms/{recipientId}/respond —
   * `Idempotency-Key` is required.
   */
  respond(
    recipientId: number,
    input: ConsentRespondInput,
    idempotencyKey: string,
  ): Promise<ConsentRespondResultDto> {
    return request<ConsentRespondResultDto>({
      method: "POST",
      url: ROUTES.consentForms.respond(recipientId),
      data: input,
      headers: { "Idempotency-Key": idempotencyKey },
    });
  },

  // ── Attachment ────────────────────────────────────────────────────────
  // Raw bytes for the viewer: a URL plus bearer headers, like complaints.
  getAttachmentUrl(recipientId: number): string {
    return `${API_BASE_URL}${ROUTES.consentForms.attachment(recipientId)}?api-version=${API_VERSION}`;
  },

  getAttachmentHeaders: fileAuthHeaders,
};
