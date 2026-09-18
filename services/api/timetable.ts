import type { DailyTimetableDto, TimetableParams } from "@/types/api";

import { toApiDate } from "@/utils/format";

import { request } from "./client";
import { ROUTES } from "./config";

export const timetableApi = {
  /**
   * GET /api/mobile/timetable?studentSeasonId=&date=
   *
   * `toApiDate` formats from the LOCAL calendar date. Using an ISO timestamp
   * here would shift the day backwards for anyone east of UTC — the same
   * off-by-one that affected the agenda.
   */
  daily({ studentSeasonId, date }: TimetableParams): Promise<DailyTimetableDto> {
    return request<DailyTimetableDto>({
      method: "GET",
      url: ROUTES.timetable,
      params: { studentSeasonId, date: toApiDate(date) },
    });
  },
};
