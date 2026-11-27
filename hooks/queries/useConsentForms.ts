import { useQuery, useQueryClient } from "@tanstack/react-query";

import { consentFormsApi, type ConsentListFilter } from "@/services/api/consentForms";
import { selectConsentFormDetail, selectConsentForms } from "@/services/mappers";
import type { ConsentForm, ConsentFormDetail } from "@/services/mappers";
import type { ApiError } from "@/types/api";
import type {
  ConsentFormDetailDto,
  ConsentFormListItemDto,
  ConsentRespondInput,
  ConsentRespondResultDto,
} from "@/types/api";

import { useIdempotentMutation } from "../useIdempotentMutation";
import { queryKeys } from "./queryKeys";

/**
 * Only the idempotency coordinator's "Request Already Processing" 409 means
 * the same key is still in flight. Business 409s (closed, capacity full,
 * already paid) carry a CONSENT_* code and start a fresh attempt.
 */
export function isConsentInFlightConflict(error: ApiError): boolean {
  return /already processing/i.test(error.message ?? "") && !error.errors?.[0];
}

/** GET /api/mobile/consent-forms?status= */
export function useConsentForms(status?: ConsentListFilter) {
  return useQuery<ConsentFormListItemDto[], Error, ConsentForm[]>({
    queryKey: queryKeys.consentForms.listByStatus(status),
    queryFn: () => consentFormsApi.list(status),
    select: selectConsentForms,
  });
}

/** GET /api/mobile/consent-forms/pending-count — for menu badges. */
export function useConsentPendingCount({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery<number, Error>({
    queryKey: queryKeys.consentForms.pendingCount(),
    queryFn: () => consentFormsApi.pendingCount(),
    select: (n) => (typeof n === "number" && Number.isFinite(n) ? n : 0),
    enabled,
  });
}

/** GET /api/mobile/consent-forms/{recipientId} */
export function useConsentForm(recipientId?: number) {
  return useQuery<ConsentFormDetailDto, Error, ConsentFormDetail>({
    queryKey: queryKeys.consentForms.detail(recipientId ?? 0),
    queryFn: () => consentFormsApi.detail(recipientId as number),
    select: selectConsentFormDetail,
    // A balance shown next to "Pay from wallet" has to be current.
    staleTime: 0,
    enabled: typeof recipientId === "number",
  });
}

/**
 * POST /api/mobile/consent-forms/{recipientId}/respond. Idempotent: a retry of
 * an attempt whose outcome is unknown reuses its key, so a timeout can never
 * charge the wallet twice. On success the lists, the pending count, the detail
 * and every wallet/balance view are refreshed.
 */
export function useRespondConsentForm(
  recipientId: number,
  onSuccess?: (result: ConsentRespondResultDto) => void,
) {
  const queryClient = useQueryClient();

  return useIdempotentMutation<ConsentRespondInput, ConsentRespondResultDto>({
    operation: "ConsentForms.Respond",
    isInFlightConflict: isConsentInFlightConflict,
    mutationFn: (input, idempotencyKey) =>
      consentFormsApi.respond(recipientId, input, idempotencyKey),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.consentForms.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.parentDashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      onSuccess?.(result);
    },
  });
}
