import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { parentDashboardApi } from "@/services/api";
import { selectParentDashboard, selectQuickActions } from "@/services/mappers";
import type { ParentDashboard, QuickAction } from "@/services/mappers";
import type {
  ParentDashboardDto,
  QuickActionDto,
  QuickActionsSectionDto,
  SaveQuickActionsInput,
} from "@/types/api";

import { queryKeys } from "./queryKeys";

/**
 * GET /api/v1/parent/dashboard — the whole Home screen.
 *
 * Deliberately one query rather than a per-section fan-out: the server
 * assembles it in a single response, and splitting it would multiply requests
 * without making any section arrive sooner.
 */
export function useParentDashboard(date?: string) {
  return useQuery<ParentDashboardDto, Error, ParentDashboard>({
    queryKey: queryKeys.parentDashboard.root(date),
    queryFn: () => parentDashboardApi.dashboard(date),
    select: selectParentDashboard,
    // Attention, today and wallet balances all go stale quickly.
    staleTime: 0,
  });
}

/** GET /quick-actions — only needed by the customise sheet. */
export function useQuickActions(enabled = true) {
  return useQuery<QuickActionsSectionDto, Error, QuickAction[]>({
    queryKey: queryKeys.parentDashboard.quickActions(),
    queryFn: () => parentDashboardApi.quickActions(),
    select: selectQuickActions,
    enabled,
  });
}

/** GET /quick-actions/catalog — everything the account may add. */
export function useQuickActionsCatalog(enabled = true) {
  return useQuery<QuickActionDto[], Error, QuickAction[]>({
    queryKey: queryKeys.parentDashboard.catalog(),
    queryFn: () => parentDashboardApi.quickActionsCatalog(),
    select: (data) => selectQuickActions({ items: data }),
    staleTime: 5 * 60_000,
    enabled,
  });
}

/**
 * PUT /quick-actions. Invalidates the dashboard too — the saved list is
 * embedded there, so leaving it would show the old shortcuts on Home.
 */
export function useSaveQuickActions() {
  const queryClient = useQueryClient();

  return useMutation<QuickActionsSectionDto, Error, SaveQuickActionsInput>({
    mutationFn: (input) => parentDashboardApi.saveQuickActions(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.parentDashboard.all,
      });
    },
  });
}

/** DELETE /quick-actions — restore the defaults. */
export function useResetQuickActions() {
  const queryClient = useQueryClient();

  return useMutation<QuickActionsSectionDto, Error, void>({
    mutationFn: () => parentDashboardApi.resetQuickActions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.parentDashboard.all,
      });
    },
  });
}
