import { useQuery } from "@tanstack/react-query";

import { timetableApi } from "@/services/api";
import { selectDailyTimetable } from "@/services/mappers";
import type { DailyTimetable } from "@/services/mappers";
import type { DailyTimetableDto } from "@/types/api";
import { toApiDate } from "@/utils/format";

import { queryKeys } from "./queryKeys";

/**
 * GET /api/mobile/timetable?studentSeasonId=&date=
 *
 * Cached per (student, day). The previous day stays on screen while the next
 * loads so the list doesn't flash empty when scrubbing the calendar.
 */
export function useTimetable(studentSeasonId?: number, date?: Date) {
  return useQuery<DailyTimetableDto, Error, DailyTimetable>({
    queryKey: queryKeys.timetable.byDate(
      studentSeasonId ?? 0,
      toApiDate(date),
    ),
    queryFn: () =>
      timetableApi.daily({ studentSeasonId: studentSeasonId as number, date }),
    select: selectDailyTimetable,
    placeholderData: (previous) => previous,
    enabled: typeof studentSeasonId === "number",
  });
}
