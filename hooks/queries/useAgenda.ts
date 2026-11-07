import { useQuery } from "@tanstack/react-query";

import { agendaApi } from "@/services/api";
import { selectAgenda } from "@/services/mappers";
import type { AgendaSummary } from "@/services/mappers";
import type { AgendaDto } from "@/types/api";

import { queryKeys } from "./queryKeys";

/** yyyy-mm-dd in local time — used as the per-day cache key. */
function toDayKey(date?: Date): string | undefined {
  if (!date) return undefined;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * GET /api/mobile/students/{studentSeasonId}/agenda
 *
 * Cached per (student, day): moving through the week calendar fetches only
 * days not seen yet, and returns instantly when scrubbing back. `placeholderData`
 * keeps the previous day's content on screen while the next one loads, so the
 * list doesn't flash empty on every date tap.
 */
export function useAgenda(studentSeasonId?: number, date?: Date) {
  const dayKey = toDayKey(date);

  return useQuery<AgendaDto, Error, AgendaSummary>({
    queryKey: queryKeys.agenda.byDate(studentSeasonId ?? 0, dayKey),
    queryFn: () => agendaApi.get(studentSeasonId as number, { date }),
    select: selectAgenda,
    placeholderData: (previous) => previous,
    enabled: typeof studentSeasonId === "number",
  });
}
