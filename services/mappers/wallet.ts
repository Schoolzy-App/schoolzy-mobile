import type { WalletBalanceDto } from "@/types/api";
import { formatCurrency } from "@/utils/format";

/**
 * `/api/mobile/wallet` → UI.
 *
 * The balance is passed through untouched. The guide forbids any client-side
 * wallet arithmetic, and a negative balance is a real state that must reach the
 * screen as-is rather than being clamped to zero.
 */

export interface WalletBalance {
  studentSeasonId: number;
  studentName: string;
  /** Raw value — may be negative. */
  amount: number;
  /** "EGP 250.5" / "-EGP 120.5" — sign preserved. */
  label: string;
  /** Absolute value with no currency, e.g. "120.5" — for the wallet card,
   *  which renders its own "EGP" and its own sign. */
  amountText: string;
  /** True when the student owes money, so the screen can tint it. */
  isNegative: boolean;
}

/**
 * `formatCurrency` renders a minus ahead of the number ("EGP -120.5"), which
 * reads as part of the amount. Moving the sign in front of the currency makes
 * the debt unmistakable at a glance.
 */
function balanceLabel(amount: number): string {
  return amount < 0
    ? `-${formatCurrency(Math.abs(amount))}`
    : formatCurrency(amount);
}

export function toWalletBalance(dto: WalletBalanceDto): WalletBalance {
  const amount = dto.availableBalance ?? 0;
  return {
    studentSeasonId: dto.studentSeasonId,
    studentName: dto.studentName ?? "",
    amount,
    label: balanceLabel(amount),
    amountText: Math.abs(amount).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    }),
    isNegative: amount < 0,
  };
}

/** `select` for the all-students endpoint. An empty list is a valid result. */
export function selectWalletBalances(
  dtos: WalletBalanceDto[],
): WalletBalance[] {
  return (dtos ?? []).map(toWalletBalance);
}
