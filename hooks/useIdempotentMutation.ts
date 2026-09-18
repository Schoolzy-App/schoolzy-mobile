import { useMutation } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

import { ApiError } from "@/types/api";
import { createIdempotencyKey } from "@/utils/idempotency";
import { createLogger } from "@/utils/logger";

const log = createLogger("idempotency");

/**
 * Wraps a command endpoint in the retry policy from §11 of the payments guide.
 *
 * The rule the whole thing turns on:
 *
 *   NEW BUSINESS ACTION      = NEW key
 *   RETRY OF THE SAME ACTION = SAME key
 *
 * So the key lives in a ref across renders, is minted when a submit starts, and
 * is released only once the attempt has definitively resolved. Call `submit`
 * for a new attempt and `retry` when the previous one's outcome is unknown.
 */

/**
 * Whether the attempt this key identifies might still exist server-side.
 *
 * A timeout or a dropped connection says nothing about whether the backend
 * committed the payment, so the key has to survive for the retry. A 409 means
 * the first request is provably still running. A 5xx may have committed before
 * failing to respond.
 *
 * Everything else — validation, 403, a rejected category — means nothing was
 * created, so the next submit is a genuinely new attempt and gets a new key.
 */
export function attemptMayExist(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  return (
    error.isNetworkError ||
    error.status === 0 ||
    error.status === 409 ||
    error.status >= 500
  );
}

export interface IdempotentMutationOptions<TVariables, TResult> {
  /** Receives the key to send as the `Idempotency-Key` header. */
  mutationFn: (variables: TVariables, idempotencyKey: string) => Promise<TResult>;
  onSuccess?: (result: TResult, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  /** Label for the logs, e.g. "StudentPayments.Wallet". */
  operation?: string;
}

export function useIdempotentMutation<TVariables, TResult>({
  mutationFn,
  onSuccess,
  onError,
  operation = "command",
}: IdempotentMutationOptions<TVariables, TResult>) {
  /** The key for the attempt currently in flight, or awaiting a retry. */
  const keyRef = useRef<string | null>(null);
  /** Kept so `retry` can resend the exact same body. */
  const variablesRef = useRef<TVariables | null>(null);
  /**
   * Set when the backend reports the first request is still processing. The
   * guide is explicit that the client must NOT mint a new key here — doing so
   * would bypass duplicate protection and could take the money twice.
   */
  const [isProcessing, setIsProcessing] = useState(false);
  /**
   * Mirrors "keyRef.current is set" for rendering. The key itself has to live
   * in a ref so `mutationFn` reads the current value at call time, but a ref
   * read during render would not re-render when it changes.
   */
  const [attemptRetained, setAttemptRetained] = useState(false);

  const mutation = useMutation<TResult, Error, TVariables>({
    mutationFn: (variables) => {
      if (!keyRef.current) keyRef.current = createIdempotencyKey();
      variablesRef.current = variables;
      log.info(`→ ${operation} key=${keyRef.current}`);
      return mutationFn(variables, keyRef.current);
    },
    onSuccess: (result, variables) => {
      log.info(`✓ ${operation} completed key=${keyRef.current}`);
      // The attempt is finished; the next submit is a new business action.
      keyRef.current = null;
      setAttemptRetained(false);
      setIsProcessing(false);
      onSuccess?.(result, variables);
    },
    onError: (error, variables) => {
      const keep = attemptMayExist(error);
      const conflict = error instanceof ApiError && error.status === 409;

      log.warn(
        `✕ ${operation} failed key=${keyRef.current} ` +
          `status=${error instanceof ApiError ? error.status : "n/a"} ` +
          `${keep ? "— keeping key for retry" : "— releasing key"}`,
      );

      setIsProcessing(conflict);
      setAttemptRetained(keep);
      if (!keep) keyRef.current = null;
      onError?.(error, variables);
    },
  });

  const { mutate, isPending, reset } = mutation;

  /**
   * Start a new business attempt. Ignored while one is in flight — idempotency
   * is the backend's safety net, not a substitute for disabling the button.
   */
  const submit = useCallback(
    (variables: TVariables) => {
      if (isPending) {
        log.debug(`${operation} already in flight — ignoring duplicate submit`);
        return;
      }
      mutate(variables);
    },
    [isPending, mutate, operation],
  );

  /**
   * Resend the SAME attempt after an uncertain failure, reusing its key. If the
   * backend already committed it, the stored response comes back and no second
   * payment is created.
   */
  const retry = useCallback(() => {
    if (isPending || !variablesRef.current) return;
    mutate(variablesRef.current);
  }, [isPending, mutate]);

  /** Abandon the attempt so the next submit is treated as a new one. */
  const startNewAttempt = useCallback(() => {
    keyRef.current = null;
    variablesRef.current = null;
    setAttemptRetained(false);
    setIsProcessing(false);
    reset();
  }, [reset]);

  return {
    submit,
    retry,
    startNewAttempt,
    /** True when a failed attempt may still have succeeded — offer `retry`. */
    canRetry: attemptRetained && !isPending,
    /** True after a 409: the first request is still running server-side. */
    isProcessing,
    isPending,
    error: mutation.error,
    data: mutation.data,
    isSuccess: mutation.isSuccess,
  };
}
