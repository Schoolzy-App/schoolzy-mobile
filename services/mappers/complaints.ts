import type {
  ComplaintLookupDto,
  ComplaintPage,
  ComplaintStudentDto,
  MobileComplaintDetailDto,
  MobileComplaintListItemDto,
} from "@/types/api";
import { CONTACT_METHOD_LABEL, ComplaintStatus } from "@/types/api";
import type { DefaultInputOption } from "@/components/ui";
import { formatDate } from "@/utils/format";

/**
 * `GET /api/mobile/complaints` → UI.
 *
 * The server sends `categoryDisplay` / `priorityDisplay` / `statusDisplay`
 * alongside the numeric enums, and the guide asks the client to show those
 * rather than mapping names itself. That is what happens here — the numbers
 * are used only for grouping and colour.
 */

/** Terminal vs still-being-worked-on, for the two list sections. */
export type ComplaintState = "open" | "closed";

/**
 * Collapsed status driving the accent colour. Six server states map onto four
 * tones so a complaint reads the same way a request does.
 */
export type ComplaintTone = "submitted" | "active" | "resolved" | "rejected";

function toTone(status: number): ComplaintTone {
  switch (status) {
    case ComplaintStatus.Resolved:
    case ComplaintStatus.Closed:
      return "resolved";
    case ComplaintStatus.Rejected:
      return "rejected";
    case ComplaintStatus.UnderReview:
    case ComplaintStatus.InProgress:
      return "active";
    default:
      return "submitted";
  }
}

function toState(status: number): ComplaintState {
  return status === ComplaintStatus.Resolved ||
    status === ComplaintStatus.Closed ||
    status === ComplaintStatus.Rejected
    ? "closed"
    : "open";
}

/**
 * The server's "display" strings are really enum names — "UnderReview" rather
 * than "Under Review". They are still the source of truth for the wording, so
 * they are shown as sent, just split at the capitals so a parent can read
 * them. Anything already spaced passes through untouched.
 */
export function humanizeStatus(display?: string | null): string {
  const text = display?.trim() ?? "";
  if (!text || text.includes(" ")) return text;
  return text.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

/** A complaint row, ready for the list. */
export interface Complaint {
  id: string;
  complaintId: number;
  title: string;
  /** "Transportation · High" — the two display strings the card leads with. */
  meta: string;
  categoryLabel: string;
  priorityLabel: string;
  statusLabel: string;
  tone: ComplaintTone;
  state: ComplaintState;
  studentName: string;
  createdAt: string;
  followUpAt: string;
  coordinatorName: string;
}

export function toComplaint(dto: MobileComplaintListItemDto): Complaint {
  const categoryLabel = dto.categoryDisplay ?? "";
  const priorityLabel = dto.priorityDisplay ?? "";

  return {
    id: String(dto.id),
    complaintId: dto.id,
    title: dto.title ?? "Complaint",
    meta: [categoryLabel, priorityLabel].filter(Boolean).join(" · "),
    categoryLabel,
    priorityLabel,
    statusLabel: humanizeStatus(dto.statusDisplay),
    tone: toTone(dto.status),
    state: toState(dto.status),
    studentName: dto.studentName ?? "",
    createdAt: formatDate(dto.createdDate),
    followUpAt: formatDate(dto.followUpDate),
    coordinatorName: dto.assignedCoordinatorName ?? "",
  };
}

/** Complaints split into the two sections the screen renders. */
export interface GroupedComplaints {
  all: Complaint[];
  open: Complaint[];
  /** Resolved, closed and rejected. */
  closed: Complaint[];
}

/**
 * `select` for the paged list query — flattens every loaded page and groups
 * once, so the screen never re-filters on render.
 */
export function selectGroupedComplaints(data: {
  pages: ComplaintPage[];
}): GroupedComplaints {
  const all = data.pages.flatMap((page) => page.items.map(toComplaint));
  return {
    all,
    open: all.filter((c) => c.state === "open"),
    closed: all.filter((c) => c.state === "closed"),
  };
}

// ─── Detail ──────────────────────────────────────────────────────────────────

/** One downloadable file on a complaint. */
export interface ComplaintAttachment {
  name: string;
  /** Drives the viewer's renderer; guessed from the file name. */
  kind: "pdf" | "image";
  /** Whose file it is — the parent's submission or the school's reply. */
  source: "complaint" | "response";
}

export interface ComplaintDetail {
  complaintId: number;
  title: string;
  description: string;
  categoryLabel: string;
  priorityLabel: string;
  statusLabel: string;
  tone: ComplaintTone;
  studentName: string;
  contactPhone: string;
  contactEmail: string;
  /** Resolved locally — the detail payload has no display string for it. */
  contactMethodLabel: string;
  contactTime: string;
  createdAt: string;
  coordinatorName: string;
  assignedAt: string;
  coordinatorNotes: string;
  resolution: string;
  followUpAt: string;
  resolvedAt: string;
  rejectionReason: string;
  attachments: ComplaintAttachment[];
}

/** Only PDFs go to the PDF renderer; everything else is treated as an image. */
function fileKind(name?: string | null): "pdf" | "image" {
  return /\.pdf$/i.test(name ?? "") ? "pdf" : "image";
}

export function selectComplaintDetail(
  dto: MobileComplaintDetailDto,
): ComplaintDetail {
  const attachments: ComplaintAttachment[] = [];

  // Guarded on the flags: the endpoints 404 when there is no file, and a
  // "View attachment" row that always fails is worse than no row.
  if (dto.hasAttachment) {
    attachments.push({
      name: dto.attachmentFileName || "Attachment",
      kind: fileKind(dto.attachmentFileName),
      source: "complaint",
    });
  }
  if (dto.hasResponseAttachment) {
    attachments.push({
      name: dto.responseAttachmentFileName || "School response",
      kind: fileKind(dto.responseAttachmentFileName),
      source: "response",
    });
  }

  return {
    complaintId: dto.id,
    title: dto.title ?? "Complaint",
    description: dto.description ?? "",
    categoryLabel: dto.categoryDisplay ?? "",
    priorityLabel: dto.priorityDisplay ?? "",
    statusLabel: humanizeStatus(dto.statusDisplay),
    tone: toTone(dto.status),
    studentName: dto.studentName ?? "",
    contactPhone: dto.contactPhone ?? "",
    contactEmail: dto.contactEmail ?? "",
    contactMethodLabel: CONTACT_METHOD_LABEL[dto.preferredContactMethod] ?? "",
    contactTime: dto.preferredContactTime ?? "",
    createdAt: formatDate(dto.createdDate),
    coordinatorName: dto.assignedCoordinatorName ?? "",
    assignedAt: formatDate(dto.assignedDate),
    coordinatorNotes: dto.coordinatorNotes ?? "",
    resolution: dto.resolution ?? "",
    followUpAt: formatDate(dto.followUpDate),
    resolvedAt: formatDate(dto.resolvedDate),
    rejectionReason: dto.rejectionReason ?? "",
    attachments,
  };
}

// ─── Lookups ─────────────────────────────────────────────────────────────────

/** Lookup rows → dropdown options, for the create form. */
export function selectLookupOptions(
  data: ComplaintLookupDto[],
): DefaultInputOption[] {
  return data.map((item) => ({
    label: item.name ?? `#${item.id}`,
    value: String(item.id),
  }));
}

export function selectStudentOptions(
  data: ComplaintStudentDto[],
): DefaultInputOption[] {
  return data.map((student) => ({
    label: student.studentName ?? "",
    value: String(student.studentSeasonId),
  }));
}
