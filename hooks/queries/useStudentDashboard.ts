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
  StudentFinancialSummaryDto,
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

/**
 * GET /api/mobile/students/{id}/dashboard/financial-summary
 *
 * Not cached across visits, for the same reason as needs-attention: it
 * should reflect a payment the parent just made.
 */
export function useStudentFinancialSummary(
  studentSeasonId?: number,
  enabled = true,
) {
  return useQuery<StudentFinancialSummaryDto>({
    queryKey: queryKeys.dashboard.financialSummary(studentSeasonId ?? 0),
    queryFn: () =>
      studentsApi.dashboardFinancialSummary(studentSeasonId as number),
    staleTime: 0,
    enabled: enabled && typeof studentSeasonId === "number",
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
