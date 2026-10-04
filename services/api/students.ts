import type {
  StudentListItemDto,
  StudentProfileDto,
  StudentReportsDto,
} from "@/types/api";

import { request } from "./client";
import { API_BASE_URL, API_VERSION, ROUTES } from "./config";
import { fileAuthHeaders } from "./fileAuth";

export const studentsApi = {
  /** GET /api/mobile/students — the signed-in parent's children. */
  list(): Promise<StudentListItemDto[]> {
    return request<StudentListItemDto[]>({
      method: "GET",
      url: ROUTES.students.list,
    });
  },

  /** GET /api/mobile/students/{studentSeasonId}/profile */
  profile(studentSeasonId: number): Promise<StudentProfileDto> {
    return request<StudentProfileDto>({
      method: "GET",
      url: ROUTES.students.profile(studentSeasonId),
    });
  },

  /** GET /api/mobile/students/{studentSeasonId}/reports */
  reports(studentSeasonId: number): Promise<StudentReportsDto> {
    return request<StudentReportsDto>({
      method: "GET",
      url: ROUTES.students.reports(studentSeasonId),
    });
  },

  /**
   * GET /api/mobile/students/{studentSeasonId}/reports/{reportId}/file returns
   * raw bytes. The list payload no longer carries a `fileUrl`, and unlike the
   * old one this endpoint is bearer-protected — pass `getReportFileHeaders()`
   * alongside it.
   */
  getReportFileUrl(studentSeasonId: number, reportId: number): string {
    return `${API_BASE_URL}${ROUTES.students.reportFile(studentSeasonId, reportId)}?api-version=${API_VERSION}`;
  },

  /** Auth headers for the binary endpoint above. */
  getReportFileHeaders: fileAuthHeaders,
};
