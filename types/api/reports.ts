import type { IsoDateTime } from "./common";

/**
 * Student report DTOs — `GET /api/mobile/students/{studentSeasonId}/reports`.
 */

/** A single report document. */
export interface StudentReportDto {
  id: number;
  name: string | null;
  date: IsoDateTime | null;
  /** Optional — may be null. */
  description: string | null;
  /**
   * ⚠️ Already a complete URL. The guide is explicit that the client must NOT
   * prefix it with the API base URL — reports are served from a different host.
   */
  fileUrl: string | null;
}

/** Reports grouped by category. `reports` may legitimately be empty. */
export interface StudentReportCategoryDto {
  /** Use this for logic: 1 Exam, 2 IG, 3 Medical, 4 Other. */
  categoryId: number;
  /** Display only — the guide warns against branching on it. */
  categoryName: string | null;
  reports: StudentReportDto[] | null;
}

/** GET /api/mobile/students/{studentSeasonId}/reports */
export interface StudentReportsDto {
  /** Returned once at the root, not repeated per category or report. */
  studentName: string | null;
  categories: StudentReportCategoryDto[] | null;
}
