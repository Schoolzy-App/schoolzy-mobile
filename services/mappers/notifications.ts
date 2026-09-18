import type { NotificationData } from "@/components/NotificationItem";
import type { NotificationDto } from "@/types/api";
import { formatDate } from "@/utils/format";

/**
 * The entity a notification points at, parsed from its `actionUrl`.
 *
 * The inbox has no `referenceId` — it carries a web route such as
 * "/Parent/DocumentRequest/Detail/37". `typeLabel` is deliberately NOT used for
 * routing: notification 456 is labelled "General" while its actionUrl points at
 * a complaint, so the URL is the more reliable signal.
 */
export interface NotificationTarget {
  /** Section segment, e.g. "DocumentRequest" / "Complaints". */
  section: string;
  /** Trailing numeric id, when present. */
  id: number | null;
}

const ACTION_URL_RE = /\/Parent\/([^/]+)\/[^/]+\/(\d+)/i;

export function parseActionUrl(
  actionUrl?: string | null,
): NotificationTarget | null {
  if (!actionUrl) return null;

  const match = actionUrl.match(ACTION_URL_RE);
  if (match) return { section: match[1], id: Number(match[2]) };

  // Fall back to the section alone when the URL has no trailing id.
  const section = actionUrl.split("/").filter(Boolean)[1];
  return section ? { section, id: null } : null;
}

/** Row shape the screen renders, plus what tap-navigation needs. */
export interface NotificationListItem extends NotificationData {
  notificationId: number;
  /** Display label from the server, e.g. "DocumentRequest". */
  typeLabel: string;
  target: NotificationTarget | null;
}

export function toNotificationItem(dto: NotificationDto): NotificationListItem {
  return {
    id: String(dto.id),
    notificationId: dto.id,
    title: dto.title ?? "",
    description: dto.body ?? "",
    // The server renders relative time already ("22h ago" / "Aug 30"), which
    // keeps the app consistent with the web portal. Fall back to the date.
    time: dto.timeAgo ?? formatDate(dto.sentAt),
    unread: !dto.isRead,
    typeLabel: dto.typeLabel ?? "",
    target: parseActionUrl(dto.actionUrl),
  };
}

/** `select` for the list queries — the payload is a flat array. */
export function selectNotifications(
  data: NotificationDto[],
): NotificationListItem[] {
  return data.map(toNotificationItem);
}

/** `recent` returns the same shape. */
export const selectRecentNotifications = selectNotifications;
