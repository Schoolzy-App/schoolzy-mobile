import type {
  GateRequestDetailDto,
  GateRequestListDto,
  GateRequestListItemDto,
} from "@/types/api";
import { GateRequestStatusCode } from "@/types/api";

/** Gate request lifecycle, mapped from the server's `status` 1-5. */
export type GateRequestStatus =
  | "pending"
  | "confirmed"
  | "cancelledByParent"
  | "cancelledBySchool"
  | "expired";

export type GateStatusTone = "warning" | "success" | "neutral";

export interface GateRequest {
  id: number;
  studentSeasonId: number;
  studentName: string;
  typeName: string;
  collectPersonName: string;
  /** "HH:mm" */
  time: string | null;
  status: GateRequestStatus;
  createdAt: Date;
  /** Login username or email as received, not a display name. */
  requestedByName: string | null;
}

export interface GateRequestDetail extends GateRequest {
  notes: string | null;
  confirmedAt: Date | null;
  cancelledAt: Date | null;
  canCancel: boolean;
}

export interface GroupedGateRequests {
  today: GateRequest[];
  earlier: GateRequest[];
}

function toStatus(code: number): GateRequestStatus {
  switch (code) {
    case GateRequestStatusCode.Confirmed:
      return "confirmed";
    case GateRequestStatusCode.CancelledByParent:
      return "cancelledByParent";
    case GateRequestStatusCode.CancelledBySchool:
      return "cancelledBySchool";
    case GateRequestStatusCode.Expired:
      return "expired";
    default:
      return "pending";
  }
}

export function gateStatusTone(status: GateRequestStatus): GateStatusTone {
  if (status === "pending") return "warning";
  if (status === "confirmed") return "success";
  return "neutral";
}

export function gateStatusLabel(status: GateRequestStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "cancelledByParent":
      return "Cancelled by you";
    case "cancelledBySchool":
      return "Cancelled by school";
    case "expired":
      return "Expired";
  }
}

/** The server sends ISO UTC; tolerate a missing zone suffix by assuming UTC. */
function parseUtc(value: string): Date {
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(value);
  return new Date(hasZone ? value : `${value}Z`);
}

function parseUtcOrNull(value: string | null | undefined): Date | null {
  return value ? parseUtc(value) : null;
}

export function toGateRequest(dto: GateRequestListItemDto): GateRequest {
  return {
    id: dto.id,
    studentSeasonId: dto.studentSeasonId,
    studentName: dto.studentName,
    typeName: dto.typeName,
    collectPersonName: dto.collectPersonName,
    time: dto.time ?? null,
    status: toStatus(dto.status),
    createdAt: parseUtc(dto.createdAtUtc),
    requestedByName: dto.requestedByName ?? null,
  };
}

export function selectGateRequestDetail(
  dto: GateRequestDetailDto,
): GateRequestDetail {
  return {
    ...toGateRequest(dto),
    notes: dto.notes ?? null,
    confirmedAt: parseUtcOrNull(dto.confirmedAtUtc),
    cancelledAt: parseUtcOrNull(dto.cancelledAtUtc),
    canCancel: dto.canCancel,
  };
}

function sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Groups for display only. The server already limits and orders the list by
 * school day; the device-local date is used just to split today from earlier.
 */
export function selectGroupedGateRequests(
  dto: GateRequestListDto,
  now: Date = new Date(),
): GroupedGateRequests {
  const today: GateRequest[] = [];
  const earlier: GateRequest[] = [];
  for (const item of dto?.items ?? []) {
    const mapped = toGateRequest(item);
    (sameLocalDay(mapped.createdAt, now) ? today : earlier).push(mapped);
  }
  return { today, earlier };
}
