// ─── Request status ─────────────────────────────────────────────────────────
/**
 * UI-level status. The API models six states (see `DocumentRequestStatus`);
 * they collapse to these four for display purposes.
 *
 * `completed`, `rejected` and `cancelled` are all terminal — the screen shows
 * them together under "Closed".
 */
export type RequestStatus = "pending" | "completed" | "rejected" | "cancelled";

// ─── Request instance — represents a submitted document request ─────────────
export interface Request {
  /** String id for list keys. */
  id: string;
  /** Numeric API id — used for detail fetches and file uploads. */
  requestId: number;
  /** Display label of the document type. */
  documentLabel: string;
  /** Full student name the request is for. */
  studentName: string;
  /** Collapsed status used for grouping and accent color. */
  status: RequestStatus;
  /**
   * Server-provided status text. Preferred over mapping the numeric status
   * ourselves — it is already localized upstream.
   */
  statusLabel: string;
  /** Display-friendly submission date (e.g. "23/10/2026"). */
  createdAt: string;
  /** Number of files attached to the request. */
  filesCount: number;
}
