import type {
  CreateDocumentRequestInput,
  CreateDocumentRequestResponseDto,
  DocumentRequestCreateOptionsDto,
  MobileDocumentRequestDetailDto,
  MobileDocumentRequestListItemDto,
  UploadDocumentRequestFileInput,
} from "@/types/api";

import { request } from "./client";
import { appendFile } from "./multipart";
import { API_BASE_URL, API_VERSION, ROUTES } from "./config";
import { tokenStorage } from "./tokenStorage";


export const documentRequestsApi = {
  /** GET /api/mobile/document-requests/create-options */
  createOptions(): Promise<DocumentRequestCreateOptionsDto> {
    return request<DocumentRequestCreateOptionsDto>({
      method: "GET",
      url: ROUTES.documentRequests.createOptions,
    });
  },

  /** GET /api/mobile/document-requests */
  list(): Promise<MobileDocumentRequestListItemDto[]> {
    return request<MobileDocumentRequestListItemDto[]>({
      method: "GET",
      url: ROUTES.documentRequests.list,
    });
  },

  /** GET /api/mobile/document-requests/{id} */
  detail(id: number): Promise<MobileDocumentRequestDetailDto> {
    return request<MobileDocumentRequestDetailDto>({
      method: "GET",
      url: ROUTES.documentRequests.detail(id),
    });
  },

  /**
   * POST /api/mobile/document-requests (multipart/form-data)
   * Field names are PascalCase to match the server's model binder.
   */
  create(
    input: CreateDocumentRequestInput,
  ): Promise<CreateDocumentRequestResponseDto> {
    const form = new FormData();
    form.append("DocumentRequestTypeId", String(input.documentRequestTypeId));
    form.append("StudentSeasonId", String(input.studentSeasonId));
    if (input.notes) form.append("Notes", input.notes);
    input.files?.forEach((file) => appendFile(form, "Files", file));

    return request<CreateDocumentRequestResponseDto>({
      method: "POST",
      url: ROUTES.documentRequests.create,
      data: form,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /** POST /api/mobile/document-requests/{requestId}/files (multipart/form-data) */
  uploadFile({
    requestId,
    file,
  }: UploadDocumentRequestFileInput): Promise<boolean> {
    const form = new FormData();
    appendFile(form, "File", file);

    return request<boolean>({
      method: "POST",
      url: ROUTES.documentRequests.uploadFile(requestId),
      data: form,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /**
   * GET /api/mobile/document-requests/files/{fileId} returns raw bytes, so it
   * is consumed as a URL rather than fetched into JS memory. Pass the result
   * straight to `react-native-pdf`:
   *
   *   <Pdf source={{ uri: getFileUrl(id), headers: await getFileHeaders() }} />
   */
  getFileUrl(fileId: number): string {
    return `${API_BASE_URL}${ROUTES.documentRequests.file(fileId)}?api-version=${API_VERSION}`;
  },

  /** Auth headers for the binary endpoints above. */
  async getFileHeaders(): Promise<Record<string, string>> {
    const tokens = tokenStorage.getCached() ?? (await tokenStorage.load());
    return tokens?.accessToken
      ? { Authorization: `Bearer ${tokens.accessToken}` }
      : {};
  },
};
