import type { IsoDateTime } from "./common";

/**
 * Student payment DTOs — `/api/mobile/student-payments/*`.
 *
 * Shapes follow the "Student Payments API – Frontend Integration Guide", which
 * documents the field names and types for every endpoint below. The one thing
 * the guide does NOT show is the pagination wrapper around `/history`; see
 * `PaymentHistoryDto`.
 */

// ─── §3 Payment history ──────────────────────────────────────────────────────

/**
 * A ledger entry. Used both for a top-level payment and for the refunds and
 * adjustments nested under it.
 */
export interface PaymentTransactionDto {
  id: number;
  amount: number;
  date: IsoDateTime;
  category: string | null;
  /** "Payment" for the parent; "Refund" / "Adjustment" for children. */
  transactionType: string;
  /** Payment method, e.g. "Wallet". */
  type: string | null;
}

export interface PaymentHistoryItemDto extends PaymentTransactionDto {
  /** IG account name, when the payment was made against one. */
  accountName: string | null;
  /**
   * Refunds and adjustments derived from this payment. The guide is explicit
   * that these are children, not independent payments — rendering them as
   * top-level rows would double-count the amounts.
   */
  transactions: PaymentTransactionDto[] | null;
}

/**
 * GET /api/mobile/student-payments/{studentSeasonId}/history
 *
 * ⚠️ The guide documents `pageNumber`/`pageSize` as query parameters but never
 * shows the response wrapper. This is the envelope the rest of the mobile API
 * uses; `paymentsApi.history` normalizes a bare array into it so an unwrapped
 * response still renders.
 */
export interface PaymentHistoryDto {
  items: PaymentHistoryItemDto[] | null;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/** Query parameters for the history endpoint. */
export interface PaymentHistoryParams {
  pageNumber?: number;
  pageSize?: number;
}

/** The backend clamps anything above this to 100. */
export const PAYMENT_HISTORY_MAX_PAGE_SIZE = 100;
export const PAYMENT_HISTORY_DEFAULT_PAGE_SIZE = 20;

// ─── §4 Due payments ─────────────────────────────────────────────────────────

/**
 * One school-fee installment. Only installments with an outstanding amount
 * greater than zero are returned.
 *
 * NOTE: there is no `id` — `installmentNumber` is the only stable identifier.
 */
export interface SchoolFeeInstallmentDto {
  installmentNumber: number;
  dueDate: IsoDateTime | null;
  /** Original installment amount, before anything was paid. */
  amount: number;
  paidAmount: number;
  outstandingAmount: number;
}

/** One IG account with a remaining balance. */
export interface IgOutstandingDto {
  accountName: string | null;
  subjects: string[] | null;
  outstandingAmount: number;
}

/** GET /api/mobile/student-payments/{studentSeasonId}/due */
export interface DuePaymentsDto {
  schoolFees: SchoolFeeInstallmentDto[] | null;
  ig: IgOutstandingDto[] | null;
}

// ─── §5 Payment categories ───────────────────────────────────────────────────

/**
 * GET /api/mobile/student-payments/categories
 *
 * Cafeteria categories are excluded server-side — those use the separate
 * cafeteria checkout flow.
 */
export interface PaymentCategoryDto {
  id: number;
  name: string | null;
  /**
   * Drives whether the subject-account selector is shown. The guide is
   * explicit: branch on this flag, never on the category name or id.
   */
  requiresSubjectAccount: boolean;
}

// ─── §6 IG account options ───────────────────────────────────────────────────

/**
 * GET /api/mobile/student-payments/{studentSeasonId}/ig-account-options
 * Only fetched when the chosen category has `requiresSubjectAccount: true`.
 */
export interface IgAccountOptionDto {
  /** Sent back as `subjectAccountId` when creating the payment. */
  subjectAccountId: number;
  name: string | null;
  code: string | null;
}

// ─── §7 Pay with wallet ──────────────────────────────────────────────────────

/** POST /api/mobile/student-payments/wallet */
export interface WalletPaymentRequestDto {
  studentSeasonId: number;
  categoryId: number;
  /** Required when the chosen category has `requiresSubjectAccount: true`. */
  subjectAccountId: number | null;
  amount: number;
  comment?: string | null;
}

/** A successful wallet response means the payment is COMPLETE. */
export interface WalletPaymentResultDto {
  paymentStudentId: number;
  amount: number;
}

// ─── §8 Online payment ───────────────────────────────────────────────────────

/** The JSON half of the multipart body, sent in the `request` part. */
export interface OnlinePaymentRequestDto {
  studentSeasonId: number;
  categoryId: number;
  subjectAccountId: number | null;
  amount: number;
  payerName: string;
  payerPhoneNumber: string;
}

/**
 * A successful response means the PROOF WAS SUBMITTED, not that the payment was
 * approved — `status` starts as "Pending".
 */
export interface OnlinePaymentResultDto {
  transactionId: number;
  status: string;
}

/** Total multipart request size the backend accepts. */
export const ONLINE_PAYMENT_MAX_BYTES = 20 * 1024 * 1024;
