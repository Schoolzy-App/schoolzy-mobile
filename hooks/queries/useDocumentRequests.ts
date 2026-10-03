import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { documentRequestsApi } from "@/services/api";
import {
  selectGroupedRequests,
  selectRequestDetail,
} from "@/services/mappers";
import type { GroupedRequests, RequestDetail } from "@/services/mappers";
import type {
  CreateDocumentRequestInput,
  CreateDocumentRequestResponseDto,
  DocumentRequestCreateOptionsDto,
  MobileDocumentRequestDetailDto,
  MobileDocumentRequestListItemDto,
  UploadDocumentRequestFileInput,
} from "@/types/api";

import { queryKeys } from "./queryKeys";

/**
 * GET /api/mobile/document-requests
 * Grouping into accepted/pending/closed happens in `select`, so the screen
 * never re-filters on render.
 */
export function useDocumentRequests(enabled = true) {
  return useQuery<MobileDocumentRequestListItemDto[], Error, GroupedRequests>({
    queryKey: queryKeys.documentRequests.list(),
    queryFn: () => documentRequestsApi.list(),
    select: selectGroupedRequests,
    enabled,
  });
}

/** GET /api/mobile/document-requests/{id} */
export function useDocumentRequest(id?: number) {
  return useQuery<MobileDocumentRequestDetailDto, Error, RequestDetail>({
    queryKey: queryKeys.documentRequests.detail(id ?? 0),
    queryFn: () => documentRequestsApi.detail(id as number),
    select: selectRequestDetail,
    enabled: typeof id === "number",
  });
}

/**
 * GET /api/mobile/document-requests/create-options
 * Document types and eligible students change rarely — cached for 5 minutes.
 */
export function useDocumentRequestOptions(enabled = true) {
  return useQuery<DocumentRequestCreateOptionsDto>({
    queryKey: queryKeys.documentRequests.createOptions(),
    queryFn: () => documentRequestsApi.createOptions(),
    staleTime: 5 * 60_000,
    enabled,
  });
}

/** POST /api/mobile/document-requests — invalidates the list on success. */
export function useCreateDocumentRequest() {
  const queryClient = useQueryClient();

  return useMutation<
    CreateDocumentRequestResponseDto,
    Error,
    CreateDocumentRequestInput
  >({
    mutationFn: (input) => documentRequestsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.documentRequests.list(),
      });
    },
  });
}

/**
 * POST /api/mobile/document-requests/{requestId}/files
 * Refreshes the affected request's detail (file list + count) and the list.
 */
export function useUploadDocumentRequestFile() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, UploadDocumentRequestFileInput>({
    mutationFn: (input) => documentRequestsApi.uploadFile(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.documentRequests.detail(variables.requestId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.documentRequests.list(),
      });
    },
  });
}
