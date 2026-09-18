import type { ReportData } from "@/components/ReportItem";
import type { ReportType } from "@/components/ReportTypeFilter";
import type { StudentReportDto, StudentReportsDto } from "@/types/api";
import { dayOfMonth, shortWeekday } from "@/utils/format";

/**
 * `GET /api/mobile/students/{id}/reports` → UI.
 */

/** A report row, plus the fields the list needs to filter and open it. */
export interface StudentReport extends ReportData {
  /** Category key as a string, so it can drive the chip filter. */
  categoryKey: string;
  /** ⚠️ Already absolute — never prefix the API base URL. */
  fileUrl: string;
}

export interface StudentReports {
  studentName: string;
  /** Filter chips, built from the categories the API actually returned. */
  types: ReportType[];
  /** Every report across every category, flattened for the list. */
  reports: StudentReport[];
  /** True when the student has categories but no reports in any of them. */
  hasCategories: boolean;
}

function toReport(
  dto: StudentReportDto,
  categoryId: number,
): StudentReport {
  return {
    id: String(dto.id),
    title: dto.name ?? "Report",
    // `description` is nullable by contract.
    description: dto.description ?? "",
    date: dayOfMonth(dto.date),
    day: shortWeekday(dto.date),
    categoryKey: String(categoryId),
    type: String(categoryId),
    fileUrl: dto.fileUrl ?? "",
  };
}

/**
 * Categories come from the API rather than a hardcoded list: the guide gives
 * 1 Exam / 2 IG / 3 Medical / 4 Other today, but the set can grow, and the
 * chip labels must follow `categoryName` while the filter keys on `categoryId`.
 */
export function selectStudentReports(dto: StudentReportsDto): StudentReports {
  const categories = dto.categories ?? [];

  const types: ReportType[] = categories.map((c) => ({
    key: String(c.categoryId),
    label: c.categoryName ?? `Category ${c.categoryId}`,
  }));

  const reports = categories.flatMap((c) =>
    (c.reports ?? []).map((r) => toReport(r, c.categoryId)),
  );

  return {
    studentName: dto.studentName ?? "",
    types,
    reports,
    hasCategories: categories.length > 0,
  };
}
