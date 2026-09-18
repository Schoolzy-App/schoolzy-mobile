import { useQuery } from "@tanstack/react-query";

import { homeApi, newslettersApi } from "@/services/api";
import { selectNewsletters } from "@/services/mappers";
import type { NewsletterListItem } from "@/services/mappers";
import type { NewsletterDto } from "@/types/api";

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
