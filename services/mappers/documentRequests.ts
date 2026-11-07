import type {
  MobileDocumentRequestDetailDto,
  MobileDocumentRequestListItemDto,
} from "@/types/api";
import { DocumentRequestStatus } from "@/types/api";
import type { Request, RequestStatus } from "@/types/request";
import { formatDate } from "@/utils/format";

/**
 * The server's own status text is the primary signal.
 *
 * ⚠️ The numeric enum in `types/api/documentRequests.ts` is INFERRED and proven
 * wrong: a request the API labels "Completed" arrives with the value we guessed
 * for Rejected, and "Rejected" with the one we guessed for Cancelled — so the
 * real values are shifted from `Completed` onward. That showed up as a
 * completed request rendering in red.
 *
 * `statusDisplay` is sent with every request and was correct in every case, so
 * it decides; the numbers are only a fallback. Substring matching keeps near
 * misses ("In Progress", "Declined") working.
 */
function fromStatusText(text?: string | null): RequestStatus | null {
  const t = text?.trim().toLowerCase() ?? "";
  if (!t) return null;

  if (t.includes("complet")) return "completed";
  if (t.includes("reject") || t.includes("declin")) return "rejected";
  if (t.includes("cancel")) return "cancelled";
  if (t.includes("pending") || t.includes("progress") || t.includes("assign")) {
    return "pending";
  }
  return null;
}

/** Fallback only — see the warning above. */
function fromStatusCode(status: DocumentRequestStatus): RequestStatus {
  switch (status) {
    case DocumentRequestStatus.Completed:
      return "completed";
    case DocumentRequestStatus.Rejected:
      return "rejected";
    case DocumentRequestStatus.Cancelled:
      return "cancelled";
    default:
      // Pending / Assigned / InProgress all read as "pending" to the parent.
      return "pending";
  }
}

function toUiStatus(dto: MobileDocumentRequestListItemDto): RequestStatus {
  return fromStatusText(dto.statusDisplay) ?? fromStatusCode(dto.status);
}

export function toRequest(dto: MobileDocumentRequestListItemDto): Request {
  const status = toUiStatus(dto);
  return {
    id: String(dto.id),
    requestId: dto.id,
    documentLabel: dto.documentTypeName ?? "",
    studentName: dto.studentName ?? "",
    status,
    statusLabel: dto.statusDisplay ?? status,
    createdAt: formatDate(dto.createdDateTime),
    filesCount: dto.filesCount,
  };
}

/** Requests pre-split into the groups the screen renders. */
export interface GroupedRequests {
  all: Request[];
  pending: Request[];
  /** Everything terminal: completed, rejected and cancelled. */
  closed: Request[];
}

/**
 * `select` for the document-requests query — grouping happens once inside the
 * cache transform rather than on every screen render.
 */
export function selectGroupedRequests(
  data: MobileDocumentRequestListItemDto[],
): GroupedRequests {
  const all = data.map(toRequest);
  return {
    all,
    pending: all.filter((r) => r.status === "pending"),
    // Completed sits here too — a finished request is closed, not actionable.
    // Cancelled stays included so those requests don't disappear entirely.
    closed: all.filter((r) => r.status !== "pending"),
  };
}

// ─── Detail ──────────────────────────────────────────────────────────────────

/** One file attached to a request, ready for the list and the viewer. */
export interface RequestFile {
  id: string;
  fileId: number;
  name: string;
  /** Who produced it — "Uploaded by Sara Ali · 03/10/2026". */
  meta: string;
  /** Drives the viewer's renderer; derived from contentType or the name. */
  kind: "pdf" | "image";
}

export interface RequestDetail {
  requestId: number;
  documentLabel: string;
  studentName: string;
  status: RequestStatus;
  statusLabel: string;
  createdAt: string;
  /** Notes the parent submitted with the request. "" when none. */
  notes: string;
  coordinatorName: string;
  assignedAt: string;
  coordinatorNotes: string;
  /** Only meaningful on a rejected request. */
  rejectionReason: string;
  completedAt: string;
  files: RequestFile[];
}

/** PDFs render in the PDF view; everything else is treated as an image. */
function fileKind(contentType?: string | null, name?: string | null): "pdf" | "image" {
  const type = contentType?.toLowerCase() ?? "";
  if (type.includes("pdf")) return "pdf";
  if (type.startsWith("image/")) return "image";
  return /\.pdf$/i.test(name ?? "") ? "pdf" : "image";
}

export function selectRequestDetail(
  dto: MobileDocumentRequestDetailDto,
): RequestDetail {
  const status =
    fromStatusText(dto.statusDisplay) ?? fromStatusCode(dto.status);

  return {
    requestId: dto.id,
    documentLabel: dto.documentTypeName ?? "",
    studentName: dto.studentName ?? "",
    status,
    statusLabel: dto.statusDisplay ?? status,
    createdAt: formatDate(dto.createdDateTime),
    notes: dto.notes ?? "",
    coordinatorName: dto.assignedCoordinatorName ?? "",
    assignedAt: formatDate(dto.assignedDate),
    coordinatorNotes: dto.coordinatorNotes ?? "",
    rejectionReason: dto.rejectionReason ?? "",
    completedAt: formatDate(dto.completedDate),
    files: (dto.files ?? []).map((f) => ({
      id: String(f.id),
      fileId: f.id,
      name: f.fileName ?? "Document",
      meta: [
        f.uploadedByName ? `Uploaded by ${f.uploadedByName}` : null,
        formatDate(f.uploadedAt) || null,
      ]
        .filter(Boolean)
        .join(" · "),
      kind: fileKind(f.contentType, f.fileName),
    })),
  };
}
