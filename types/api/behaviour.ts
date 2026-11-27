import type { IsoDateTime } from "./common";

/**
 * Behaviour + house points — `GET /api/mobile/students/{studentSeasonId}/behaviour`
 * and `/api/mobile/settings/behaviour-notifications`.
 *
 * Contract: WebApp/docs/product/2026-11-27-behaviour-mobile-api.md (backend
 * repo). Names, reasons and milestones come back in the request's
 * `Accept-Language`.
 */

/** `kind` on a history row: 1 merit (green +N), 2 demerit (red -N). */
export const BehaviourKind = {
  Merit: 1,
  Demerit: 2,
} as const;

export type BehaviourKind = (typeof BehaviourKind)[keyof typeof BehaviourKind];

/** Where the entry came from: 1 web, 2 mobile, 3 an administrative-form incident. */
export const BehaviourSource = {
  Web: 1,
  Mobile: 2,
  Incident: 3,
} as const;

export type BehaviourSource =
  (typeof BehaviourSource)[keyof typeof BehaviourSource];

/** The child's house. `null` on the summary when the school has none. */
export interface BehaviourHouseDto {
  id: number;
  name: string | null;
  /** "#1565C0" */
  colour: string | null;
  /** Site-relative ("/uploads/houses/ab12.png") — join to the host. */
  logoUrl: string | null;
  /** 1-based position among `houseCount` houses. */
  rank: number | null;
  houseCount: number | null;
  points: number | null;
}

export interface BehaviourItemDto {
  id: number;
  kind: BehaviourKind | number;
  /** Always positive. */
  points: number;
  /** Already ± by kind. */
  signed: number;
  reason: string | null;
  category: string | null;
  /** Font Awesome name ("star", "thumbs-up", "clock-o"…). */
  icon: string | null;
  note: string | null;
  date: IsoDateTime | null;
  createdAt: IsoDateTime | null;
  awardedBy: string | null;
  houseName: string | null;
  houseColour: string | null;
  source: BehaviourSource | number | null;
  incidentId: number | null;
}

export interface BehaviourCertificateDto {
  id: number;
  name: string | null;
  threshold: number;
  awardedAt: IsoDateTime | null;
  /** Opens through the reports file endpoint. Null until the PDF is made. */
  studentReportId: number | null;
  colour: string | null;
}

export interface BehaviourMilestoneDto {
  name: string | null;
  threshold: number;
  remaining: number;
}

/**
 * Totals and certificates cover the whole academic year; `from`/`to` filter
 * only `items`, which are paged.
 */
export interface StudentBehaviourDto {
  studentId: number;
  studentSeasonId: number;
  studentName: string | null;
  className: string | null;
  meritPoints: number;
  demeritPoints: number;
  net: number;
  meritCount: number;
  demeritCount: number;
  house: BehaviourHouseDto | null;
  items: BehaviourItemDto[] | null;
  totalItems: number;
  page: number;
  pageSize: number;
  certificates: BehaviourCertificateDto[] | null;
  /** Null when every milestone has been reached. */
  nextMilestone: BehaviourMilestoneDto | null;
}

export interface StudentBehaviourParams {
  /** yyyy-MM-dd */
  from?: string;
  /** yyyy-MM-dd */
  to?: string;
  page?: number;
  pageSize?: number;
}

/** Which behaviour pushes a parent gets. Escalations are always sent. */
export type BehaviourNotificationMode = "All" | "PositiveOnly" | "None";

/** GET / PUT /api/mobile/settings/behaviour-notifications */
export interface BehaviourNotificationSettingDto {
  mode: BehaviourNotificationMode;
}
