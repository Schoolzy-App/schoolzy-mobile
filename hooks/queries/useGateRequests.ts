import { useQuery, useQueryClient } from "@tanstack/react-query";

import { gateRequestsApi } from "@/services/api";
import {
  selectGateRequestDetail,
  selectGroupedGateRequests,
} from "@/services/mappers";
import type {
  GateRequestDetail,
  GroupedGateRequests,
} from "@/services/mappers";
import type { ApiError } from "@/types/api";
import type {
  CreateGateRequestInput,
  CreateGateRequestResponseDto,
  GateCreateOptionsDto,
  GateEligibilityDto,
  GateOtpDto,
  GateRequestDetailDto,
  GateRequestListDto,
  GateStudentDto,
} from "@/types/api";

import { useIdempotentMutation } from "../useIdempotentMutation";
import { queryKeys } from "./queryKeys";

/**
 * The only 409 that means "same key still in flight" is the idempotency
 * coordinator's `Request Already Processing` (no error code). Every other gate
 * 409 (AlreadyConfirmed, RequestExpired, AlreadyCancelled, ConcurrentUpdate,
 * HoldingRecordExistsToday) is final and carries a code in `errors`, so it
 * releases the key and clears `isProcessing`.
 */
export function isGateInFlightConflict(error: ApiError): boolean {
  return /already processing/i.test(error.message ?? "");
}

/** GET /api/mobile/gate-requests/eligibility */
export function useGateEligibility({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery<GateEligibilityDto, Error>({
    queryKey: queryKeys.gateRequests.eligibility(),
    queryFn: () => gateRequestsApi.eligibility(),
    enabled,
  });
}

/** GET /api/mobile/gate-requests/students (carries `hasRequestToday`). */
export function useGateStudents() {
  return useQuery<GateStudentDto[], Error>({
    queryKey: queryKeys.gateRequests.students(),
    queryFn: () => gateRequestsApi.students(),
  });
}

/** GET /create-options — disabled until a student is chosen. */
export function useGateCreateOptions(studentSeasonId?: number) {
  return useQuery<GateCreateOptionsDto, Error>({
    queryKey: queryKeys.gateRequests.createOptions(studentSeasonId ?? 0),
    queryFn: () => gateRequestsApi.createOptions(studentSeasonId as number),
    enabled: typeof studentSeasonId === "number",
  });
}

/** GET /api/mobile/gate-requests, split into today and earlier. */
export function useGateRequests() {
  return useQuery<GateRequestListDto, Error, GroupedGateRequests>({
    queryKey: queryKeys.gateRequests.list(),
    queryFn: () => gateRequestsApi.list(),
    select: (dto) => selectGroupedGateRequests(dto),
  });
}

/** GET /api/mobile/gate-requests/{id} */
export function useGateRequest(id?: number) {
  return useQuery<GateRequestDetailDto, Error, GateRequestDetail>({
    queryKey: queryKeys.gateRequests.detail(id ?? 0),
    queryFn: () => gateRequestsApi.detail(id as number),
    select: selectGateRequestDetail,
    enabled: typeof id === "number",
  });
}

/**
 * POST /api/mobile/gate-requests — one request per selected student.
 * Idempotent: the same key is reused on retry so a timeout cannot double-file.
 * Server errors (e.g. 409 "already has a gate request today") surface through
 * `error.message` unchanged.
 */
export function useCreateGateRequest(
  onSuccess?: (ids: CreateGateRequestResponseDto) => void,
) {
  const queryClient = useQueryClient();

  return useIdempotentMutation<
    CreateGateRequestInput,
    CreateGateRequestResponseDto
  >({
    operation: "GateRequests.Create",
    isInFlightConflict: isGateInFlightConflict,
    mutationFn: (input, idempotencyKey) =>
      gateRequestsApi.create(input, idempotencyKey),
    onSuccess: (ids) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gateRequests.list() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.gateRequests.students(),
      });
      onSuccess?.(ids);
    },
  });
}

/**
 * POST /api/mobile/gate-requests/{id}/cancel. Variables are `void`: the id is
 * bound by the hook. 409s ("already confirmed, contact the school") carry the
 * server's text in `error.message`.
 */
export function useCancelGateRequest(
  id: number,
  onSuccess?: (detail: GateRequestDetailDto) => void,
) {
  const queryClient = useQueryClient();

  return useIdempotentMutation<void, GateRequestDetailDto>({
    operation: "GateRequests.Cancel",
    isInFlightConflict: isGateInFlightConflict,
    mutationFn: (_input, idempotencyKey) =>
      gateRequestsApi.cancel(id, idempotencyKey),
    onSuccess: (detail) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gateRequests.list() });
      // The response is the fresh detail; seed it to avoid a refetch flash.
      queryClient.setQueryData(queryKeys.gateRequests.detail(id), detail);
      // Cancelling frees the student for another request today.
      queryClient.invalidateQueries({
        queryKey: queryKeys.gateRequests.students(),
      });
      onSuccess?.(detail);
    },
  });
}

/**
 * POST /api/mobile/gate-requests/{id}/otp. Each call replaces the active code
 * and uses one of the day's tries, so the key is reused on retry: a timed-out
 * attempt replays the same code instead of burning another try. The detail is
 * refetched afterwards for the authoritative `canGenerateOtp` / tries left.
 */
export function useGenerateGateOtp(
  id: number,
  onSuccess?: (otp: GateOtpDto) => void,
) {
  const queryClient = useQueryClient();

  return useIdempotentMutation<void, GateOtpDto>({
    operation: "GateRequests.GenerateOtp",
    isInFlightConflict: isGateInFlightConflict,
    mutationFn: (_input, idempotencyKey) =>
      gateRequestsApi.generateOtp(id, idempotencyKey),
    onSuccess: (otp) => {
      queryClient.setQueryData<GateRequestDetailDto>(
        queryKeys.gateRequests.detail(id),
        (prev) =>
          prev
            ? {
                ...prev,
                activeOtp: {
                  code: otp.code,
                  expiresAtUtc: otp.expiresAtUtc,
                  serverTimeUtc: otp.serverTimeUtc,
                },
                otpGenerationsLeft: otp.generationsLeft,
                otpDailyLimit: otp.dailyLimit,
                canGenerateOtp: prev.canGenerateOtp && otp.generationsLeft > 0,
              }
            : prev,
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.gateRequests.detail(id),
      });
      onSuccess?.(otp);
    },
  });
}
