import { useQuery } from "@tanstack/react-query";

import { studentsApi } from "@/services/api";
import { selectStudentReports } from "@/services/mappers";
import type { StudentReports } from "@/services/mappers";
import type { StudentReportsDto } from "@/types/api";

import { queryKeys } from "./queryKeys";

/** GET /api/mobile/students/{studentSeasonId}/reports */
export function useStudentReports(studentSeasonId?: number) {
  return useQuery<StudentReportsDto, Error, StudentReports>({
    queryKey: queryKeys.students.reports(studentSeasonId ?? 0),
    queryFn: () => studentsApi.reports(studentSeasonId as number),
    select: selectStudentReports,
    enabled: typeof studentSeasonId === "number",
  });
}
