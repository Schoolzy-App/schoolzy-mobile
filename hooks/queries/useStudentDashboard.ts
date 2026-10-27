import { useQuery } from "@tanstack/react-query";

import { studentsApi } from "@/services/api";
import {
  selectLatestActivities,
  selectNeedsAttention,
  selectTodayTiles,
} from "@/services/mappers";
import type {
  LatestActivity,
  NeedsAttention,
  TodayTile,
} from "@/services/mappers";
import type {
  LatestActivitiesDto,
  NeedsAttentionDto,
  StudentTodayDto,
} from "@/types/api";

import { queryKeys } from "./queryKeys";

/**
 * The three dashboard sections of the student profile.
 *
 * Each is its own query rather than one combined request: they are separate
 * endpoints, they fail independently, and a profile that renders Today while
 * Needs Attention is still loading beats one that waits for both.
 *
 * Every key is scoped by `studentSeasonId`, so switching student refetches
 * rather than showing the previous child's summary — which the guide calls
 * out explicitly.
 */

/** GET /api/mobile/students/{id}/dashboard/today */
export function useStudentToday(studentSeasonId?: number) {
  return useQuery<
    StudentTodayDto,
    Error,
    { tiles: TodayTile[]; isPartial: boolean }
  >({
    queryKey: queryKeys.dashboard.today(studentSeasonId ?? 0),
    queryFn: () => studentsApi.dashboardToday(studentSeasonId as number),
    select: selectTodayTiles,
    enabled: typeof studentSeasonId === "number",
  });
}

/**
 * GET /api/mobile/students/{id}/dashboard/needs-attention
 *
 * Date-sensitive (due-today and today's meal order), and it should reflect a
 * payment or order the parent just made, so it is not cached across visits.
 */
export function useNeedsAttention(studentSeasonId?: number) {
  return useQuery<NeedsAttentionDto, Error, NeedsAttention>({
    queryKey: queryKeys.dashboard.needsAttention(studentSeasonId ?? 0),
    queryFn: () =>
      studentsApi.dashboardNeedsAttention(studentSeasonId as number),
    select: selectNeedsAttention,
    staleTime: 0,
    enabled: typeof studentSeasonId === "number",
  });
}

/** GET /api/mobile/students/{id}/dashboard/latest */
export function useLatestActivities(studentSeasonId?: number) {
  return useQuery<LatestActivitiesDto, Error, LatestActivity[]>({
    queryKey: queryKeys.dashboard.latest(studentSeasonId ?? 0),
    queryFn: () => studentsApi.dashboardLatest(studentSeasonId as number),
    select: selectLatestActivities,
    enabled: typeof studentSeasonId === "number",
  });
}
