import type {
  ComplaintListResponseDto,
  ComplaintLookupDto,
  ComplaintPage,
  ComplaintStudentDto,
  CreateComplaintInput,
  CreateComplaintResponseDto,
  MobileComplaintDetailDto,
  MobileComplaintListItemDto,
} from "@/types/api";

import { request } from "./client";
import { API_BASE_URL, API_VERSION, ROUTES } from "./config";
import { fileAuthHeaders } from "./fileAuth";
import { appendFile } from "./multipart";

export const COMPLAINTS_PAGE_SIZE = 20;

/**
 * Accepts either envelope shape for the list.
 *
 * The guide documents `pageNumber`/`pageSize` but never shows what `data`
 * looks like, and this API is inconsistent elsewhere — notifications send a
 * bare array with no metadata, payments send a page object. Rather than guess
 * and ship a list that silently stops at page one, both are handled.
 */
export function toComplaintPage(
  raw: ComplaintListResponseDto,
  pageNumber: number,
  pageSize: number,
): ComplaintPage {
  if (Array.isArray(raw)) {
    return {
      items: raw,
      pageNumber,
      // No metadata to go on: a full page means there may be another.
      hasMore: raw.length >= pageSize,
    };
  }

  const items: MobileComplaintListItemDto[] = raw?.items ?? raw?.data ?? [];
  const current = raw?.pageNumber ?? pageNumber;
  const hasMore =
    typeof raw?.totalPages === "number"
      ? current < raw.totalPages
      : items.length >= pageSize;

  return { items, pageNumber: current, hasMore };
}

export const complaintsApi = {
  /** GET /api/mobile/complaints?pageNumber=&pageSize= */
  async list(
    pageNumber = 1,
    pageSize = COMPLAINTS_PAGE_SIZE,
  ): Promise<ComplaintPage> {
    const raw = await request<ComplaintListResponseDto>({
      method: "GET",
      url: ROUTES.complaints.list,
      params: { pageNumber, pageSize },
    });
    return toComplaintPage(raw, pageNumber, pageSize);
  },

  /** GET /api/mobile/complaints/{id} */
  detail(id: number): Promise<MobileComplaintDetailDto> {
    return request<MobileComplaintDetailDto>({
      method: "GET",
      url: ROUTES.complaints.detail(id),
    });
  },

  // ── Lookups ───────────────────────────────────────────────────────────
  // All four back the create form. The guide recommends these over
  // hardcoding, since the sets can grow server-side.

  students(): Promise<ComplaintStudentDto[]> {
    return request<ComplaintStudentDto[]>({
      method: "GET",
      url: ROUTES.complaints.students,
    });
  },

  categories(): Promise<ComplaintLookupDto[]> {
    return request<ComplaintLookupDto[]>({
      method: "GET",
      url: ROUTES.complaints.categories,
    });
  },

  priorities(): Promise<ComplaintLookupDto[]> {
    return request<ComplaintLookupDto[]>({
      method: "GET",
      url: ROUTES.complaints.priorities,
    });
  },

  contactMethods(): Promise<ComplaintLookupDto[]> {
    return request<ComplaintLookupDto[]>({
      method: "GET",
      url: ROUTES.complaints.contactMethods,
    });
  },

  /**
   * POST /api/mobile/complaints (multipart/form-data).
   *
   * The caller supplies `idempotencyKey` rather than letting the client
   * interceptor mint one, because a retry of the *same* complaint has to
   * reuse the key — a fresh key on retry would create a duplicate complaint.
   */
  create(
    input: CreateComplaintInput,
    idempotencyKey: string,
  ): Promise<CreateComplaintResponseDto> {
    const form = new FormData();

    if (typeof input.studentSeasonId === "number") {
      form.append("studentSeasonId", String(input.studentSeasonId));
    }
    form.append("title", input.title);
    form.append("description", input.description);
    form.append("category", String(input.category));
    form.append("priority", String(input.priority));
    form.append("preferredContactMethod", String(input.preferredContactMethod));
    if (input.contactPhone) form.append("contactPhone", input.contactPhone);
    if (input.contactEmail) form.append("contactEmail", input.contactEmail);
    if (input.preferredContactTime) {
      form.append("preferredContactTime", input.preferredContactTime);
    }
    if (input.attachment) appendFile(form, "attachment", input.attachment);

    return request<CreateComplaintResponseDto>({
      method: "POST",
      url: ROUTES.complaints.create,
      data: form,
      headers: {
        "Content-Type": "multipart/form-data",
        "Idempotency-Key": idempotencyKey,
      },
    });
  },

  // ── Attachments ───────────────────────────────────────────────────────
  // Raw bytes, so these are handed to the viewer as a URL plus headers
  // rather than fetched into JS memory. Call only when the detail's
  // `hasAttachment` / `hasResponseAttachment` is true.

  getAttachmentUrl(id: number): string {
    return `${API_BASE_URL}${ROUTES.complaints.attachment(id)}?api-version=${API_VERSION}`;
  },

  getResponseAttachmentUrl(id: number): string {
    return `${API_BASE_URL}${ROUTES.complaints.responseAttachment(id)}?api-version=${API_VERSION}`;
  },

  getAttachmentHeaders: fileAuthHeaders,
};
