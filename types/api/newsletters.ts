import type { IsoDateTime } from "./common";

/** Student a newsletter was addressed to. */
export interface NewsletterStudentDto {
  studentSeasonId: number;
  studentId: number;
  studentName: string | null;
}

/** Item in GET /api/mobile/newsletters */
export interface NewsletterDto {
  id: number;
  name: string | null;
  date: IsoDateTime;
  description: string | null;
  /**
   * Absolute or relative URL to the newsletter file, when the API supplies one.
   * When null, fall back to `GET /api/mobile/newsletters/{id}/file`
   * (see `newslettersApi.getFileUrl`).
   */
  fileUrl: string | null;
  students: NewsletterStudentDto[] | null;
}
