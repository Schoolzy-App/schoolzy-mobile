import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { DefaultInputOption } from "@/components/ui";
import { parentProfileApi } from "@/services/api";
import {
  selectGuardianStudents,
  selectParentInfo,
  selectParentLookupOptions,
  selectRelativeDetail,
  selectRelatives,
} from "@/services/mappers";
import type {
  GuardianStudent,
  ParentInfo,
  Relative,
  RelativeDetail,
} from "@/services/mappers";
import type {
  LocalizedLookupDto,
  ParentInfoDto,
  RelativeDetailDto,
  RelativesResponseDto,
  SaveRelativeInput,
  SaveRelativeResponseDto,
  StudentGuardiansDto,
  ParentInfoSaveResultDto,
  UpdateParentInfoInput,
  UpdateRelativePermissionInput,
} from "@/types/api";

import { useIdempotentMutation } from "../useIdempotentMutation";
import { queryKeys } from "./queryKeys";

/** Lookups are near-static; no point refetching them per form open. */
const LOOKUP_STALE_TIME = 5 * 60_000;

// ─── Relatives ───────────────────────────────────────────────────────────────

/** GET /api/mobile/parent-profile/relatives */
export function useRelatives(enabled = true) {
  return useQuery<RelativesResponseDto, Error, Relative[]>({
    queryKey: queryKeys.parentProfile.relatives(),
    queryFn: () => parentProfileApi.relatives(),
    select: selectRelatives,
    enabled,
  });
}

/** GET /api/mobile/parent-profile/relatives/{relativeId} */
export function useRelative(relativeId?: number) {
  return useQuery<RelativeDetailDto, Error, RelativeDetail>({
    queryKey: queryKeys.parentProfile.relative(relativeId ?? 0),
    queryFn: () => parentProfileApi.relative(relativeId as number),
    select: selectRelativeDetail,
    enabled: typeof relativeId === "number",
  });
}

/**
 * POST /api/mobile/parent-profile/relatives
 *
 * Idempotent-mutation policy rather than a plain mutation: the guide requires
 * a unique key per save and the same key on retry. The client's automatic key
 * would be a fresh one each attempt, so a timeout could create the relative
 * twice.
 */
export function useSaveRelative(
  onSuccess?: (result: SaveRelativeResponseDto) => void,
) {
  const queryClient = useQueryClient();

  return useIdempotentMutation<SaveRelativeInput, SaveRelativeResponseDto>({
    operation: "ParentProfile.SaveRelative",
    mutationFn: (input, idempotencyKey) =>
      parentProfileApi.saveRelative(input, idempotencyKey),
    onSuccess: (result) => {
      // The save response carries no photo URL or relationship values, so the
      // list has to be refetched rather than patched from it.
      queryClient.invalidateQueries({
        queryKey: queryKeys.parentProfile.relatives(),
      });
      if (result?.relativeId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.parentProfile.relative(result.relativeId),
        });
      }
      onSuccess?.(result);
    },
  });
}

/** DELETE /api/mobile/parent-profile/relatives/{relativeId} */
export function useDeleteRelative() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, number>({
    mutationFn: (relativeId) => parentProfileApi.deleteRelative(relativeId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.parentProfile.relatives(),
      });
    },
  });
}

/**
 * PUT /api/mobile/parent-profile/relatives/links/{linkId}/permission
 *
 * The only part of an existing link that can be changed — Save Relative
 * deliberately leaves active links alone.
 */
export function useUpdateLinkPermission(relativeId?: number) {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, UpdateRelativePermissionInput>({
    mutationFn: (input) => parentProfileApi.updateLinkPermission(input),
    // Returned so the caller's mutateAsync resolves once the list has the
    // new value — the toggle stays pending until then.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.parentProfile.relatives() }),
        typeof relativeId === "number"
          ? queryClient.invalidateQueries({
              queryKey: queryKeys.parentProfile.relative(relativeId),
            })
          : undefined,
      ]),
  });
}

// ─── Lookups ─────────────────────────────────────────────────────────────────

export function useGuardianStudents(enabled = true) {
  return useQuery<StudentGuardiansDto[], Error, GuardianStudent[]>({
    queryKey: queryKeys.parentProfile.guardians(),
    queryFn: () => parentProfileApi.guardians(),
    select: selectGuardianStudents,
    staleTime: LOOKUP_STALE_TIME,
    enabled,
  });
}

/**
 * The same guardians list unmapped — each child's father and mother by name,
 * which the Account screen uses to show the other parent.
 */
export function useGuardianStudentsRaw(enabled = true) {
  return useQuery<StudentGuardiansDto[]>({
    queryKey: queryKeys.parentProfile.guardians(),
    queryFn: () => parentProfileApi.guardians(),
    staleTime: LOOKUP_STALE_TIME,
    enabled,
  });
}

export function useGenders(enabled = true) {
  return useQuery<LocalizedLookupDto[], Error, DefaultInputOption[]>({
    queryKey: queryKeys.parentProfile.lookup("genders"),
    queryFn: () => parentProfileApi.genders(),
    select: selectParentLookupOptions,
    staleTime: LOOKUP_STALE_TIME,
    enabled,
  });
}

/**
 * Names for the RelativeType enum. The integration guide says no such lookup
 * exists and the mapping must be sourced elsewhere — Swagger shows the
 * endpoint is deployed, so the picker reads it instead of hardcoding
 * 1,2,3,4,5,6,7,8,10 with guessed labels.
 */
export function useRelativeTypes(enabled = true) {
  return useQuery<LocalizedLookupDto[], Error, DefaultInputOption[]>({
    queryKey: queryKeys.parentProfile.lookup("relativeTypes"),
    queryFn: () => parentProfileApi.relativeTypes(),
    select: selectParentLookupOptions,
    staleTime: LOOKUP_STALE_TIME,
    enabled,
  });
}

export function useNationalities(enabled = true) {
  return useQuery<LocalizedLookupDto[], Error, DefaultInputOption[]>({
    queryKey: queryKeys.parentProfile.lookup("nationalities"),
    queryFn: () => parentProfileApi.nationalities(),
    select: selectParentLookupOptions,
    staleTime: LOOKUP_STALE_TIME,
    enabled,
  });
}

// ─── The parent's own information ────────────────────────────────────────────

/** GET /api/mobile/parent/profile */
export function useParentInfo(enabled = true) {
  return useQuery<ParentInfoDto, Error, ParentInfo>({
    queryKey: queryKeys.parentProfile.info(),
    queryFn: () => parentProfileApi.profile(),
    select: selectParentInfo,
    enabled,
  });
}

/** PUT /api/mobile/parent/profile — sends only what changed. */
export function useUpdateParentInfo() {
  const queryClient = useQueryClient();

  return useMutation<ParentInfoSaveResultDto, Error, UpdateParentInfoInput>({
    mutationFn: (input) => parentProfileApi.updateProfile(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.parentProfile.info(),
      });
    },
  });
}
