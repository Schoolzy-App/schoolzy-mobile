import type { IsoDateTime } from "./common";

/**
 * Student report DTOs — `GET /api/mobile/students/{studentSeasonId}/reports`.
 */

/**
 * A single report document.
 *
 * The file comes from `GET /api/mobile/students/{studentSeasonId}/reports/{id}/file`,
 * which is bearer-protected; see `studentsApi.getReportFileUrl`.
 */
export interface StudentReportDto {
  id: number;
  name: string | null;
  date: IsoDateTime | null;
  /** Optional — may be null. */
  description: string | null;
  /**
   * Exam=1, IG=2, Medical=3, Other=4, Newsletter=5, AdminForm=6,
   * MonthlyExam=7, StudentDynamic=8.
   */
  category?: number;
  /** "IGCSE", "Clinic", "Monthly report"… — display only. */
  categoryDisplay?: string;
  /** Exam reports only: 1 Mid of year, 2 End of year. */
  examTerm?: 1 | 2 | null;
  examTermDisplay?: string | null;
  /** Only meaningful on MonthlyExam reports. */
  isMinistry?: boolean;
  /** False when there is no PDF to request. */
  hasFile?: boolean;
  /** "Clinic", "Administration", "Academic office" or "School". */
  sender?: string;
}

/** Reports grouped by category. `reports` may legitimately be empty. */
export interface StudentReportCategoryDto {
  /** Use this for logic — see `StudentReportDto.category`. */
  categoryId: number;
  /** Display only — the guide warns against branching on it. */
  categoryName: string | null;
  categoryDisplay?: string;
  reports: StudentReportDto[] | null;
}

/** One chip's count. Counts ignore the `category` filter. */
export interface ReportCategoryCountDto {
  category: number;
  categoryDisplay: string;
  count: number;
}

export interface ReportCountsDto {
  total: number;
  /** Only categories with at least one report, in category order. */
  byCategory: ReportCategoryCountDto[];
}

/** GET /api/mobile/students/{studentSeasonId}/reports */
export interface StudentReportsDto {
  /** Returned once at the root, not repeated per category or report. */
  studentName: string | null;
  categories: StudentReportCategoryDto[] | null;
  counts?: ReportCountsDto | null;
  /** Flat, newest first, paged by `page` / `pageSize`, filtered by category. */
  items?: StudentReportDto[] | null;
  page?: number | null;
  pageSize?: number | null;
  /** Reports matching the filter, across every page. */
  total?: number | null;
}

/** Query parameters for the reports list. */
export interface StudentReportsParams {
  category?: number;
  page?: number;
  pageSize?: number;
}
