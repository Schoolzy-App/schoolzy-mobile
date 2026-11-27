import type {
  BehaviourNotificationMode,
  BehaviourNotificationSettingDto,
  StudentBehaviourDto,
  StudentBehaviourParams,
} from "@/types/api";
import { acceptLanguageHeader } from "@/utils/language";

import { request } from "./client";
import { ROUTES } from "./config";

export const BEHAVIOUR_PAGE_SIZE = 20;

export const behaviourApi = {
  /**
   * GET /api/mobile/students/{studentSeasonId}/behaviour
   *
   * Totals, house and certificates are for the whole year; `from`/`to` and
   * paging apply to `items` only. 403/404 when the season isn't the
   * caller's child.
   */
  student(
    studentSeasonId: number,
    params: StudentBehaviourParams = {},
  ): Promise<StudentBehaviourDto> {
    return request<StudentBehaviourDto>({
      method: "GET",
      url: ROUTES.students.behaviour(studentSeasonId),
      params: { page: 1, pageSize: BEHAVIOUR_PAGE_SIZE, ...params },
      headers: acceptLanguageHeader(),
    });
  },

  /** GET /api/mobile/settings/behaviour-notifications */
  notificationSetting(): Promise<BehaviourNotificationSettingDto> {
    return request<BehaviourNotificationSettingDto>({
      method: "GET",
      url: ROUTES.settings.behaviourNotifications,
    });
  },

  /** PUT /api/mobile/settings/behaviour-notifications — anything else is a 400. */
  saveNotificationSetting(
    mode: BehaviourNotificationMode,
  ): Promise<BehaviourNotificationSettingDto> {
    return request<BehaviourNotificationSettingDto>({
      method: "PUT",
      url: ROUTES.settings.behaviourNotifications,
      data: { mode },
    });
  },
};
