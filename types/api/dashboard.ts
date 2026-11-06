/**
 * Student dashboard — `/api/mobile/students/{studentSeasonId}/dashboard/*`.
 *
 * Three independent endpoints behind one section of the profile screen:
 * `today` (summary tiles), `needs-attention` (actionable items) and `latest`
 * (recent activity).
 *
 * ⚠️ Today and Needs Attention load each section independently server-side, so
 * HTTP 200 does NOT mean every section loaded. Both carry `failedSections` and
 * `isPartial`, and a failed section arrives as `null` — which must render as
 * "couldn't load", never as a zero. The guides are emphatic about this because
 * showing 0% attendance for a failed lookup is worse than showing nothing.
 */

// ─── Today ──────────────────────────────────────────────────────────────────

export type TodaySection =
  | "Attendance"
  | "Classes"
  | "Homework"
  | "Exams"
  | "Reports";

export interface TodayAttendanceDto {
  /**
   * A percentage, not a fraction — 95.0 means 95%.
   * `null` with `totalRecordedDays: 0` means no attendance recorded, which is
   * a legitimate state and must not render as 0%.
   */
  percentage: number | null;
  /** Attended days, including Late and Left Early despite the name. */
  presentDays: number;
  totalRecordedDays: number;
}

export interface TodayClassesDto {
  /** The whole day's timetable count, not the classes remaining. */
  count: number;
  nextClass: {
    subjectName: string;
    /** "HH:mm", school-local. ⚠️ Not a timestamp — never parse it as UTC. */
    startTime: string;
  } | null;
}

export interface TodayHomeworkDto {
  /** Includes overdue work with no submission. */
  pendingCount: number;
  /** Subset of pending due through Thursday. 0 on Friday and Saturday. */
  dueThisWeekCount: number;
}

export interface TodayExamsDto {
  upcomingCount: number;
  nextExam: {
    title: string;
    /** School-local convention, no offset. Don't append Z. */
    startDate: string;
  } | null;
}

export interface TodayReportsDto {
  totalCount: number;
  /** Created today — NOT unread. */
  newCount: number;
}

/** GET /api/mobile/students/{studentSeasonId}/dashboard/today */
export interface StudentTodayDto {
  attendance: TodayAttendanceDto | null;
  classes: TodayClassesDto | null;
  homework: TodayHomeworkDto | null;
  exams: TodayExamsDto | null;
  reports: TodayReportsDto | null;
  failedSections: TodaySection[] | null;
  isPartial: boolean;
}

// ─── Needs attention ────────────────────────────────────────────────────────

/**
 * Part of the API contract — these exact strings are agreed with the backend
 * and must not be renamed on either side.
 */
export type AttentionType =
  | "InstallmentOverdue"
  | "InstallmentDueToday"
  | "WalletEmpty"
  | "MealNotOrdered";

/** Section names that can appear in `failedSections`. */
export type AttentionSection = "Installments" | "Wallet" | "MealOrders";

/**
 * Where a card's CTA goes. A screen key, not an HTTP route, and `id` is
 * always the studentSeasonId — never an installment, wallet or order id.
 */
export interface DashboardNavigationDto {
  destination: string;
  id: number;
}

export interface AttentionInstallmentDto {
  installmentNumber: number;
  dueDate: string | null;
  /** Remaining payable, not the original installment amount. */
  outstandingAmount: number;
  isOverdue: boolean;
}

export interface AttentionWalletDto {
  /** Net of pending meal-order commitments — not the raw wallet balance. */
  availableBalance: number;
}

export interface AttentionItemDto {
  type: AttentionType | string;
  /** Ready to display; the server composes the wording. */
  title: string | null;
  subtitle: string | null;
  installment?: AttentionInstallmentDto | null;
  wallet?: AttentionWalletDto | null;
  navigation: DashboardNavigationDto;
}

/** GET /api/mobile/students/{studentSeasonId}/dashboard/needs-attention */
export interface NeedsAttentionDto {
  count: number;
  items: AttentionItemDto[] | null;
  failedSections: AttentionSection[] | null;
  isPartial: boolean;
}

// ─── Latest activities ──────────────────────────────────────────────────────

/**
 * Presentation type, used for the icon and label. Routing goes through
 * `navigation.destination` instead, so an unrecognised type still renders.
 */
export type LatestActivityType =
  | "Clinic"
  | "MonthlyExam"
  | "ExamReport"
  | "TeacherExamPublished"
  | "TeacherExamResult"
  | "Homework"
  | "HealthProfileCreated"
  | "HealthProfileUpdated";

/** Only populated on Homework activities. */
export interface LatestHomeworkDto {
  isSubmitted: boolean;
  submissionId: number | null;
  isGraded: boolean;
  score: number | null;
}

export interface LatestActivityDto {
  type: LatestActivityType | string;
  /** Source-specific record id — not always the same entity type. */
  referenceId: number;
  title: string | null;
  subtitle: string | null;
  /** No explicit offset; render as school-local, don't convert from UTC. */
  date: string | null;
  navigation: DashboardNavigationDto;
  homework?: LatestHomeworkDto | null;
}

/**
 * GET /api/mobile/students/{studentSeasonId}/dashboard/latest
 *
 * At most one item per source, newest first. Never assume a count or an
 * order, and `activities` may be empty.
 */
export interface LatestActivitiesDto {
  activities: LatestActivityDto[] | null;
}

/**
 * GET /api/mobile/students/{studentSeasonId}/dashboard/financial-summary
 *
 * School-fee totals for one student. `nextDueDate` and `nextDueAmount` are
 * null together when nothing is left to pay; `currency` is null when the
 * school's country has none on record.
 */
export interface StudentFinancialSummaryDto {
  totalOutstanding: number;
  overdueAmount: number;
  nextDueDate: string | null;
  nextDueAmount: number | null;
  total: number;
  paid: number;
  currency: string | null;
}
