import type { IsoDateTime } from "./common";

/**
 * Student timetable DTOs — `GET /api/mobile/timetable`.
 *
 * Shapes follow the Student Timetable API guide. The response is enveloped
 * (`{ success, message, data }`); `request()` unwraps it, so these describe the
 * `data` payload.
 */

/** One lesson. `subjectName` and `teacherName` are nullable by contract. */
export interface TimetablePeriodDto {
  periodNumber: number;
  /** TimeSpan, e.g. "08:00:00". */
  startTime: string | null;
  endTime: string | null;
  /** Null when the period has no related subject. */
  subjectName: string | null;
  /** Null when no employee record could be resolved for the teacher. */
  teacherName: string | null;
}

/** GET /api/mobile/timetable?studentSeasonId=&date= */
export interface DailyTimetableDto {
  studentName: string | null;
  date: IsoDateTime | null;
  /** Day of week resolved by the backend, e.g. "Friday". */
  day: string | null;
  /**
   * Already ordered by periodNumber then startTime. An empty array is a valid
   * success — the day simply has no published timetable, not an error.
   */
  periods: TimetablePeriodDto[] | null;
}

/** Query parameters. Both are required by the API. */
export interface TimetableParams {
  studentSeasonId: number;
  /** Serialized as yyyy-mm-dd; the backend ignores any time portion. */
  date?: Date | string;
}
