import type { IsoDateTime } from "./common";

/**
 * Push-notification device registration — `/api/mobile/notifications/devices`.
 *
 * Verified live on dev (2026-09-12): POST and DELETE both return 401 rather
 * than 404. Registration failures are still swallowed by design (see
 * `services/notifications/register.ts`) so a transient failure can never block
 * login or logout.
 */

/** `deviceType` on the registration payload. */
export const DeviceType = {
  Android: 1,
  iOS: 2,
} as const;

export type DeviceType = (typeof DeviceType)[keyof typeof DeviceType];

/** POST /api/mobile/notifications/devices */
export interface RegisterDeviceRequestDto {
  /** FCM registration token. */
  deviceToken: string;
  deviceType: DeviceType;
  /** Stable per-install identifier. */
  deviceId?: string;
  /** Human-readable device name, e.g. "iPhone 15 Pro". */
  deviceName?: string;
}

/**
 * Payload delivered with a push message.
 * The notification half (`title`/`body`) is rendered by the OS; `data` is what
 * the app reads to decide where to navigate.
 */
export interface PushNotificationData {
  /** Domain the notification refers to, e.g. "agenda" / "payment". */
  type?: string;
  /** Id of the referenced entity within that domain. */
  referenceId?: string;
}

/** A received message, normalized across foreground/background/quit delivery. */
export interface PushMessage {
  title: string | null;
  body: string | null;
  data: PushNotificationData;
}

// ─── Notification inbox ──────────────────────────────────────────────────────

/**
 * `type` is an int enum. Only these have been observed on dev; the numbering
 * suggests 1–4 exist for other domains, and 8–9 are still unknown.
 *
 * ⚠️ This is now the ONLY routing signal. `actionUrl` used to carry a web
 * route and was preferred because it was more reliable — notification 456 was
 * labelled "General" while its URL pointed at a complaint. That field has been
 * removed from the payload, so mis-labelled rows now route by their label or
 * not at all. Mismatches are no longer recoverable on the client.
 */
export const NotificationType = {
  General: 5,
  DocumentRequest: 6,
  Complaint: 7,
  MonthlyExamReport: 10,
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

/**
 * GET /api/mobile/notifications?pageNumber=1
 *
 * Confirmed on dev (2026-09-14). `data` is a FLAT ARRAY — the response carries
 * no pagination metadata (no totalCount/totalPages), so "load more" works by
 * requesting the next page until one comes back empty.
 */
export interface NotificationDto {
  id: number;
  title: string | null;
  body: string | null;
  type: NotificationType | number;
  /**
   * Human label for `type`, e.g. "DocumentRequest" / "MonthlyExamReport".
   *
   * With `actionUrl` gone this drives navigation alongside `type`. The inbox
   * payload has no `referenceId`, so a row can identify a *section* but never
   * a specific entity — see `resolveTargetDestination`.
   */
  typeLabel: string | null;
  isRead: boolean;
  sentAt: IsoDateTime | null;
  /** Server-rendered relative time, e.g. "22h ago" / "Aug 30". */
  timeAgo: string | null;
}

/**
 * GET /api/mobile/notifications/unread-count
 *
 * ⚠️ The response body was never documented, and the sibling list endpoint puts
 * a bare array in `data` — so this may equally be a raw number. Both shapes are
 * accepted; `parseUnreadCount` normalizes them.
 */
export type UnreadCountResponse =
  | number
  | {
      count?: number;
      unreadCount?: number;
      unread?: number;
      total?: number;
    };

/** Tolerates a raw number or any of the usual wrapper key names. */
export function parseUnreadCount(data: unknown): number {
  if (typeof data === "number") return Number.isFinite(data) ? data : 0;
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    for (const key of ["count", "unreadCount", "unread", "total"]) {
      const value = record[key];
      if (typeof value === "number") return value;
    }
  }
  return 0;
}

/** Query parameters for the paged list. */
export interface NotificationListParams {
  pageNumber?: number;
  pageSize?: number;
}
