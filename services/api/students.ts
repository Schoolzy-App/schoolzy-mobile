import type {
  StudentListItemDto,
  StudentProfileDto,
  StudentReportsDto,
} from "@/types/api";

import { request } from "./client";
import { ROUTES } from "./config";

export const studentsApi = {
  /** GET /api/mobile/students — the signed-in parent's children. */
  list(): Promise<StudentListItemDto[]> {
    return request<StudentListItemDto[]>({
      method: "GET",
      url: ROUTES.students.list,
    });
  },

  /** GET /api/mobile/students/{studentSeasonId}/profile */
  profile(studentSeasonId: number): Promise<StudentProfileDto> {
    return request<StudentProfileDto>({
      method: "GET",
      url: ROUTES.students.profile(studentSeasonId),
    });
  },

  /** GET /api/mobile/students/{studentSeasonId}/reports */
  reports(studentSeasonId: number): Promise<StudentReportsDto> {
    return request<StudentReportsDto>({
      method: "GET",
      url: ROUTES.students.reports(studentSeasonId),
    });
  },
};
