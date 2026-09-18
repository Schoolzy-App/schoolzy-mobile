import type { IsoDateTime } from "./common";

/** Item in GET /api/mobile/students */
export interface StudentListItemDto {
  studentSeasonId: number;
  name: string | null;
  stageName: string | null;
  gradeName: string | null;
  className: string | null;
  hasBus: boolean;
  /**
   * ⚠️ Present on the profile endpoint; not yet confirmed on the list. Optional
   * so the list keeps working either way — when absent the avatar falls back.
   */
  gender?: string | null;
}

/** Latest health-profile touch point. */
export interface StudentHealthUpdateDto {
  updatedAt: IsoDateTime | null;
}

/** Most recent clinic visit. */
export interface StudentClinicUpdateDto {
  date: IsoDateTime;
  diagnosis: string | null;
}

/** Most recently assigned homework. */
export interface StudentLatestHomeworkDto {
  title: string | null;
  subjectName: string | null;
  endDate: IsoDateTime | null;
  createdAt: IsoDateTime | null;
}

/** Next payment falling due. */
export interface StudentUpcomingPaymentDto {
  installmentNumber: number;
  dueDate: IsoDateTime;
  outstandingAmount: number;
  isOverdue: boolean;
}

/** Roll-up of the four "latest" cards shown on the student profile. */
export interface StudentLatestUpdatesDto {
  health: StudentHealthUpdateDto;
  clinic: StudentClinicUpdateDto;
  homework: StudentLatestHomeworkDto;
  payment: StudentUpcomingPaymentDto;
}

/** GET /api/mobile/students/{studentSeasonId}/profile */
export interface StudentProfileDto {
  studentSeasonId: number;
  studentName: string | null;
  /** "Male" / "Female" — confirmed on dev (2026-09-14). */
  gender: string | null;
  stageName: string | null;
  gradeName: string | null;
  className: string | null;
  healthProfileId: number | null;
  latest: StudentLatestUpdatesDto;
}
