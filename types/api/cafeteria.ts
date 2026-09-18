import type { IsoDateTime } from "./common";

/**
 * Cafeteria DTOs — `/api/mobile/cafeteriaa/*`.
 *
 * ⚠️ Note the route really is spelled "cafeteriaa" with a double A. Verified
 * against dev: `/mobile/cafeteriaa/meals` → 401 (exists),
 * `/mobile/cafeteria/meals` → 404. Fixing it server-side is a breaking change.
 *
 * Shapes confirmed against real dev responses (2026-09-14) and the Cafeteria
 * API integration guide.
 *
 * Ordering goes through `/checkout/wallet` and `/checkout/insta` — NOT through
 * `POST /meal-orders`, which is read-only and 405s.
 */

/**
 * GET /api/mobile/cafeteriaa/meals — a sitting (Breakfast, Lunch…).
 *
 * Returned ordered by `startTime`. There is no description, price or image on
 * a meal: items carry the price, and artwork is bundled locally.
 */
export interface MealDto {
  id: number;
  name: string | null;
  /** "08:00:00". Display only — checkout does not enforce the window. */
  startTime: string | null;
  endTime: string | null;
}

/** A single orderable item inside a group. */
export interface MealItemDto {
  id: number;
  name: string | null;
  price: number;
}

/** Items are grouped by category ("Sandwiches", "Juice", …). */
export interface MealItemGroupDto {
  groupId: number;
  groupName: string | null;
  items: MealItemDto[] | null;
}

/** GET /api/mobile/cafeteriaa/meals/{mealId}/items */
export interface MealItemsDto {
  mealId: number;
  mealName: string | null;
  groups: MealItemGroupDto[] | null;
}

/** An item within a placed order. */
export interface MealOrderItemDto {
  id: number;
  mealId: number;
  mealName: string | null;
  itemId: number;
  itemName: string | null;
  qty: number;
  price: number;
}

/** A single placed order for one sitting (Breakfast / Lunch). */
export interface MealOrderDto {
  orderId: number;
  date: IsoDateTime | null;
  mealName: string | null;
  status: string | null;
  totalPrice: number | null;
  isAccepted: boolean;
  items: MealOrderItemDto[] | null;
}

/** GET /api/mobile/cafeteriaa/meal-orders?studentSeasonId=&date= */
export interface MealOrdersDto {
  studentSeasonId: number;
  studentName: string | null;
  date: IsoDateTime | null;
  orders: MealOrderDto[] | null;
}

/** Query parameters for the meal-orders endpoint. */
export interface MealOrdersParams {
  studentSeasonId: number;
  /** Serialized as yyyy-mm-dd. */
  date?: Date | string;
}

// ─── §6 Payment options ──────────────────────────────────────────────────────

/** One cafeteria payment method. `value` is a server-side enum. */
export interface CafeteriaPaymentMethodDto {
  /** ⚠️ Never hardcode: the guide requires taking these from the response. */
  value: number;
  name: string;
}

/** GET /api/mobile/cafeteriaa/payment-options?studentSeasonId= */
export interface CafeteriaPaymentOptionsDto {
  studentSeasonId: number;
  /** The student's available wallet balance. */
  walletBalance: number;
  paymentMethods: CafeteriaPaymentMethodDto[] | null;
}

// ─── §7 / §11 Checkout ───────────────────────────────────────────────────────

/**
 * One cart line. Prices are deliberately absent — the backend recalculates the
 * total from current database prices, and the guide forbids sending them.
 */
export interface CheckoutItemDto {
  itemId: number;
  quantity: number;
}

/** POST /api/mobile/cafeteriaa/checkout/wallet */
export interface WalletCheckoutRequestDto {
  studentSeasonId: number;
  /** One order covers one meal; ordering across meals means several calls. */
  mealId: number;
  items: CheckoutItemDto[];
}

/** POST /api/mobile/cafeteriaa/checkout/insta — the JSON part of the form. */
export interface InstaCheckoutRequestDto extends WalletCheckoutRequestDto {
  payerName?: string | null;
  payerPhoneNumber?: string | null;
}

/**
 * Shared by both checkouts. A success means the order was SUBMITTED; it starts
 * pending, and for Insta it does not mean the payment was approved.
 */
export interface CheckoutResultDto {
  orderId: number;
  /** Null for wallet; the transaction id for Insta. */
  onlinePaymentTransactionId: number | null;
  /** Backend-calculated — the authoritative total. */
  totalAmount: number;
}

/** Same 20 MB cap as the student-payments online endpoint. */
export const CAFETERIA_CHECKOUT_MAX_BYTES = 20 * 1024 * 1024;
