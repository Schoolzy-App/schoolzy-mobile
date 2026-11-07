import { useInfiniteQuery } from "@tanstack/react-query";

import { studentsApi } from "@/services/api";
import { selectStudentReports } from "@/services/mappers";
import type { StudentReports } from "@/services/mappers";
import type { StudentReportsDto } from "@/types/api";

import { queryKeys } from "./queryKeys";

const PAGE_SIZE = 50;

/**
 * GET /api/mobile/students/{studentSeasonId}/reports
 *
 * Paginated by the server's flat `items`; each category chip is its own list
 * (`category` filters items, while `counts` always cover every category).
 */
export function useStudentReports(studentSeasonId?: number, category?: number) {
  return useInfiniteQuery<
    StudentReportsDto,
    Error,
    StudentReports,
    ReturnType<typeof queryKeys.students.reports>,
    number
  >({
    queryKey: queryKeys.students.reports(studentSeasonId ?? 0, category),
    queryFn: ({ pageParam }) =>
      studentsApi.reports(studentSeasonId as number, {
        category,
        page: pageParam,
        pageSize: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((n, p) => n + (p.items?.length ?? 0), 0);
      return last.total != null && loaded < last.total
        ? (last.page ?? pages.length) + 1
        : undefined;
    },
    select: selectStudentReports,
    // Switching chips keeps the previous list until the new one arrives.
    placeholderData: (previous) => previous,
    enabled: typeof studentSeasonId === "number",
  });
}
