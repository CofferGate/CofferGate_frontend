import type { ApiEnvironment } from "./api";
import type { Proposal } from "./proposal";

export const DEMO_TOKEN_DECIMALS = 6;

export interface FailedExecutionEvidence {
  code?: string;
  message?: string;
  observedAt?: string;
  kmsRequested: boolean;
  hasTransactionSignature: boolean;
}

export function isAutoExecutionComplete(proposal: Proposal): boolean {
  const execution = proposal.execution;

  return Boolean(
    proposal.decision === "AUTO" &&
      proposal.status === "RECONCILED" &&
      execution?.simulation?.ok === true &&
      execution.kmsRequested === true &&
      execution.transactionSignature &&
      (execution.commitment === "confirmed" ||
        execution.commitment === "finalized") &&
      execution.reconciliation?.status === "MATCHED",
  );
}

export function getFailedExecutionEvidence(
  proposal: Proposal,
): FailedExecutionEvidence | null {
  if (proposal.status !== "FAILED" || !proposal.execution) return null;

  return {
    code: proposal.execution.failure?.code,
    message: proposal.execution.failure?.message,
    observedAt: proposal.execution.failure?.observedAt,
    kmsRequested: proposal.execution.kmsRequested,
    hasTransactionSignature: Boolean(proposal.execution.transactionSignature),
  };
}

export function getTransactionExplorerUrl(
  transactionSignature: string | undefined,
  environment: ApiEnvironment,
): string | null {
  if (!transactionSignature) return null;

  const encodedSignature = encodeURIComponent(transactionSignature);
  if (environment === "devnet") {
    return `https://explorer.solana.com/tx/${encodedSignature}?cluster=devnet`;
  }
  if (environment === "mainnet-beta") {
    return `https://explorer.solana.com/tx/${encodedSignature}`;
  }
  return null;
}

export function formatAtomicTokenAmount(
  atomicValue: string,
  decimals = DEMO_TOKEN_DECIMALS,
): string {
  if (!/^-?\d+$/.test(atomicValue) || decimals < 0) return atomicValue;

  const negative = atomicValue.startsWith("-");
  const digits = (negative ? atomicValue.slice(1) : atomicValue)
    .replace(/^0+(?=\d)/, "")
    .padStart(decimals + 1, "0");
  const integer = decimals === 0 ? digits : digits.slice(0, -decimals);
  const fraction =
    decimals === 0 ? "" : digits.slice(-decimals).replace(/0+$/, "");
  const value = fraction ? `${integer}.${fraction}` : integer;

  return negative && value !== "0" ? `-${value}` : value;
}

export function formatDemoTokenBalance(atomicValue: string): string {
  if (!/^-?\d+$/.test(atomicValue)) return atomicValue;
  return `${formatAtomicTokenAmount(atomicValue)} demo token (${atomicValue} atomic)`;
}
