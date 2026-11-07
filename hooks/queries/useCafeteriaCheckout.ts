import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

import { attemptMayExist } from "@/hooks/useIdempotentMutation";
import { cafeteriaApi } from "@/services/api";
import type { PaymentProofFile } from "@/services/api/payments";
import { ApiError, type CheckoutItemDto, type CheckoutResultDto } from "@/types/api";
import { createIdempotencyKey } from "@/utils/idempotency";
import { createLogger } from "@/utils/logger";

import { queryKeys } from "./queryKeys";

const log = createLogger("cafeteria:checkout");

/** One meal's worth of cart. Checkout covers exactly one meal per call. */
export interface MealCart {
  mealId: number;
  mealName: string;
  items: CheckoutItemDto[];
}

export type CheckoutPayment =
  | { kind: "wallet" }
  | {
      kind: "insta";
      payerName: string;
      payerPhoneNumber: string;
      files: PaymentProofFile[];
    };

export interface CheckoutOutcome {
  mealId: number;
  mealName: string;
  result?: CheckoutResultDto;
  error?: Error;
}

/**
 * Cafeteria checkout across one or more meals.
 *
 * The API creates ONE order per meal, so ordering Breakfast and Lunch together
 * is two requests — and §18.2 means each is its own business attempt with its
 * own key. A single key shared across both would make the second request look
 * like a retry of the first and return the first order's stored response, so
 * keys are tracked per meal.
 *
 * Meals that already succeeded are never resubmitted: on a retry only the
 * failed ones are sent, each reusing the key it originally went out with.
 */
export function useCafeteriaCheckout(studentSeasonId?: number) {
  const queryClient = useQueryClient();

  /** mealId → the key its in-flight (or retryable) attempt was sent with. */
  const keysRef = useRef(new Map<number, string>());
  /** mealId → the order it produced. Present means "do not send again". */
  const doneRef = useRef(new Map<number, CheckoutResultDto>());
  /** The last submission, so `retry` can resend it unchanged. */
  const lastRef = useRef<{ carts: MealCart[]; payment: CheckoutPayment } | null>(
    null,
  );

  const [isPending, setIsPending] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [canRetry, setCanRetry] = useState(false);
  const [outcomes, setOutcomes] = useState<CheckoutOutcome[]>([]);

  const run = useCallback(
    async (carts: MealCart[], payment: CheckoutPayment) => {
      if (typeof studentSeasonId !== "number") return;

      setIsPending(true);
      setIsProcessing(false);
      lastRef.current = { carts, payment };

      const results: CheckoutOutcome[] = [];
      let anyRetryable = false;
      let anyConflict = false;

      for (const cart of carts) {
        const already = doneRef.current.get(cart.mealId);
        if (already) {
          // Ordered on an earlier attempt — resending would risk a duplicate.
          results.push({ ...cart, result: already });
          continue;
        }

        let key = keysRef.current.get(cart.mealId);
        if (!key) {
          key = createIdempotencyKey();
          keysRef.current.set(cart.mealId, key);
        }

        const body = {
          studentSeasonId,
          mealId: cart.mealId,
          items: cart.items,
        };

        try {
          log.info(`→ ${payment.kind} checkout meal=${cart.mealId} key=${key}`);

          const result =
            payment.kind === "wallet"
              ? await cafeteriaApi.checkoutWallet(body, key)
              : await cafeteriaApi.checkoutInsta(
                  {
                    ...body,
                    payerName: payment.payerName,
                    payerPhoneNumber: payment.payerPhoneNumber,
                  },
                  payment.files,
                  key,
                );

          log.info(
            `✓ meal=${cart.mealId} order=${result.orderId} total=${result.totalAmount}`,
          );
          doneRef.current.set(cart.mealId, result);
          keysRef.current.delete(cart.mealId);
          results.push({ ...cart, result });
        } catch (error) {
          const err = error as Error;
          const keep = attemptMayExist(err);
          const conflict = err instanceof ApiError && err.status === 409;

          log.warn(
            `✕ meal=${cart.mealId} key=${key} ` +
              `status=${err instanceof ApiError ? err.status : "n/a"} ` +
              `${keep ? "— keeping key" : "— releasing key"}`,
          );

          if (!keep) keysRef.current.delete(cart.mealId);
          anyRetryable = anyRetryable || keep;
          anyConflict = anyConflict || conflict;
          results.push({ ...cart, error: err });
        }
      }

      setOutcomes(results);
      setCanRetry(anyRetryable);
      setIsProcessing(anyConflict);
      setIsPending(false);

      // Orders change the day's summary and the wallet balance.
      if (results.some((r) => r.result)) {
        queryClient.invalidateQueries({ queryKey: queryKeys.cafeteria.all });
      }
    },
    [studentSeasonId, queryClient],
  );

  /** A new order. Ignored while one is in flight (§21). */
  const submit = useCallback(
    (carts: MealCart[], payment: CheckoutPayment) => {
      if (isPending) {
        log.debug("checkout already in flight — ignoring duplicate submit");
        return;
      }
      void run(carts, payment);
    },
    [isPending, run],
  );

  /** Resend only the meals that failed, reusing their original keys. */
  const retry = useCallback(() => {
    const last = lastRef.current;
    if (isPending || !last) return;
    void run(last.carts, last.payment);
  }, [isPending, run]);

  /**
   * Abandon the attempt so the next submit is a new business action. Called
   * whenever the cart, meal, payment method or payer details change (§19).
   */
  const startNewAttempt = useCallback(() => {
    keysRef.current.clear();
    doneRef.current.clear();
    lastRef.current = null;
    setOutcomes([]);
    setCanRetry(false);
    setIsProcessing(false);
  }, []);

  const succeeded = outcomes.filter((o) => o.result);
  const failed = outcomes.filter((o) => o.error);

  return {
    submit,
    retry,
    startNewAttempt,
    isPending,
    isProcessing,
    canRetry,
    outcomes,
    succeeded,
    failed,
    /** Every meal ordered. */
    isComplete: outcomes.length > 0 && failed.length === 0,
    /** Some ordered, some didn't — the screen must say which. */
    isPartial: succeeded.length > 0 && failed.length > 0,
    /** Authoritative total across the orders that went through. */
    totalCharged: succeeded.reduce((sum, o) => sum + (o.result?.totalAmount ?? 0), 0),
  };
}
