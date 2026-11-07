import type {
  GateRequestDetailDto,
  GateRequestListDto,
  GateRequestListItemDto,
} from "@/types/api";
import { GatePickupMethod, GateRequestStatusCode } from "@/types/api";

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
  /** Parent or relative display name; null when the creator has none (row hidden). */
  requestedByName: string | null;
  /** When staff confirmed pickup; null until then. */
  collectedAt: Date | null;
}

export type GatePickupMethodName = "otp" | "manual";

export interface GateActiveOtp {
  code: string;
  /**
   * Expiry on the phone's clock: server expiry shifted by the server/phone
   * clock difference at fetch time, so a wrong phone clock can't skew it.
   */
  expiresAt: Date;
}

export interface GateRequestDetail extends GateRequest {
  notes: string | null;
  confirmedAt: Date | null;
  cancelledAt: Date | null;
  canCancel: boolean;
  pickupOtpEnabled: boolean;
  canGenerateOtp: boolean;
  otpGenerationsLeft: number;
  otpDailyLimit: number;
  activeOtp: GateActiveOtp | null;
  collectedMethod: GatePickupMethodName | null;
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
    case GateRequestStatusCode.Pending:
      return "pending";
    default:
      // Unknown future status: neutral, never an actionable "pending".
      return "expired";
  }
}

/**
 * Server lookups arrive as enum names ("SickLeave", "EarlyCheckout"). Split them
 * into words for display; names that already contain spaces pass through.
 */
export function humanizeLabel(name: string): string {
  if (!name || /\s/.test(name)) return name ?? "";
  return name
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .trim();
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
    typeName: humanizeLabel(dto.typeName),
    collectPersonName: dto.collectPersonName,
    time: dto.time ?? null,
    status: toStatus(dto.status),
    createdAt: parseUtc(dto.createdAtUtc),
    requestedByName: dto.requestedByName ?? null,
    collectedAt: parseUtcOrNull(dto.collectedAtUtc),
  };
}

/** Maps a server code (detail `activeOtp` or the POST /otp response). */
export function toGateActiveOtp(
  dto: { code: string; expiresAtUtc: string; serverTimeUtc: string } | null | undefined,
  now: Date = new Date(),
): GateActiveOtp | null {
  if (!dto?.code) return null;
  const remainingMs =
    parseUtc(dto.expiresAtUtc).getTime() - parseUtc(dto.serverTimeUtc).getTime();
  return { code: dto.code, expiresAt: new Date(now.getTime() + remainingMs) };
}

function toPickupMethod(code: number | null | undefined): GatePickupMethodName | null {
  if (code === GatePickupMethod.Otp) return "otp";
  if (code === GatePickupMethod.Manual) return "manual";
  return null;
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
    pickupOtpEnabled: !!dto.pickupOtpEnabled,
    canGenerateOtp: !!dto.canGenerateOtp,
    otpGenerationsLeft: dto.otpGenerationsLeft ?? 0,
    otpDailyLimit: dto.otpDailyLimit ?? 3,
    activeOtp: toGateActiveOtp(dto.activeOtp),
    collectedMethod: toPickupMethod(dto.collectedMethod),
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
