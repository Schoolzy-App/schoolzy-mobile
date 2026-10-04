import type { IsoDateTime } from "./common";

/**
 * Where a newsletter-list item actually lives.
 *
 * The list is a union of two tables: real newsletters, and student reports
 * that have been published to parents. Their ids are allocated independently
 * and CAN COLLIDE, so `source` — never the id, and never the name — is what
 * identifies which table a row came from.
 */
export const NewsletterItemSource = {
  Newsletter: 1,
  StudentReport: 2,
} as const;

export type NewsletterItemSource =
  (typeof NewsletterItemSource)[keyof typeof NewsletterItemSource];

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
  /** Which table `id` refers to — required to build the file URL. */
  source: NewsletterItemSource;
  students: NewsletterStudentDto[] | null;
}
