import type { NotificationData } from "@/components/NotificationItem";
import type { NotificationDto } from "@/types/api";
import { formatDate } from "@/utils/format";

/**
 * The area a notification points at.
 *
 * This used to be parsed out of `actionUrl` ("/Parent/DocumentRequest/Detail/37"),
 * which also yielded the entity id. That field has been removed from the
 * payload, so the label is all that is left: `id` is always null now, and the
 * app can open a *section* but not a specific record.
 */
export interface NotificationTarget {
  /** Section, derived from `typeLabel`, e.g. "DocumentRequest". */
  section: string;
  /**
   * Always null. Kept so the destination resolver keeps working for pushes,
   * which still carry a `referenceId`.
   */
  id: number | null;
}

/**
 * `typeLabel` is the only routing signal the inbox has left. It is a plain
 * label and may be absent, so the resolver matches it loosely.
 */
export function toNotificationTarget(
  typeLabel?: string | null,
): NotificationTarget | null {
  const section = typeLabel?.trim();
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
    target: toNotificationTarget(dto.typeLabel),
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
