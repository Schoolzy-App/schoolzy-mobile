import type { WalletBalanceDto, WalletBalancesDto } from "@/types/api";

import { request } from "./client";
import { ROUTES } from "./config";

export const walletApi = {
  /** GET /api/mobile/wallet/{studentSeasonId}/balance */
  balance(studentSeasonId: number): Promise<WalletBalanceDto> {
    return request<WalletBalanceDto>({
      method: "GET",
      url: ROUTES.wallet.balance(studentSeasonId),
    });
  },

  /** GET /api/mobile/wallet/balances — all accessible students. */
  balances(): Promise<WalletBalancesDto> {
    return request<WalletBalancesDto>({
      method: "GET",
      url: ROUTES.wallet.balances,
    });
  },
};
