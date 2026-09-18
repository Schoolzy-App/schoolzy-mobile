import {
  ONLINE_PAYMENT_MAX_BYTES,
  PAYMENT_HISTORY_DEFAULT_PAGE_SIZE,
  PAYMENT_HISTORY_MAX_PAGE_SIZE,
  ApiError,
  type DuePaymentsDto,
  type IgAccountOptionDto,
  type PaymentCategoryDto,
  type PaymentHistoryDto,
  type PaymentHistoryItemDto,
  type PaymentHistoryParams,
  type OnlinePaymentRequestDto,
  type OnlinePaymentResultDto,
  type WalletPaymentRequestDto,
  type WalletPaymentResultDto,
} from "@/types/api";

import { request } from "./client";
import { ROUTES } from "./config";
import { appendFile, type UploadFile } from "./multipart";

/**
 * Student payments.
 *
 * The two write endpoints take an `Idempotency-Key` supplied by the caller
 * rather than minting one here: a retry of the same attempt must reuse the key
 * it was first sent with, which only the caller knows. See
 * `hooks/useIdempotentMutation.ts`.
 */

/** One payment-proof file plus the byte count used for the 20 MB check. */
export interface PaymentProofFile extends UploadFile {
  size?: number;
}

/** Mirrors the server-side clamping so the request and the cache key agree. */
function normalizePaging({ pageNumber, pageSize }: PaymentHistoryParams) {
  const page = Math.max(1, Math.trunc(pageNumber ?? 1) || 1);
  const size = Math.min(
    PAYMENT_HISTORY_MAX_PAGE_SIZE,
    Math.max(1, Math.trunc(pageSize ?? PAYMENT_HISTORY_DEFAULT_PAGE_SIZE) || PAYMENT_HISTORY_DEFAULT_PAGE_SIZE),
  );
  return { pageNumber: page, pageSize: size };
}

/**
 * The integration guide documents the paging parameters but not the response
 * wrapper, so a bare array is still possible. Normalizing here keeps the
 * uncertainty out of the mapper and the infinite query.
 */
function normalizeHistory(
  raw: PaymentHistoryDto | PaymentHistoryItemDto[],
  pageNumber: number,
  pageSize: number,
): PaymentHistoryDto {
  if (Array.isArray(raw)) {
    return {
      items: raw,
      pageNumber,
      pageSize,
      totalCount: raw.length,
      // Unknown: assume this is the last page when fewer items came back than
      // were asked for, otherwise let the caller try the next one.
      totalPages: raw.length < pageSize ? pageNumber : pageNumber + 1,
    };
  }
  return raw;
}

export const paymentsApi = {
  /** GET /api/mobile/student-payments/{studentSeasonId}/due */
  due(studentSeasonId: number): Promise<DuePaymentsDto> {
    return request<DuePaymentsDto>({
      method: "GET",
      url: ROUTES.payments.due(studentSeasonId),
    });
  },

  /** GET /api/mobile/student-payments/{studentSeasonId}/history */
  async history(
    studentSeasonId: number,
    params: PaymentHistoryParams = {},
  ): Promise<PaymentHistoryDto> {
    const paging = normalizePaging(params);
    const raw = await request<PaymentHistoryDto | PaymentHistoryItemDto[]>({
      method: "GET",
      url: ROUTES.payments.history(studentSeasonId),
      params: paging,
    });
    return normalizeHistory(raw, paging.pageNumber, paging.pageSize);
  },

  /** GET /api/mobile/student-payments/categories */
  categories(): Promise<PaymentCategoryDto[]> {
    return request<PaymentCategoryDto[]>({
      method: "GET",
      url: ROUTES.payments.categories(),
    });
  },

  /** GET /api/mobile/student-payments/{studentSeasonId}/ig-account-options */
  igAccountOptions(studentSeasonId: number): Promise<IgAccountOptionDto[]> {
    return request<IgAccountOptionDto[]>({
      method: "GET",
      url: ROUTES.payments.igAccountOptions(studentSeasonId),
    });
  },

  /**
   * POST /api/mobile/student-payments/wallet
   * Completes the payment outright — a success here means money moved.
   */
  payWithWallet(
    body: WalletPaymentRequestDto,
    idempotencyKey: string,
  ): Promise<WalletPaymentResultDto> {
    return request<WalletPaymentResultDto>({
      method: "POST",
      url: ROUTES.payments.wallet(),
      data: body,
      headers: { "Idempotency-Key": idempotencyKey },
    });
  },

  /**
   * POST /api/mobile/student-payments/online (multipart/form-data)
   *
   * Success means the proof was submitted, not that the payment was approved.
   *
   * ⚠️ The guide specifies two parts, `request` (the JSON payload) and `files`.
   * If the server rejects the JSON string, the alternative binding is flattened
   * fields (`request.studentSeasonId`, …) — that is the first thing to try.
   */
  payOnline(
    body: OnlinePaymentRequestDto,
    files: PaymentProofFile[],
    idempotencyKey: string,
  ): Promise<OnlinePaymentResultDto> {
    if (!files.length) {
      throw new ApiError("Payment proof is required.", 400);
    }

    // Caught here rather than after a 20 MB upload over mobile data.
    const totalBytes = files.reduce((sum, f) => sum + (f.size ?? 0), 0);
    if (totalBytes > ONLINE_PAYMENT_MAX_BYTES) {
      throw new ApiError(
        "The attached files are too large. Please attach smaller images (20 MB total).",
        400,
      );
    }

    const form = new FormData();
    form.append("request", JSON.stringify(body));
    files.forEach((file) => appendFile(form, "files", file));

    return request<OnlinePaymentResultDto>({
      method: "POST",
      url: ROUTES.payments.online(),
      data: form,
      headers: {
        "Content-Type": "multipart/form-data",
        "Idempotency-Key": idempotencyKey,
      },
    });
  },
};
