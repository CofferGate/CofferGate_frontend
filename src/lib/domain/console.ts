import type { ApiMeta } from "./api";

export type ConsoleNetwork = "devnet";
export type ConsoleDataMode = "mock" | "live";
export type CircuitBreakerStatus = "ACTIVE" | "HALTED";

export interface ConsoleSnapshot {
  network: ConsoleNetwork;
  dataMode: ConsoleDataMode;
  circuitBreaker: CircuitBreakerStatus;
  operationsWallet: string;
  balances: {
    sol?: string;
    usdc?: string;
  };
  targetUsdcBalance?: string;
  dailyUsageUsd?: number;
  dailyLimitUsd?: number;
  policyVersion: string;
  allowedAssets: string[];
  lastSyncedAt?: string;
  meta: ApiMeta;
}
