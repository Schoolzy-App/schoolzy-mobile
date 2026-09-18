import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import type { TimelineStep } from "@/components/TimelineStepper";
import { paymentsApi } from "@/services/api";
import type { PaymentProofFile } from "@/services/api/payments";
import { useIdempotentMutation } from "@/hooks/useIdempotentMutation";
import {
  selectDuePayments,
  selectIgAccountOptions,
  selectPaymentCategories,
  selectPaymentHistoryPages,
} from "@/services/mappers";
import type {
  DuePaymentsSummary,
  IgAccountOption,
  PaymentCategoryOption,
} from "@/services/mappers";
import {
  PAYMENT_HISTORY_DEFAULT_PAGE_SIZE,
  type DuePaymentsDto,
  type IgAccountOptionDto,
  type OnlinePaymentRequestDto,
  type OnlinePaymentResultDto,
  type PaymentCategoryDto,
  type PaymentHistoryDto,
  type WalletPaymentRequestDto,
  type WalletPaymentResultDto,
} from "@/types/api";

import { queryKeys } from "./queryKeys";

/** GET /api/mobile/student-payments/{id}/due */
export function useDuePayments(studentSeasonId?: number) {
  return useQuery<DuePaymentsDto, Error, DuePaymentsSummary>({
    queryKey: queryKeys.payments.due(studentSeasonId ?? 0),
    queryFn: () => paymentsApi.due(studentSeasonId as number),
    select: selectDuePayments,
    enabled: typeof studentSeasonId === "number",
  });
}

/**
 * GET /api/mobile/student-payments/{id}/history
 *
 * Paginated: the screen renders `data` and calls `fetchNextPage` for more.
 * `select` runs on the accumulated pages, so adding a page maps only that page
 * into new objects — the ones already rendered keep their identity.
 */
export function usePaymentHistory(
  studentSeasonId?: number,
  pageSize = PAYMENT_HISTORY_DEFAULT_PAGE_SIZE,
) {
  return useInfiniteQuery<
    PaymentHistoryDto,
    Error,
    TimelineStep[],
    ReturnType<typeof queryKeys.payments.history>,
    number
  >({
    queryKey: queryKeys.payments.history(studentSeasonId ?? 0),
    queryFn: ({ pageParam }) =>
      paymentsApi.history(studentSeasonId as number, {
        pageNumber: pageParam,
        pageSize,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pageNumber < last.totalPages ? last.pageNumber + 1 : undefined,
    select: selectPaymentHistoryPages,
    enabled: typeof studentSeasonId === "number",
  });
}

/**
 * GET /api/mobile/student-payments/categories
 *
 * Not student-scoped and near-static, so it is cached for the session rather
 * than refetched every time the payment flow is opened.
 */
export function usePaymentCategories(enabled = true) {
  return useQuery<PaymentCategoryDto[], Error, PaymentCategoryOption[]>({
    queryKey: queryKeys.payments.categories(),
    queryFn: () => paymentsApi.categories(),
    select: selectPaymentCategories,
    staleTime: 10 * 60_000,
    enabled,
  });
}

/**
 * GET /api/mobile/student-payments/{id}/ig-account-options
 *
 * Only call this when the chosen category has `requiresSubjectAccount: true`;
 * pass `enabled` accordingly so the request is skipped otherwise.
 */
export function useIgAccountOptions(studentSeasonId?: number, enabled = true) {
  return useQuery<IgAccountOptionDto[], Error, IgAccountOption[]>({
    queryKey: queryKeys.payments.igAccountOptions(studentSeasonId ?? 0),
    queryFn: () => paymentsApi.igAccountOptions(studentSeasonId as number),
    select: selectIgAccountOptions,
    staleTime: 5 * 60_000,
    enabled: enabled && typeof studentSeasonId === "number",
  });
}

// ─── Writes (§7, §8) ─────────────────────────────────────────────────────────

/** Server state a completed payment makes stale. */
function invalidateAfterPayment(queryClient: QueryClient) {
  // Due amounts, history and the wallet balance all move.
  queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
  // The profile roll-up surfaces the next due payment.
  queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
}

/**
 * POST /api/mobile/student-payments/wallet
 *
 * Completes immediately. Wrapped in the idempotency policy, so the screen gets
 * `submit` / `retry` / `startNewAttempt` rather than a bare `mutate`.
 */
export function useWalletPayment(
  onSuccess?: (result: WalletPaymentResultDto) => void,
) {
  const queryClient = useQueryClient();

  return useIdempotentMutation<WalletPaymentRequestDto, WalletPaymentResultDto>({
    operation: "StudentPayments.Wallet",
    mutationFn: (body, key) => paymentsApi.payWithWallet(body, key),
    onSuccess: (result) => {
      invalidateAfterPayment(queryClient);
      onSuccess?.(result);
    },
  });
}

/** Variables for an online payment: the JSON body plus its proof files. */
export interface OnlinePaymentVariables {
  body: OnlinePaymentRequestDto;
  files: PaymentProofFile[];
}

/**
 * POST /api/mobile/student-payments/online
 *
 * Submits proof; the transaction starts as "Pending", so this does NOT mean the
 * payment was approved.
 */
export function useOnlinePayment(
  onSuccess?: (result: OnlinePaymentResultDto) => void,
) {
  const queryClient = useQueryClient();

  return useIdempotentMutation<OnlinePaymentVariables, OnlinePaymentResultDto>({
    operation: "StudentPayments.Online",
    mutationFn: ({ body, files }, key) =>
      paymentsApi.payOnline(body, files, key),
    onSuccess: (result) => {
      invalidateAfterPayment(queryClient);
      onSuccess?.(result);
    },
  });
}
