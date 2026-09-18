import type { AgendaDto, AgendaParams } from "@/types/api";

import { toApiDate } from "@/utils/format";

import { request } from "./client";
import { ROUTES } from "./config";

export const agendaApi = {
  /**
   * GET /api/mobile/students/{studentSeasonId}/agenda
   * `date` selects the day to fetch; omitted, the server decides (today).
   */
  get(studentSeasonId: number, params?: AgendaParams): Promise<AgendaDto> {
    // Local calendar date — toISOString() would shift the day backwards in
    // any timezone ahead of UTC.
    const date = toApiDate(params?.date);

    return request<AgendaDto>({
      method: "GET",
      url: ROUTES.students.agenda(studentSeasonId),
      params: date ? { date } : undefined,
    });
  },
};
