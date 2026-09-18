import { useQuery } from "@tanstack/react-query";

import { currentUserApi } from "@/services/api";
import { selectCurrentUser } from "@/services/mappers";
import type { CurrentUser } from "@/services/mappers";
import type { CurrentUserInfoDto } from "@/types/api";

import { queryKeys } from "./queryKeys";

/**
 * GET /api/v1/home/current-user
 *
 * The signed-in parent's own details. Changes rarely within a session, so it is
 * cached for the session rather than refetched per screen — Home and Account
 * both read it and should agree.
 */
export function useCurrentUser(enabled = true) {
  return useQuery<CurrentUserInfoDto, Error, CurrentUser>({
    queryKey: queryKeys.currentUser.all,
    queryFn: () => currentUserApi.get(),
    select: selectCurrentUser,
    staleTime: 10 * 60_000,
    enabled,
  });
}
