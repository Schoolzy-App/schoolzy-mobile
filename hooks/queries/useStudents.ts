import { useQuery } from "@tanstack/react-query";

import { selectChildren, selectStudentProfile } from "@/services/mappers";
import type { StudentProfileSummary } from "@/services/mappers";
import { studentsApi } from "@/services/api";
import type { StudentListItemDto, StudentProfileDto } from "@/types/api";
import type { ChildData } from "@/types/child";

import { queryKeys } from "./queryKeys";

/**
 * GET /api/mobile/students — the signed-in parent's children.
 *
 * The DTO → `ChildData` transform runs inside `select`, so it is memoized by
 * react-query and only recomputes when the cached payload actually changes —
 * not on every screen render.
 */
export function useStudents(enabled = true) {
  return useQuery<StudentListItemDto[], Error, ChildData[]>({
    queryKey: queryKeys.students.list(),
    queryFn: () => studentsApi.list(),
    select: selectChildren,
    enabled,
  });
}

/** Raw students list, for callers that need the API shape (ids, flags). */
export function useStudentsRaw(enabled = true) {
  return useQuery<StudentListItemDto[]>({
    queryKey: queryKeys.students.list(),
    queryFn: () => studentsApi.list(),
    enabled,
  });
}

/**
 * GET /api/mobile/students/{studentSeasonId}/profile
 * Skipped until a student id is available.
 */
export function useStudentProfile(studentSeasonId?: number) {
  return useQuery<StudentProfileDto, Error, StudentProfileSummary>({
    queryKey: queryKeys.students.profile(studentSeasonId ?? 0),
    queryFn: () => studentsApi.profile(studentSeasonId as number),
    select: selectStudentProfile,
    enabled: typeof studentSeasonId === "number",
  });
}
