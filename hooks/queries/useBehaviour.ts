import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { behaviourApi, BEHAVIOUR_PAGE_SIZE } from "@/services/api";
import { nextBehaviourPage, selectStudentBehaviour } from "@/services/mappers";
import type { StudentBehaviour } from "@/services/mappers";
import type {
  BehaviourNotificationMode,
  BehaviourNotificationSettingDto,
  StudentBehaviourDto,
} from "@/types/api";

import { queryKeys } from "./queryKeys";

/**
 * GET /api/mobile/students/{studentSeasonId}/behaviour
 *
 * Paged by `items`; the totals, house and certificates come from the first
 * page and cover the whole year.
 */
export function useStudentBehaviour(studentSeasonId?: number) {
  return useInfiniteQuery<
    StudentBehaviourDto,
    Error,
    StudentBehaviour,
    ReturnType<typeof queryKeys.students.behaviour>,
    number
  >({
    queryKey: queryKeys.students.behaviour(studentSeasonId ?? 0),
    queryFn: ({ pageParam }) =>
      behaviourApi.student(studentSeasonId as number, {
        page: pageParam,
        pageSize: BEHAVIOUR_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: nextBehaviourPage,
    select: selectStudentBehaviour,
    enabled: typeof studentSeasonId === "number",
  });
}

/** GET /api/mobile/settings/behaviour-notifications */
export function useBehaviourNotificationSetting(enabled = true) {
  return useQuery<BehaviourNotificationSettingDto, Error, BehaviourNotificationMode>({
    queryKey: queryKeys.settings.behaviourNotifications(),
    queryFn: () => behaviourApi.notificationSetting(),
    select: (dto) => dto.mode,
    enabled,
  });
}

/**
 * PUT /api/mobile/settings/behaviour-notifications
 *
 * Optimistic: the segmented control moves at once and snaps back if the
 * save fails.
 */
export function useSaveBehaviourNotificationSetting() {
  const queryClient = useQueryClient();
  const key = queryKeys.settings.behaviourNotifications();

  return useMutation<
    BehaviourNotificationSettingDto,
    Error,
    BehaviourNotificationMode,
    { previous?: BehaviourNotificationSettingDto }
  >({
    mutationFn: (mode) => behaviourApi.saveNotificationSetting(mode),
    onMutate: async (mode) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous =
        queryClient.getQueryData<BehaviourNotificationSettingDto>(key);
      queryClient.setQueryData<BehaviourNotificationSettingDto>(key, { mode });
      return { previous };
    },
    onError: (_error, _mode, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(key, saved);
    },
  });
}
