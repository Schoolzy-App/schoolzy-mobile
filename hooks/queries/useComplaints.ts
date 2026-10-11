import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";

import { COMPLAINTS_PAGE_SIZE, complaintsApi } from "@/services/api";
import {
  selectComplaintDetail,
  selectGroupedComplaints,
  selectLookupOptions,
  selectStudentOptions,
} from "@/services/mappers";
import type { ComplaintDetail, GroupedComplaints } from "@/services/mappers";
import type { DefaultInputOption } from "@/components/ui";
import type {
  ComplaintLookupDto,
  ComplaintPage,
  ComplaintStudentDto,
  CreateComplaintInput,
  CreateComplaintResponseDto,
  MobileComplaintDetailDto,
} from "@/types/api";

import { useIdempotentMutation } from "../useIdempotentMutation";
import { queryKeys } from "./queryKeys";

/**
 * GET /api/mobile/complaints — paged, newest first.
 *
 * Grouping into open/closed happens in `select`, so the screen never
 * re-filters on render.
 */
export function useComplaints(enabled = true) {
  return useInfiniteQuery<
    ComplaintPage,
    Error,
    GroupedComplaints,
    ReturnType<typeof queryKeys.complaints.list>,
    number
  >({
    queryKey: queryKeys.complaints.list(),
    queryFn: ({ pageParam }) =>
      complaintsApi.list(pageParam, COMPLAINTS_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.hasMore ? last.pageNumber + 1 : undefined,
    select: selectGroupedComplaints,
    enabled,
  });
}

/** GET /api/mobile/complaints/{id} */
export function useComplaint(id?: number) {
  return useQuery<MobileComplaintDetailDto, Error, ComplaintDetail>({
    queryKey: queryKeys.complaints.detail(id ?? 0),
    queryFn: () => complaintsApi.detail(id as number),
    select: selectComplaintDetail,
    enabled: typeof id === "number",
  });
}

/**
 * The four create-form lookups.
 *
 * Near-static and shared by every complaint, so they are cached for five
 * minutes rather than refetched each time the form opens. The guide asks the
 * client to read these rather than hardcode the enums, since the sets can
 * grow server-side.
 */
const LOOKUP_STALE_TIME = 5 * 60_000;

export function useComplaintStudents(enabled = true) {
  return useQuery<ComplaintStudentDto[], Error, DefaultInputOption[]>({
    queryKey: queryKeys.complaints.lookups("students"),
    queryFn: () => complaintsApi.students(),
    select: selectStudentOptions,
    staleTime: LOOKUP_STALE_TIME,
    enabled,
  });
}

export function useComplaintCategories(enabled = true) {
  return useQuery<ComplaintLookupDto[], Error, DefaultInputOption[]>({
    queryKey: queryKeys.complaints.lookups("categories"),
    queryFn: () => complaintsApi.categories(),
    select: selectLookupOptions,
    staleTime: LOOKUP_STALE_TIME,
    enabled,
  });
}

export function useComplaintPriorities(enabled = true) {
  return useQuery<ComplaintLookupDto[], Error, DefaultInputOption[]>({
    queryKey: queryKeys.complaints.lookups("priorities"),
    queryFn: () => complaintsApi.priorities(),
    select: selectLookupOptions,
    staleTime: LOOKUP_STALE_TIME,
    enabled,
  });
}

export function useComplaintContactMethods(enabled = true) {
  return useQuery<ComplaintLookupDto[], Error, DefaultInputOption[]>({
    queryKey: queryKeys.complaints.lookups("contactMethods"),
    queryFn: () => complaintsApi.contactMethods(),
    select: selectLookupOptions,
    staleTime: LOOKUP_STALE_TIME,
    enabled,
  });
}

/**
 * POST /api/mobile/complaints.
 *
 * Wrapped in the idempotent-mutation policy rather than a plain mutation: the
 * guide requires a key per complaint and the *same* key on retry. A new key
 * after a timeout would file the same complaint twice, and the parent would
 * have no way to tell.
 */
export function useCreateComplaint(
  onSuccess?: (complaintId: CreateComplaintResponseDto) => void,
) {
  const queryClient = useQueryClient();

  return useIdempotentMutation<CreateComplaintInput, CreateComplaintResponseDto>({
    operation: "Complaints.Create",
    mutationFn: (input, idempotencyKey) =>
      complaintsApi.create(input, idempotencyKey),
    onSuccess: (complaintId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.complaints.list() });
      onSuccess?.(complaintId);
    },
  });
}
