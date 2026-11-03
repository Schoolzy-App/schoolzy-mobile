import type {
  LatestActivitiesDto,
  NeedsAttentionDto,
  StudentFinancialSummaryDto,
  StudentListItemDto,
  StudentProfileDto,
  StudentReportsDto,
  StudentReportsParams,
  StudentTodayDto,
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

  /**
   * GET /api/mobile/students/{studentSeasonId}/reports
   *
   * `category` filters `items`; `counts` always cover every category.
   */
  reports(
    studentSeasonId: number,
    params: StudentReportsParams = {},
  ): Promise<StudentReportsDto> {
    return request<StudentReportsDto>({
      method: "GET",
      url: ROUTES.students.reports(studentSeasonId),
      params,
    });
  },

  // ── Dashboard ─────────────────────────────────────────────────────────
  // Three independent sections of the profile screen. Today and
  // needs-attention can each come back partially loaded — see their DTOs.

  /** GET /api/mobile/students/{studentSeasonId}/dashboard/today */
  dashboardToday(studentSeasonId: number): Promise<StudentTodayDto> {
    return request<StudentTodayDto>({
      method: "GET",
      url: ROUTES.students.dashboardToday(studentSeasonId),
    });
  },

  /** GET /api/mobile/students/{studentSeasonId}/dashboard/needs-attention */
  dashboardNeedsAttention(studentSeasonId: number): Promise<NeedsAttentionDto> {
    return request<NeedsAttentionDto>({
      method: "GET",
      url: ROUTES.students.dashboardNeedsAttention(studentSeasonId),
    });
  },

  /** GET /api/mobile/students/{studentSeasonId}/dashboard/latest */
  dashboardLatest(studentSeasonId: number): Promise<LatestActivitiesDto> {
    return request<LatestActivitiesDto>({
      method: "GET",
      url: ROUTES.students.dashboardLatest(studentSeasonId),
    });
  },

  /** GET /api/mobile/students/{studentSeasonId}/dashboard/financial-summary */
  dashboardFinancialSummary(
    studentSeasonId: number,
  ): Promise<StudentFinancialSummaryDto> {
    return request<StudentFinancialSummaryDto>({
      method: "GET",
      url: ROUTES.students.dashboardFinancialSummary(studentSeasonId),
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
