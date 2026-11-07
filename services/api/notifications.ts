import type {
  NotificationDto,
  NotificationListParams,
  RegisterDeviceRequestDto,
  UnreadCountResponse,
} from "@/types/api";

import { request } from "./client";
import { ROUTES } from "./config";

export const notificationsApi = {
  /** POST /api/mobile/notifications/devices — register/refresh an FCM token. */
  registerDevice(body: RegisterDeviceRequestDto): Promise<unknown> {
    return request<unknown>({
      method: "POST",
      url: ROUTES.notifications.devices,
      data: body,
    });
  },

  /** DELETE /api/mobile/notifications/devices?deviceToken=… */
  unregisterDevice(deviceToken: string): Promise<unknown> {
    return request<unknown>({
      method: "DELETE",
      url: ROUTES.notifications.devices,
      params: { deviceToken },
    });
  },

  // ── Inbox ───────────────────────────────────────────────────────────────

  /** GET /api/mobile/notifications?pageNumber=1 — flat array, no page meta. */
  list(params: NotificationListParams = {}): Promise<NotificationDto[]> {
    return request<NotificationDto[]>({
      method: "GET",
      url: ROUTES.notifications.list,
      params: { pageNumber: params.pageNumber ?? 1, pageSize: params.pageSize },
    });
  },

  /** GET /api/mobile/notifications/recent — short list for the home surface. */
  recent(): Promise<NotificationDto[]> {
    return request<NotificationDto[]>({
      method: "GET",
      url: ROUTES.notifications.recent,
    });
  },

  /** GET /api/mobile/notifications/unread-count — drives the bell badge. */
  unreadCount(): Promise<UnreadCountResponse> {
    return request<UnreadCountResponse>({
      method: "GET",
      url: ROUTES.notifications.unreadCount,
    });
  },

  /** PUT /api/mobile/notifications/{notificationId}/read */
  markRead(notificationId: number): Promise<unknown> {
    return request<unknown>({
      method: "PUT",
      url: ROUTES.notifications.markRead(notificationId),
      // The route returned 411 (Length Required) to a bodyless PUT on dev, so
      // an explicit empty body is sent to guarantee a Content-Length header.
      data: {},
    });
  },

  /** PUT /api/mobile/notifications/read-all */
  markAllRead(): Promise<unknown> {
    return request<unknown>({
      method: "PUT",
      url: ROUTES.notifications.markAllRead,
      data: {},
    });
  },
};
