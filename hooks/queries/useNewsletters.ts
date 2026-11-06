import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { homeApi, newslettersApi } from "@/services/api";
import { selectNewsletterDetail, selectNewsletters } from "@/services/mappers";
import type { NewsletterDetail, NewsletterListItem } from "@/services/mappers";
import type {
  NewsletterDetailDto,
  NewsletterDto,
  NewsletterItemSource,
} from "@/types/api";

import { queryKeys } from "./queryKeys";

/** GET /api/mobile/newsletters */
export function useNewsletters(enabled = true) {
  return useQuery<NewsletterDto[], Error, NewsletterListItem[]>({
    queryKey: queryKeys.newsletters.list(),
    queryFn: () => newslettersApi.list(),
    select: selectNewsletters,
    enabled,
  });
}

/**
 * GET /api/mobile/newsletters/{source}/{id}
 *
 * The server marks the item read when this loads, so the list and the Home
 * dashboard (which show unread state) are refreshed once it arrives.
 */
export function useNewsletterDetail(source: NewsletterItemSource, id: number) {
  const queryClient = useQueryClient();
  const query = useQuery<NewsletterDetailDto, Error, NewsletterDetail>({
    queryKey: queryKeys.newsletters.detail(source, id),
    queryFn: () => newslettersApi.detail(source, id),
    select: selectNewsletterDetail,
  });

  const loaded = query.isSuccess;
  useEffect(() => {
    if (!loaded) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.newsletters.list() });
    queryClient.invalidateQueries({ queryKey: queryKeys.parentDashboard.all });
  }, [loaded, queryClient]);

  return query;
}

/**
 * GET /api/v1/home
 *
 * ⚠️ Untyped: the Swagger spec documents no response schema for this endpoint.
 * Pass an explicit type argument once the shape is known:
 * `useHome<HomeDto>()`.
 */
export function useHome<T = unknown>(enabled = true) {
  return useQuery<T>({
    queryKey: queryKeys.home.all,
    queryFn: () => homeApi.get<T>(),
    enabled,
  });
}
