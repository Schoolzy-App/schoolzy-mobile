import type {
  DeleteHealthAttachmentInput,
  HealthProfileEditDto,
  HealthProfileOverviewDto,
  SaveHealthProfileRequestDto,
  UploadHealthAttachmentInput,
} from "@/types/api";

import { request } from "./client";
import { API_BASE_URL, API_VERSION, ROUTES } from "./config";
import { tokenStorage } from "./tokenStorage";

export const healthProfileApi = {
  /** GET /api/mobile/health-profile/{studentSeasonId} */
  overview(studentSeasonId: number): Promise<HealthProfileOverviewDto> {
    return request<HealthProfileOverviewDto>({
      method: "GET",
      url: ROUTES.healthProfile.overview(studentSeasonId),
    });
  },

  /** GET /api/mobile/health-profile/{studentSeasonId}/edit */
  editData(studentSeasonId: number): Promise<HealthProfileEditDto> {
    return request<HealthProfileEditDto>({
      method: "GET",
      url: ROUTES.healthProfile.edit(studentSeasonId),
    });
  },

  /**
   * PUT /api/mobile/health-profile/{studentSeasonId}
   * Upsert — the whole profile is replaced by the payload, so always send the
   * complete set of lists, not just the changed ones.
   */
  save(
    studentSeasonId: number,
    body: SaveHealthProfileRequestDto,
  ): Promise<unknown> {
    return request<unknown>({
      method: "PUT",
      url: ROUTES.healthProfile.save(studentSeasonId),
      data: body,
    });
  },

  /** POST /api/mobile/health-profile/{studentSeasonId}/attachments (multipart) */
  uploadAttachments({
    studentSeasonId,
    files,
  }: UploadHealthAttachmentInput): Promise<unknown> {
    const form = new FormData();
    files.forEach((file) => form.append("Files", file as unknown as Blob));

    return request<unknown>({
      method: "POST",
      url: ROUTES.healthProfile.attachments(studentSeasonId),
      data: form,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /** DELETE /api/mobile/health-profile/{studentSeasonId}/attachments/{id} */
  deleteAttachment({
    studentSeasonId,
    attachmentId,
  }: DeleteHealthAttachmentInput): Promise<unknown> {
    return request<unknown>({
      method: "DELETE",
      url: ROUTES.healthProfile.attachment(studentSeasonId, attachmentId),
    });
  },

  /** Raw bytes — consumed as a URL by the PDF/image viewer, like other files. */
  getAttachmentUrl(studentSeasonId: number, attachmentId: number): string {
    return `${API_BASE_URL}${ROUTES.healthProfile.attachmentFile(
      studentSeasonId,
      attachmentId,
    )}?api-version=${API_VERSION}`;
  },

  async getAttachmentHeaders(): Promise<Record<string, string>> {
    const tokens = tokenStorage.getCached() ?? (await tokenStorage.load());
    return tokens?.accessToken
      ? { Authorization: `Bearer ${tokens.accessToken}` }
      : {};
  },
};
