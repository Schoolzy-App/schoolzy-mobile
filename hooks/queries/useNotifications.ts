import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { notificationsApi } from "@/services/api";
import {
  selectNotifications,
  selectRecentNotifications,
} from "@/services/mappers";
import type { NotificationListItem } from "@/services/mappers";
import type { NotificationDto, UnreadCountResponse } from "@/types/api";
import { parseUnreadCount } from "@/types/api";

import { queryKeys } from "./queryKeys";

/**
 * GET /api/mobile/notifications?pageNumber=N
 *
 * The response carries no pagination metadata, so paging works by requesting
 * the next page until one comes back short — an infinite query models that
 * better than a page counter.
 */
const PAGE_SIZE = 20;

export function useNotifications(enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: ({ pageParam }) =>
      notificationsApi.list({ pageNumber: pageParam, pageSize: PAGE_SIZE }),
    initialPageParam: 1,
    // A short page means there is nothing left to fetch.
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length + 1,
    select: (data) => selectNotifications(data.pages.flat()),
    // An inbox is expected to be current: always re-check on mount rather than
    // serving the global 60s-stale cache.
    staleTime: 0,
    refetchOnMount: "always",
    enabled,
  });
}

/** GET /api/mobile/notifications/recent */
export function useRecentNotifications(enabled = true) {
  return useQuery<NotificationDto[], Error, NotificationListItem[]>({
    queryKey: queryKeys.notifications.recent(),
    queryFn: () => notificationsApi.recent(),
    select: selectRecentNotifications,
    staleTime: 0,
    refetchOnMount: "always",
    enabled,
  });
}

/**
 * GET /api/mobile/notifications/unread-count — drives the bell badge.
 * Kept fresh on a short stale time so the badge reacts to a push arriving.
 */
export function useUnreadNotificationCount(enabled = true) {
  return useQuery<UnreadCountResponse, Error, number>({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationsApi.unreadCount(),
    select: parseUnreadCount,
    // The badge must react quickly to a push arriving.
    staleTime: 0,
    refetchOnMount: "always",
    enabled,
  });
}

/**
 * PUT /api/mobile/notifications/{id}/read
 *
 * Optimistic: the row loses its unread dot and the badge decrements straight
 * away, then rolls back if the request fails.
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, number, { previousCount?: number }>({
    mutationFn: (notificationId) => notificationsApi.markRead(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.all,
      });

      const previousCount = parseUnreadCount(
        queryClient.getQueryData<UnreadCountResponse>(
          queryKeys.notifications.unreadCount(),
        ),
      );

      queryClient.setQueryData<UnreadCountResponse>(
        queryKeys.notifications.unreadCount(),
        Math.max(0, previousCount - 1),
      );

      // Flip the row itself so the dot disappears without waiting for a
      // refetch. Handles both the infinite list (pages) and the flat `recent`.
      const markRead = (n: NotificationDto) =>
        n.id === notificationId ? { ...n, isRead: true } : n;

      queryClient.setQueriesData<
        NotificationDto[] | { pages: NotificationDto[][]; pageParams: unknown[] }
      >({ queryKey: queryKeys.notifications.all }, (old) => {
        if (!old) return old;
        if (Array.isArray(old)) return old.map(markRead);
        if ("pages" in old) {
          return {
            ...old,
            pages: old.pages.map((page) => page.map(markRead)),
          };
        }
        return old;
      });

      return { previousCount };
    },
    onError: (_error, _id, context) => {
      if (context?.previousCount != null) {
        queryClient.setQueryData<UnreadCountResponse>(
          queryKeys.notifications.unreadCount(),
          context.previousCount,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

/** PUT /api/mobile/notifications/read-all */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, void>({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.setQueryData<UnreadCountResponse>(
        queryKeys.notifications.unreadCount(),
        0,
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
