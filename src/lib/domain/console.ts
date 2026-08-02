import { z } from "zod";
import { circuitBreakerStatusSchema } from "./policy";

export type ConsoleNetwork = "devnet";
export type ConsoleDataMode = "mock" | "live";
export type CircuitBreakerStatus = "ACTIVE" | "HALTED";

export const consoleSnapshotSchema = z.object({
  network: z.literal("devnet"),
  dataMode: z.enum(["mock", "live"]),
  circuitBreaker: circuitBreakerStatusSchema,
  operationsWallet: z.string(),
  balances: z.object({
    sol: z.string().optional(),
    usdc: z.string().optional(),
  }),
  targetUsdcBalance: z.string().optional(),
  dailyUsageUsd: z.number().optional(),
  dailyLimitUsd: z.number().optional(),
  policyVersion: z.string(),
  allowedAssets: z.array(z.string()),
  lastSyncedAt: z.string().optional(),
});

export type ConsoleSnapshot = z.infer<typeof consoleSnapshotSchema>;
