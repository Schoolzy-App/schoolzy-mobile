import type { IsoDateTime, UploadFile } from "./common";

/**
 * ⚠️ The Swagger spec declares these enums as bare integers (`[1,2,3,4,5,6]`)
 * with no member names, so the labels below are inferred from the surrounding
 * DTO fields (assignedDate / rejectionReason / completedDate) and MUST be
 * confirmed against the backend.
 *
 * For anything user-facing, prefer the server-provided `statusDisplay` string
 * over mapping these numbers yourself — it is already localized upstream.
 */
/**
 * ⚠️ INFERRED AND KNOWN WRONG from `Completed` onward. Observed against the live
 * API: a request labelled "Completed" carries the value below for `Rejected`,
 * and "Rejected" carries the one for `Cancelled`.
 *
 * Mapping therefore goes through `statusDisplay` first — see `toUiStatus` in
 * `services/mappers/documentRequests.ts`. Replace these with the real values
 * once the backend confirms them, and the text matching becomes belt-and-braces.
 */
export const DocumentRequestStatus = {
  Pending: 1,
  Assigned: 2,
  InProgress: 3,
  Completed: 4,
  Rejected: 5,
  Cancelled: 6,
} as const;

export type DocumentRequestStatus =
  (typeof DocumentRequestStatus)[keyof typeof DocumentRequestStatus];

/** ⚠️ Inferred member names — confirm with the backend. */
export const DocumentRequestFileUploadedBy = {
  Parent: 1,
  Coordinator: 2,
  System: 3,
} as const;

export type DocumentRequestFileUploadedBy =
  (typeof DocumentRequestFileUploadedBy)[keyof typeof DocumentRequestFileUploadedBy];

/** A document type the parent can request. */
export interface DocumentRequestTypeOptionDto {
  id: number;
  name: string | null;
  description: string | null;
}

/** A student the request can be filed against. */
export interface DocumentRequestStudentOptionDto {
  studentSeasonId: number;
  studentName: string | null;
}

/** GET /api/mobile/document-requests/create-options */
export interface DocumentRequestCreateOptionsDto {
  documentTypes: DocumentRequestTypeOptionDto[] | null;
  students: DocumentRequestStudentOptionDto[] | null;
}

/** Item in GET /api/mobile/document-requests */
export interface MobileDocumentRequestListItemDto {
  id: number;
  documentTypeName: string | null;
  studentName: string | null;
  status: DocumentRequestStatus;
  statusDisplay: string | null;
  createdDateTime: IsoDateTime | null;
  completedDate: IsoDateTime | null;
  filesCount: number;
}

/** File attached to a document request. */
export interface MobileDocumentRequestFileDto {
  id: number;
  fileName: string | null;
  contentType: string | null;
  uploadedByName: string | null;
  uploadedByRole: DocumentRequestFileUploadedBy;
  uploadedAt: IsoDateTime | null;
}

/** GET /api/mobile/document-requests/{id} */
export interface MobileDocumentRequestDetailDto {
  id: number;
  documentTypeName: string | null;
  studentName: string | null;
  notes: string | null;
  status: DocumentRequestStatus;
  statusDisplay: string | null;
  assignedCoordinatorName: string | null;
  assignedDate: IsoDateTime | null;
  coordinatorNotes: string | null;
  rejectionReason: string | null;
  completedDate: IsoDateTime | null;
  createdDateTime: IsoDateTime | null;
  files: MobileDocumentRequestFileDto[] | null;
}

/** POST /api/mobile/document-requests — response payload. */
export interface CreateDocumentRequestResponseDto {
  documentRequestId: number;
}

/**
 * POST /api/mobile/document-requests — multipart body.
 * Field names are PascalCase to match the server's form binding exactly.
 */
export interface CreateDocumentRequestInput {
  documentRequestTypeId: number;
  studentSeasonId: number;
  /** Max length 2000 per the spec. */
  notes?: string;
  files?: UploadFile[];
}

/** POST /api/mobile/document-requests/{requestId}/files — multipart body. */
export interface UploadDocumentRequestFileInput {
  requestId: number;
  file: UploadFile;
}
