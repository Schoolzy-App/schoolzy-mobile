import type { IsoDateTime } from "./common";

/** Attendance summary shown alongside the agenda. */
export interface AgendaAttendanceDto {
  status: string | null;
  yearAttendancePercentage: number;
}

/**
 * A single agenda entry. The API returns a loose `type` discriminator as a
 * string (e.g. homework vs exam) and leaves the type-specific fields null for
 * the entries they don't apply to.
 */
export interface AgendaItemDto {
  id: number;
  type: string | null;
  title: string | null;
  subjectName: string | null;
  startDate: IsoDateTime | null;
  endDate: IsoDateTime | null;
  isCompleted: boolean | null;
  homeworkSource: string | null;
  examType: string | null;
  examStatus: string | null;
}

/** GET /api/mobile/students/{studentSeasonId}/agenda */
export interface AgendaDto {
  studentSeasonId: number;
  studentName: string | null;
  date: IsoDateTime;
  attendance: AgendaAttendanceDto;
  items: AgendaItemDto[] | null;
}

/** Query parameters for the agenda endpoint. */
export interface AgendaParams {
  /** Day to fetch. Serialized as an ISO date-time string. */
  date?: Date | string;
}
