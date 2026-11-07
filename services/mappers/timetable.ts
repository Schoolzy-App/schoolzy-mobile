import type { DailyTimetableDto, TimetablePeriodDto } from "@/types/api";

/**
 * `GET /api/mobile/timetable` → UI.
 *
 * Pure and module-scoped so it can be passed straight to a query's `select`.
 */

/** "08:00:00" → "08:00". Returns "" when the API sends nothing. */
const shortTime = (value?: string | null) => (value ?? "").slice(0, 5);

/** "08:00" + "08:45" → "45 min"; "" when either end is missing. */
function durationLabel(start: string, end: string): string {
  if (!start || !end) return "";

  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : NaN;
  };

  const minutes = toMinutes(end) - toMinutes(start);
  if (!Number.isFinite(minutes) || minutes <= 0) return "";

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  if (!rest) return hours === 1 ? "1 hour" : `${hours} hours`;
  return `${hours}h ${rest}m`;
}

export interface TimetableSlot {
  id: string;
  periodNumber: number;
  /** "08:00" */
  from: string;
  to: string;
  /** "45 min" / "1 hour"; "" when the times don't allow a duration. */
  duration: string;
  /** Falls back to the period number — `subjectName` is nullable by contract. */
  subject: string;
  /** "" when no employee record could be resolved. */
  teacher: string;
}

export interface DailyTimetable {
  studentName: string;
  /** "Friday", resolved by the backend — no client-side weekday maths. */
  day: string;
  slots: TimetableSlot[];
}

function toSlot(dto: TimetablePeriodDto): TimetableSlot {
  const from = shortTime(dto.startTime);
  const to = shortTime(dto.endTime);

  return {
    // periodNumber is unique within a day and is what the API orders by.
    id: `period-${dto.periodNumber}`,
    periodNumber: dto.periodNumber,
    from,
    to,
    duration: durationLabel(from, to),
    subject: dto.subjectName?.trim() || `Period ${dto.periodNumber}`,
    teacher: dto.teacherName?.trim() ?? "",
  };
}

/**
 * Periods arrive ordered by periodNumber then startTime, so they are not
 * re-sorted here.
 */
export function selectDailyTimetable(dto: DailyTimetableDto): DailyTimetable {
  return {
    studentName: dto.studentName ?? "",
    day: dto.day ?? "",
    slots: (dto.periods ?? []).map(toSlot),
  };
}
