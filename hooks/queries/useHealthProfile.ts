import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { healthProfileApi } from "@/services/api";
import {
  selectHealthProfileEdit,
  selectHealthProfileSummary,
  toSaveRequest,
} from "@/services/mappers";
import type {
  HealthProfileData,
  HealthProfileSummary,
} from "@/services/mappers";
import type {
  DeleteHealthAttachmentInput,
  HealthProfileEditDto,
  HealthProfileOverviewDto,
  UploadHealthAttachmentInput,
} from "@/types/api";

import { queryKeys } from "./queryKeys";

/** GET /api/mobile/health-profile/{id} — read-only wellness overview. */
export function useHealthProfile(studentSeasonId?: number) {
  return useQuery<HealthProfileOverviewDto, Error, HealthProfileSummary>({
    queryKey: queryKeys.healthProfile.overview(studentSeasonId ?? 0),
    queryFn: () => healthProfileApi.overview(studentSeasonId as number),
    select: selectHealthProfileSummary,
    enabled: typeof studentSeasonId === "number",
  });
}

/** GET /api/mobile/health-profile/{id}/edit — the editable payload. */
export function useHealthProfileEdit(studentSeasonId?: number) {
  return useQuery<HealthProfileEditDto, Error, HealthProfileData>({
    queryKey: queryKeys.healthProfile.edit(studentSeasonId ?? 0),
    queryFn: () => healthProfileApi.editData(studentSeasonId as number),
    select: selectHealthProfileEdit,
    enabled: typeof studentSeasonId === "number",
  });
}

/**
 * PUT /api/mobile/health-profile/{id}
 * Upsert of the whole profile — the mutation takes the full UI state and
 * converts it to the server payload.
 */
export function useSaveHealthProfile(studentSeasonId?: number) {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, HealthProfileData>({
    mutationFn: (data) =>
      healthProfileApi.save(studentSeasonId as number, toSaveRequest(data)),
    onSuccess: () => {
      // Both the overview and the edit copy are now stale.
      queryClient.invalidateQueries({ queryKey: queryKeys.healthProfile.all });
      // The student profile surfaces a "health updated" card.
      queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
    },
  });
}

/** POST /api/mobile/health-profile/{id}/attachments */
export function useUploadHealthAttachments() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, UploadHealthAttachmentInput>({
    mutationFn: (input) => healthProfileApi.uploadAttachments(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.healthProfile.all });
    },
  });
}

/** DELETE /api/mobile/health-profile/{id}/attachments/{attachmentId} */
export function useDeleteHealthAttachment() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, DeleteHealthAttachmentInput>({
    mutationFn: (input) => healthProfileApi.deleteAttachment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.healthProfile.all });
    },
  });
}
