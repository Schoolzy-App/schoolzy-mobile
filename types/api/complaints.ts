import type { UploadFile } from "@/services/api/multipart";

/**
 * Mobile Complaints API — `/api/mobile/complaints`.
 *
 * The list and detail payloads carry both the numeric enum and a `*Display`
 * string for category, priority and status. The guide is explicit that the
 * display strings are what should be shown and the numbers what logic should
 * branch on, so the DTOs keep both.
 */

// ─── Lookups ────────────────────────────────────────────────────────────────

/** Shared shape of the four lookup endpoints. */
export interface ComplaintLookupDto {
  id: number;
  name: string | null;
}

/** GET /api/mobile/complaints/students */
export interface ComplaintStudentDto {
  studentSeasonId: number;
  studentName: string | null;
}

/**
 * Category, priority and contact method all come from lookup endpoints, so
 * these constants exist only for the few places that need a known value —
 * never to build a picker, which must use the endpoint.
 */
export const ComplaintContactMethod = {
  Phone: 1,
  Email: 2,
  Meeting: 3,
} as const;

export type ComplaintContactMethod =
  (typeof ComplaintContactMethod)[keyof typeof ComplaintContactMethod];

/**
 * Unlike category/priority/status, the detail payload has no
 * `preferredContactMethodDisplay`, so this is the one enum the client has to
 * name itself.
 */
export const CONTACT_METHOD_LABEL: Record<number, string> = {
  1: "Phone",
  2: "Email",
  3: "Meeting",
};

// ─── Status ─────────────────────────────────────────────────────────────────

/**
 * Six states. `statusDisplay` is what gets shown; this drives grouping and
 * the accent colour.
 */
export const ComplaintStatus = {
  Submitted: 1,
  UnderReview: 2,
  InProgress: 3,
  Resolved: 4,
  Closed: 5,
  Rejected: 6,
} as const;

export type ComplaintStatus =
  (typeof ComplaintStatus)[keyof typeof ComplaintStatus];

// ─── List ───────────────────────────────────────────────────────────────────

/** Item in GET /api/mobile/complaints */
export interface MobileComplaintListItemDto {
  id: number;
  title: string | null;
  category: number;
  categoryDisplay: string | null;
  priority: number;
  priorityDisplay: string | null;
  status: ComplaintStatus | number;
  statusDisplay: string | null;
  studentName: string | null;
  /** Date-only, e.g. "2026-10-03". */
  createdDate: string | null;
  followUpDate: string | null;
  assignedCoordinatorName: string | null;
}

/**
 * GET /api/mobile/complaints?pageNumber=&pageSize=
 *
 * ⚠️ The guide documents the query parameters but never shows the envelope's
 * `data` for the list, so whether it is a bare array or a page object is
 * unknown. Both are accepted and normalized by `toComplaintPage` — the sibling
 * notifications endpoint returns a bare array, while payments returns a page
 * object, so either is plausible here.
 */
export type ComplaintListResponseDto =
  | MobileComplaintListItemDto[]
  | {
      items?: MobileComplaintListItemDto[] | null;
      data?: MobileComplaintListItemDto[] | null;
      pageNumber?: number;
      pageSize?: number;
      totalPages?: number;
      totalCount?: number;
    };

/** Normalized page, whichever shape the server actually sends. */
export interface ComplaintPage {
  items: MobileComplaintListItemDto[];
  pageNumber: number;
  /** True when another page is worth requesting. */
  hasMore: boolean;
}

// ─── Detail ─────────────────────────────────────────────────────────────────

/** GET /api/mobile/complaints/{id} */
export interface MobileComplaintDetailDto {
  id: number;
  title: string | null;
  description: string | null;
  category: number;
  categoryDisplay: string | null;
  priority: number;
  priorityDisplay: string | null;
  status: ComplaintStatus | number;
  statusDisplay: string | null;
  studentName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  preferredContactMethod: number;
  preferredContactTime: string | null;
  createdDate: string | null;
  assignedCoordinatorName: string | null;
  assignedDate: string | null;
  coordinatorNotes: string | null;
  resolution: string | null;
  followUpDate: string | null;
  resolvedDate: string | null;
  rejectionReason: string | null;
  /** Check before offering the attachment action — the endpoint 404s otherwise. */
  hasAttachment: boolean;
  attachmentFileName: string | null;
  hasResponseAttachment: boolean;
  responseAttachmentFileName: string | null;
}

// ─── Create ─────────────────────────────────────────────────────────────────

/**
 * POST /api/mobile/complaints — multipart body.
 *
 * `title` and `description` are nullable in the server DTO but the service
 * treats them as required, so they are required here: a complaint that fails
 * server-side validation is worse than one the form refuses to submit.
 */
export interface CreateComplaintInput {
  studentSeasonId?: number;
  title: string;
  description: string;
  category: number;
  priority: number;
  contactPhone?: string;
  contactEmail?: string;
  preferredContactMethod: number;
  preferredContactTime?: string;
  attachment?: UploadFile;
}

/** `data` is the new complaint's id. */
export type CreateComplaintResponseDto = number;
