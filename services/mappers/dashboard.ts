import type {
  AttentionItemDto,
  AttentionType,
  LatestActivitiesDto,
  LatestActivityDto,
  NeedsAttentionDto,
  StudentTodayDto,
  TodaySection,
} from "@/types/api";
import { formatDate, formatTime } from "@/utils/format";

/**
 * Student dashboard → UI.
 *
 * The recurring rule across all three sections: a section that *failed* and a
 * section that is legitimately *empty* look identical in the payload (both
 * null-ish) and must not look identical on screen. `failedSections` is what
 * tells them apart, so every tile carries an explicit status rather than a
 * number that might be a fabricated zero.
 */

// ─── Today ───────────────────────────────────────────────────────────────────

/**
 * - `ok`     — loaded; `value`/`detail` are real
 * - `empty`  — loaded, but there is nothing to report
 * - `failed` — the server couldn't load this section; show "couldn't load"
 */
export type TileStatus = "ok" | "empty" | "failed";

export interface TodayTile {
  key: TodaySection;
  label: string;
  status: TileStatus;
  /** Headline — "95%", "6", "—". */
  value: string;
  /** Supporting line, e.g. "Next: Maths 10:15". */
  detail: string;
}

/** "2026-10-26T09:00:00" → "26/10/2026 · 09:00", school-local. */
function examWhen(startDate?: string | null): string {
  const date = formatDate(startDate);
  const time = formatTime(startDate);
  return [date, time].filter(Boolean).join(" · ");
}

export function selectTodayTiles(dto: StudentTodayDto): {
  tiles: TodayTile[];
  isPartial: boolean;
} {
  const failed = new Set<string>(dto.failedSections ?? []);
  const failedOr = (section: TodaySection, build: () => TodayTile): TodayTile =>
    failed.has(section)
      ? {
          key: section,
          label: TILE_LABEL[section],
          status: "failed",
          value: "—",
          detail: "Couldn't load",
        }
      : build();

  const tiles: TodayTile[] = [
    failedOr("Attendance", () => {
      const a = dto.attendance;
      // percentage null with no recorded days is "no data", not 0%.
      if (!a || a.percentage === null || a.totalRecordedDays === 0) {
        return {
          key: "Attendance",
          label: "Attendance",
          status: a ? "empty" : "failed",
          value: "—",
          detail: a ? "No attendance recorded" : "Couldn't load",
        };
      }
      return {
        key: "Attendance",
        label: "Attendance",
        status: "ok",
        value: `${Math.round(a.percentage)}%`,
        detail: `${a.presentDays} of ${a.totalRecordedDays} days`,
      };
    }),

    failedOr("Classes", () => {
      const c = dto.classes;
      if (!c) {
        return {
          key: "Classes",
          label: "Classes",
          status: "failed",
          value: "—",
          detail: "Couldn't load",
        };
      }
      if (c.count === 0) {
        return {
          key: "Classes",
          label: "Classes",
          status: "empty",
          value: "0",
          detail: "No classes today",
        };
      }
      return {
        key: "Classes",
        label: "Classes",
        status: "ok",
        value: String(c.count),
        detail: c.nextClass
          ? // startTime is already an "HH:mm" school-local string — shown as
            // sent rather than parsed, which would shift it by the offset.
            `Next: ${c.nextClass.subjectName} ${c.nextClass.startTime}`
          : "No more classes today",
      };
    }),

    failedOr("Homework", () => {
      const h = dto.homework;
      if (!h) {
        return {
          key: "Homework",
          label: "Homework",
          status: "failed",
          value: "—",
          detail: "Couldn't load",
        };
      }
      return {
        key: "Homework",
        label: "Homework",
        status: h.pendingCount === 0 ? "empty" : "ok",
        value: String(h.pendingCount),
        detail:
          h.pendingCount === 0
            ? "Nothing pending"
            : `${h.dueThisWeekCount} due this week`,
      };
    }),

    failedOr("Exams", () => {
      const e = dto.exams;
      if (!e) {
        return {
          key: "Exams",
          label: "Exams",
          status: "failed",
          value: "—",
          detail: "Couldn't load",
        };
      }
      return {
        key: "Exams",
        label: "Exams",
        status: e.upcomingCount === 0 ? "empty" : "ok",
        value: String(e.upcomingCount),
        detail: e.nextExam
          ? `Next: ${e.nextExam.title}`
          : "No upcoming exams",
      };
    }),

    failedOr("Reports", () => {
      const r = dto.reports;
      if (!r) {
        return {
          key: "Reports",
          label: "Reports",
          status: "failed",
          value: "—",
          detail: "Couldn't load",
        };
      }
      return {
        key: "Reports",
        label: "Reports",
        status: r.totalCount === 0 ? "empty" : "ok",
        value: String(r.totalCount),
        // "new today", never "unread" — they are not the same thing.
        detail: r.newCount > 0 ? `${r.newCount} new today` : "Nothing new today",
      };
    }),
  ];

  return { tiles, isPartial: !!dto.isPartial };
}

const TILE_LABEL: Record<TodaySection, string> = {
  Attendance: "Attendance",
  Classes: "Classes",
  Homework: "Homework",
  Exams: "Exams",
  Reports: "Reports",
};

/** Exported for the exam tile's tooltip-style detail elsewhere. */
export { examWhen };

// ─── Needs attention ─────────────────────────────────────────────────────────

export interface AttentionItem {
  id: string;
  type: AttentionType | string;
  title: string;
  subtitle: string;
  /** Label for the action button — "Pay Now", "Top Up", "Order Now". */
  cta: string;
  destination: string;
  /** Always the studentSeasonId for every current attention type. */
  navigationId: number;
  /** Overdue reads as danger; the rest as a warning. */
  severity: "danger" | "warning";
}

const CTA: Record<string, string> = {
  InstallmentOverdue: "Pay Now",
  InstallmentDueToday: "Pay Now",
  WalletEmpty: "Top Up",
  MealNotOrdered: "Order Now",
};

function toAttentionItem(dto: AttentionItemDto, index: number): AttentionItem {
  return {
    // Installments can repeat the same type, so the index is part of the key.
    id: `${dto.type}-${dto.installment?.installmentNumber ?? index}`,
    type: dto.type,
    title: dto.title ?? "",
    subtitle: dto.subtitle ?? "",
    cta: CTA[dto.type] ?? "Open",
    destination: dto.navigation?.destination ?? "",
    navigationId: dto.navigation?.id ?? 0,
    severity: dto.type === "InstallmentOverdue" ? "danger" : "warning",
  };
}

export interface NeedsAttention {
  items: AttentionItem[];
  /**
   * True when a section failed. With no items this is the difference between
   * "all caught up" and "we couldn't check" — the guide is explicit that the
   * second must not be shown as the first.
   */
  isPartial: boolean;
  failedSections: string[];
}

export function selectNeedsAttention(dto: NeedsAttentionDto): NeedsAttention {
  return {
    items: (dto.items ?? []).map(toAttentionItem),
    isPartial: !!dto.isPartial,
    failedSections: dto.failedSections ?? [],
  };
}

// ─── Latest activities ───────────────────────────────────────────────────────

/** Homework submission state, for the status line on a homework row. */
export type HomeworkState = "notSubmitted" | "submitted" | "graded" | null;

export interface LatestActivity {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  /** "24/10/2026 · 10:30" */
  when: string;
  destination: string;
  navigationId: number;
  homeworkState: HomeworkState;
  /** "Graded · 18" / "Submitted — pending grading" / "Not submitted". */
  statusLabel: string;
}

function homeworkState(dto: LatestActivityDto): HomeworkState {
  const hw = dto.homework;
  if (!hw) return null;
  if (hw.isGraded) return "graded";
  return hw.isSubmitted ? "submitted" : "notSubmitted";
}

function homeworkStatusLabel(dto: LatestActivityDto): string {
  const hw = dto.homework;
  if (!hw) return "";
  if (hw.isGraded) {
    // score can still be null on a graded submission.
    return hw.score === null ? "Graded" : `Graded · ${hw.score}`;
  }
  return hw.isSubmitted ? "Submitted — pending grading" : "Not submitted";
}

export function toLatestActivity(dto: LatestActivityDto): LatestActivity {
  const date = formatDate(dto.date);
  const time = formatTime(dto.date);

  return {
    // referenceId repeats across sources, so the type is part of the key.
    id: `${dto.type}-${dto.referenceId}`,
    type: dto.type,
    title: dto.title ?? "",
    subtitle: dto.subtitle ?? "",
    when: [date, time].filter(Boolean).join(" · "),
    destination: dto.navigation?.destination ?? "",
    navigationId: dto.navigation?.id ?? 0,
    homeworkState: homeworkState(dto),
    statusLabel: homeworkStatusLabel(dto),
  };
}

/**
 * `select` for the latest query. The order is the server's — newest first
 * across sources — and is preserved rather than re-sorted.
 */
export function selectLatestActivities(
  dto: LatestActivitiesDto,
): LatestActivity[] {
  return (dto.activities ?? []).map(toLatestActivity);
}
