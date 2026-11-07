import type {
  ParentDashboardDto,
  QuickActionDto,
  QuickActionsSectionDto,
  SaveQuickActionsInput,
} from "@/types/api";

import { request } from "./client";
import { ROUTES } from "./config";

export const parentDashboardApi = {
  /**
   * GET /api/v1/parent/dashboard
   *
   * `date` is optional and only shifts the Today/At-a-Glance window; it is
   * left off so the server decides the school-local day rather than the
   * device clock.
   */
  dashboard(date?: string): Promise<ParentDashboardDto> {
    return request<ParentDashboardDto>({
      method: "GET",
      url: ROUTES.parentDashboard.root,
      params: date ? { date } : undefined,
    });
  },

  /** GET /api/v1/parent/dashboard/quick-actions */
  quickActions(): Promise<QuickActionsSectionDto> {
    return request<QuickActionsSectionDto>({
      method: "GET",
      url: ROUTES.parentDashboard.quickActions,
    });
  },

  /** GET /api/v1/parent/dashboard/quick-actions/catalog */
  quickActionsCatalog(): Promise<QuickActionDto[]> {
    return request<QuickActionDto[]>({
      method: "GET",
      url: ROUTES.parentDashboard.quickActionsCatalog,
    });
  },

  /**
   * PUT /api/v1/parent/dashboard/quick-actions
   *
   * Max 6. Sending an empty list restores the defaults. Relatives get 403 —
   * only parents may customise.
   */
  saveQuickActions(
    input: SaveQuickActionsInput,
  ): Promise<QuickActionsSectionDto> {
    return request<QuickActionsSectionDto>({
      method: "PUT",
      url: ROUTES.parentDashboard.quickActions,
      data: input,
    });
  },

  /** DELETE /api/v1/parent/dashboard/quick-actions — back to defaults. */
  resetQuickActions(): Promise<QuickActionsSectionDto> {
    return request<QuickActionsSectionDto>({
      method: "DELETE",
      url: ROUTES.parentDashboard.quickActions,
    });
  },
};
