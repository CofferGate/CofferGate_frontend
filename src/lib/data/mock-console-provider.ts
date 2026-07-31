import { ApiError, type CircuitBreakerStatus } from "@/lib/domain";
import type { ConsoleStateProvider } from "./console-provider";
import { mockDataProvider } from "./mock-provider";

const OPERATIONS_WALLET = "8x7k…93Zp";

function balanceFromReconciliation(
  afterBalance: string | undefined,
  symbol: "SOL" | "USDC",
) {
  if (!afterBalance) return undefined;
  const match = afterBalance.match(
    new RegExp(`([\\d,.]+)\\s*${symbol}(?:\\s|$)`, "i"),
  );
  return match?.[1];
}

function circuitBreakerFromFixture(actual: unknown): CircuitBreakerStatus {
  if (actual === "ACTIVE" || actual === "HALTED") return actual;
  throw new ApiError({
    code: "SCHEMA_VALIDATION_FAILED",
    message: "Console fixture has no valid Circuit Breaker state.",
    retryable: false,
    requestId: "req_mock_console_state_error",
  });
}

export const mockConsoleStateProvider: ConsoleStateProvider = {
  async getConsoleSnapshot() {
    const { data: proposal, meta } = await mockDataProvider.getProposal(
      "prop_normal_auto_0001",
    );
    const allowedAssetsRule = proposal.ruleChecks.find(
      (rule) => rule.code === "ALLOWED_MINT",
    );
    const circuitBreakerRule = proposal.ruleChecks.find(
      (rule) => rule.code === "CIRCUIT_BREAKER",
    );
    const dailyLimitRule = proposal.ruleChecks.find(
      (rule) => rule.code === "DAILY_LIMIT",
    );
    const afterBalance = proposal.execution?.reconciliation?.afterBalance;
    const targetUsdcBalance = proposal.rationale.match(
      /목표치\(([\d,.]+)\s*USDC\)/i,
    )?.[1];

    return {
      network: "devnet",
      dataMode: "mock",
      circuitBreaker: circuitBreakerFromFixture(circuitBreakerRule?.actual),
      operationsWallet: OPERATIONS_WALLET,
      balances: {
        sol: balanceFromReconciliation(afterBalance, "SOL"),
        usdc: balanceFromReconciliation(afterBalance, "USDC"),
      },
      targetUsdcBalance,
      dailyUsageUsd:
        typeof dailyLimitRule?.actual === "number"
          ? dailyLimitRule.actual
          : undefined,
      dailyLimitUsd:
        typeof dailyLimitRule?.expected === "number"
          ? dailyLimitRule.expected
          : undefined,
      policyVersion: proposal.policyVersion,
      allowedAssets:
        typeof allowedAssetsRule?.actual === "string"
          ? allowedAssetsRule.actual
              .split(",")
              .map((asset) => asset.trim())
              .filter(Boolean)
          : [],
      lastSyncedAt: meta.generatedAt,
      meta,
    };
  },
};
