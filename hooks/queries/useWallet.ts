import { useQuery } from "@tanstack/react-query";

import { walletApi } from "@/services/api";
import { selectWalletBalances, toWalletBalance } from "@/services/mappers";
import type { WalletBalance } from "@/services/mappers";
import type { WalletBalanceDto } from "@/types/api";

import { queryKeys } from "./queryKeys";

/**
 * GET /api/mobile/wallet/{studentSeasonId}/balance
 *
 * Not cached: a balance shown next to a Pay button has to be current, and it
 * moves every time the student buys something.
 */
export function useWalletBalance(studentSeasonId?: number, enabled = true) {
  return useQuery<WalletBalanceDto, Error, WalletBalance>({
    queryKey: queryKeys.wallet.balance(studentSeasonId ?? 0),
    queryFn: () => walletApi.balance(studentSeasonId as number),
    select: toWalletBalance,
    staleTime: 0,
    enabled: enabled && typeof studentSeasonId === "number",
  });
}

/** GET /api/mobile/wallet/balances — one row per accessible student. */
export function useWalletBalances(enabled = true) {
  return useQuery<WalletBalanceDto[], Error, WalletBalance[]>({
    queryKey: queryKeys.wallet.balances(),
    queryFn: () => walletApi.balances(),
    select: selectWalletBalances,
    staleTime: 0,
    enabled,
  });
}
