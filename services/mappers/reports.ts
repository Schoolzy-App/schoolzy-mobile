import type { StudentReportDto, StudentReportsDto } from "@/types/api";
import { dayOfMonth, formatDate, shortWeekday } from "@/utils/format";

/**
 * `GET /api/mobile/students/{id}/reports` → UI.
 */

/** Exam reports, the only category with a term sub-filter. */
export const EXAM_CATEGORY = 1;

export interface StudentReport {
  id: string;
  /** Numeric API id — builds the file URL with the student's id. */
  reportId: number;
  title: string;
  description: string;
  category: number;
  /** "IGCSE", "Monthly report"… from the server. */
  categoryLabel: string;
  /** Exam reports only: 1 Mid of year, 2 End of year. */
  examTerm: 1 | 2 | null;
  /** "Mid of year" / "End of year"; empty when not an exam. */
  examTermLabel: string;
  hasFile: boolean;
  sender: string;
  /** "15" */
  day: string;
  /** "Thu" */
  weekday: string;
  /** "Thu 15/10/2026" */
  dateLabel: string;
  /** "OCTOBER 2026", the month group. */
  monthLabel: string;
}

export interface ReportChip {
  /** "all" or the category number as a string. */
  key: string;
  label: string;
  count: number;
}

export interface StudentReports {
  studentName: string;
  /** All, then one chip per category the student has, with server counts. */
  chips: ReportChip[];
  /** Every loaded report, newest first. */
  reports: StudentReport[];
  hasMore: boolean;
}

const TERM_LABEL: Record<1 | 2, string> = { 1: "Mid of year", 2: "End of year" };

function monthLabel(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }).toUpperCase();
}

function toReport(dto: StudentReportDto, fallbackCategory = 0): StudentReport {
  const term = dto.examTerm ?? null;
  return {
    id: String(dto.id),
    reportId: dto.id,
    title: dto.name?.trim() || "Report",
    // `description` is nullable by contract.
    description: dto.description?.trim() ?? "",
    category: dto.category ?? fallbackCategory,
    categoryLabel: dto.categoryDisplay?.trim() || "Report",
    examTerm: term,
    examTermLabel: term ? TERM_LABEL[term] : "",
    hasFile: dto.hasFile ?? true,
    sender: dto.sender?.trim() ?? "",
    day: dayOfMonth(dto.date),
    weekday: shortWeekday(dto.date),
    dateLabel: [shortWeekday(dto.date), formatDate(dto.date)].filter(Boolean).join(" "),
    monthLabel: monthLabel(dto.date),
  };
}

/**
 * `select` for the paginated reports query.
 *
 * Chips come from the server's `counts`, so their labels and numbers follow
 * the backend and stay put while a filter is active. An older response
 * without `items` falls back to flattening `categories`.
 */
export function selectStudentReports(data: {
  pages: StudentReportsDto[];
}): StudentReports {
  const first = data.pages[0];
  const last = data.pages[data.pages.length - 1];

  const reports = data.pages.flatMap((page) =>
    page.items
      ? page.items.map((r) => toReport(r))
      : (page.categories ?? []).flatMap((c) =>
          (c.reports ?? []).map((r) => toReport(r, c.categoryId)),
        ),
  );

  const counts = first?.counts;
  const chips: ReportChip[] = counts
    ? [
        { key: "all", label: "All", count: counts.total },
        ...counts.byCategory.map((c) => ({
          key: String(c.category),
          label: c.categoryDisplay || `Category ${c.category}`,
          count: c.count,
        })),
      ]
    : [];

  const loaded = data.pages.reduce((n, p) => n + (p.items?.length ?? 0), 0);

  return {
    studentName: first?.studentName ?? "",
    chips,
    reports,
    hasMore: last?.total != null && loaded < last.total,
  };
}
