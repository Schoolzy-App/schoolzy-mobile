/**
 * Mobile Gate Requests API — `/api/mobile/gate-requests`.
 *
 * Shapes follow the server as built (Task 5 report, "API contract as built"):
 * camelCase, enums as numbers, timestamps as ISO UTC strings.
 */

/** BusHoldingStatus */
export const GateRequestStatusCode = {
  Pending: 1,
  Confirmed: 2,
  CancelledByParent: 3,
  CancelledBySchool: 4,
  Expired: 5,
} as const;

/** HoldingType */
export const GateHoldingType = {
  EarlyCheckout: 1,
  SickLeave: 2,
  Other: 3,
} as const;

/** Who collects. On create, anything outside 1-3 is a 400. */
export const GateCollectPerson = {
  Father: 1,
  Mother: 2,
  Relative: 3,
} as const;

/** GET /eligibility */
export interface GateEligibilityDto {
  canUse: boolean;
}

/** GET /students, and `siblings` of /create-options. */
export interface GateStudentDto {
  studentSeasonId: number;
  name: string;
  className: string | null;
  hasRequestToday: boolean;
}

export interface GateLookupDto {
  id: number;
  name: string;
}

export interface GatePermittedRelativeDto {
  studentRelativeId: number;
  name: string;
  relativeTypeName: string | null;
}

/** GET /create-options?studentSeasonId= */
export interface GateCreateOptionsDto {
  siblings: GateStudentDto[];
  holdingTypes: GateLookupDto[];
  collectPersonTypes: GateLookupDto[];
  permittedRelatives: GatePermittedRelativeDto[];
  fatherName: string | null;
  motherName: string | null;
}

/** Item of GET /. */
export interface GateRequestListItemDto {
  id: number;
  studentSeasonId: number;
  studentName: string;
  type: number;
  typeName: string;
  collectPerson: number;
  collectPersonName: string;
  /** "HH:mm" */
  time: string | null;
  status: number;
  statusName: string;
  createdAtUtc: string;
  /** Login username or email of the creator, not a display name. */
  requestedByName: string | null;
}

/** GET /?pageNumber=&pageSize= */
export interface GateRequestListDto {
  items: GateRequestListItemDto[];
  totalCount: number;
}

/** GET /{id}, and the body of POST /{id}/cancel. */
export interface GateRequestDetailDto extends GateRequestListItemDto {
  notes: string | null;
  confirmedAtUtc: string | null;
  cancelledAtUtc: string | null;
  canCancel: boolean;
}

/** POST / */
export interface CreateGateRequestInput {
  studentSeasonIds: number[];
  type: number;
  collectPerson: number;
  studentRelativeId: number | null;
  /** "HH:mm" */
  time: string;
  notes: string | null;
}

/** POST / → ids created, one per student. */
export type CreateGateRequestResponseDto = number[];
