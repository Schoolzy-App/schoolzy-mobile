import {
  CAFETERIA_CHECKOUT_MAX_BYTES,
  ApiError,
  type CafeteriaPaymentOptionsDto,
  type CheckoutResultDto,
  type InstaCheckoutRequestDto,
  type MealDto,
  type MealItemsDto,
  type MealOrdersDto,
  type MealOrdersParams,
  type WalletCheckoutRequestDto,
} from "@/types/api";

import { toApiDate } from "@/utils/format";

import { request } from "./client";
import { ROUTES } from "./config";
import { appendFile } from "./multipart";
import type { PaymentProofFile } from "./payments";

/**
 * Cafeteria.
 *
 * Both checkouts take an `Idempotency-Key` from the caller: a retry of the same
 * attempt must reuse the key it was first sent with, and only the caller knows
 * whether this is a retry or a new order. One call covers ONE meal.
 */
export const cafeteriaApi = {
  /** GET /api/mobile/cafeteriaa/meals */
  meals(): Promise<MealDto[]> {
    return request<MealDto[]>({ method: "GET", url: ROUTES.cafeteria.meals });
  },

  /** GET /api/mobile/cafeteriaa/meals/{mealId}/items — grouped by category. */
  mealItems(mealId: number): Promise<MealItemsDto> {
    return request<MealItemsDto>({
      method: "GET",
      url: ROUTES.cafeteria.mealItems(mealId),
    });
  },

  /** GET /api/mobile/cafeteriaa/meal-orders?studentSeasonId=&date= */
  mealOrders({ studentSeasonId, date }: MealOrdersParams): Promise<MealOrdersDto> {
    return request<MealOrdersDto>({
      method: "GET",
      url: ROUTES.cafeteria.mealOrders,
      params: { studentSeasonId, date: toApiDate(date) },
    });
  },

  /** GET /api/mobile/cafeteriaa/payment-options?studentSeasonId= */
  paymentOptions(studentSeasonId: number): Promise<CafeteriaPaymentOptionsDto> {
    return request<CafeteriaPaymentOptionsDto>({
      method: "GET",
      url: ROUTES.cafeteria.paymentOptions,
      params: { studentSeasonId },
    });
  },

  /** POST /api/mobile/cafeteriaa/checkout/wallet */
  checkoutWallet(
    body: WalletCheckoutRequestDto,
    idempotencyKey: string,
  ): Promise<CheckoutResultDto> {
    return request<CheckoutResultDto>({
      method: "POST",
      url: ROUTES.cafeteria.checkoutWallet,
      data: body,
      headers: { "Idempotency-Key": idempotencyKey },
    });
  },

  /**
   * POST /api/mobile/cafeteriaa/checkout/insta (multipart/form-data)
   *
   * ⚠️ Same `request` + `files` part shape as the student-payments online
   * endpoint; if the server rejects the JSON string, flattened fields are the
   * first thing to try.
   */
  checkoutInsta(
    body: InstaCheckoutRequestDto,
    files: PaymentProofFile[],
    idempotencyKey: string,
  ): Promise<CheckoutResultDto> {
    if (!files.length) {
      throw new ApiError("Payment proof is required.", 400);
    }

    const totalBytes = files.reduce((sum, f) => sum + (f.size ?? 0), 0);
    if (totalBytes > CAFETERIA_CHECKOUT_MAX_BYTES) {
      throw new ApiError(
        "The attached files are too large. Please attach smaller images (20 MB total).",
        400,
      );
    }

    const form = new FormData();
    form.append("request", JSON.stringify(body));
    files.forEach((file) => appendFile(form, "files", file));

    return request<CheckoutResultDto>({
      method: "POST",
      url: ROUTES.cafeteria.checkoutInsta,
      data: form,
      headers: {
        "Content-Type": "multipart/form-data",
        "Idempotency-Key": idempotencyKey,
      },
    });
  },
};
