import type { MobileDocumentRequestListItemDto } from "@/types/api";
import { DocumentRequestStatus } from "@/types/api";
import type { Request, RequestStatus } from "@/types/request";
import { formatDate } from "@/utils/format";

/**
 * Collapses the API's six-state lifecycle into the four the UI groups by.
 * ⚠️ Depends on the inferred enum names — see `types/api/documentRequests.ts`.
 */
function toUiStatus(status: DocumentRequestStatus): RequestStatus {
  switch (status) {
    case DocumentRequestStatus.Completed:
      return "accepted";
    case DocumentRequestStatus.Rejected:
      return "rejected";
    case DocumentRequestStatus.Cancelled:
      return "cancelled";
    default:
      // Pending / Assigned / InProgress all read as "pending" to the parent.
      return "pending";
  }
}

export function toRequest(dto: MobileDocumentRequestListItemDto): Request {
  const status = toUiStatus(dto.status);
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
  accepted: Request[];
  pending: Request[];
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
    accepted: all.filter((r) => r.status === "accepted"),
    pending: all.filter((r) => r.status === "pending"),
    closed: all.filter(
      (r) => r.status === "rejected" || r.status === "cancelled",
    ),
  };
}
