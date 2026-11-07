import type { AgendaDto, AgendaItemDto } from "@/types/api";
import { formatDate, formatTime } from "@/utils/format";

/**
 * The attendance status, normalized so the UI can colour it.
 *
 * The API sends a free-text status, so this is matched loosely and falls back
 * to "unknown" — which renders in the default text colour rather than guessing
 * at good or bad news.
 */
export type AttendanceState = "present" | "absent" | "late" | "unknown";

function toAttendanceState(status: string): AttendanceState {
  const s = status.trim().toLowerCase();
  if (!s) return "unknown";
  if (s.includes("absent")) return "absent";
  if (s.includes("late") || s.includes("delay")) return "late";
  if (s.includes("present") || s.includes("attend")) return "present";
  return "unknown";
}

/** One homework or exam on the selected day (Agenda spec §4). */
export interface AgendaEntry {
  id: string;
  kind: "homework" | "exam";
  title: string;
  /** "Maths · Due 28/10/2026" — the subject plus whatever the API knows. */
  subtitle: string;
}

export interface AgendaSummary {
  studentName: string;
  /** The server's own wording, shown as-is. */
  attendanceStatus: string;
  /** `attendanceStatus` reduced to something the UI can branch on. */
  attendanceState: AttendanceState;
  /** Year-level, not per selected day. */
  attendancePercentage: number;
  entries: AgendaEntry[];
  /** Marked days for the calendar strip — absences, when the API reports one. */
  isAbsent: boolean;
}

/**
 * The design's sub line is "{subject} · {teacher}" or "{subject} · Period n";
 * the API has neither teacher nor period, so the subject is paired with the
 * most useful thing it does have: done, due date, or start time.
 */
function toSubtitle(item: AgendaItemDto): string {
  const detail = item.isCompleted
    ? "Completed"
    : item.endDate
      ? `Due ${formatDate(item.endDate)}`
      : item.startDate
        ? formatTime(item.startDate)
        : (item.examType ?? "");
  return [item.subjectName?.trim(), detail].filter(Boolean).join(" · ");
}

export function selectAgenda(dto: AgendaDto): AgendaSummary {
  // Exams first, as the design recommends; the API's order otherwise.
  const entries = (dto.items ?? [])
    .map<AgendaEntry>((item) => ({
      id: String(item.id),
      kind: item.type?.toLowerCase().includes("exam") ? "exam" : "homework",
      title: item.title?.trim() || item.subjectName?.trim() || "",
      subtitle: toSubtitle(item),
    }))
    .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "exam" ? -1 : 1));

  const status = dto.attendance?.status ?? "";
  const state = toAttendanceState(status);

  return {
    studentName: dto.studentName ?? "",
    attendanceStatus: status,
    attendanceState: state,
    attendancePercentage: Math.round(
      dto.attendance?.yearAttendancePercentage ?? 0,
    ),
    entries,
    isAbsent: state === "absent",
  };
}
