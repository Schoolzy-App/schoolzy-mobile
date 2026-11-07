/**
 * Student wallet DTOs — `/api/mobile/wallet/*`.
 *
 * ⚠️ `availableBalance` can be negative and MUST be displayed as returned. The
 * guide is explicit that the client performs no wallet arithmetic and never
 * clamps a negative balance to zero — a negative value means the student owes
 * the cafeteria, and hiding it would misrepresent the account.
 */
export interface WalletBalanceDto {
  studentSeasonId: number;
  studentName: string | null;
  /** Positive, zero or negative. Zero also means "no active wallet". */
  availableBalance: number;
}

/**
 * GET /api/mobile/wallet/balances — every student the caller can access.
 * An empty array is a successful response, not an error.
 */
export type WalletBalancesDto = WalletBalanceDto[];
