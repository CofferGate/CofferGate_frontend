import { z } from "zod";

export const proposalStatusSchema = z.enum([
  "OBSERVED",
  "PROPOSED",
  "AI_REVIEWED",
  "POLICY_APPROVED",
  "SIMULATED",
  "ESCALATED",
  "BLOCKED",
  "EXECUTING",
  "SUBMITTED",
  "CONFIRMED",
  "FAILED",
  "EXPIRED",
  "RECONCILED",
]);
export type ProposalStatus = z.infer<typeof proposalStatusSchema>;

export const policyDecisionSchema = z.enum(["AUTO", "ESCALATE", "BLOCK"]);
export type PolicyDecision = z.infer<typeof policyDecisionSchema>;

export const proposalActionSchema = z.enum(["NO_ACTION", "SWAP"]);
export type ProposalAction = z.infer<typeof proposalActionSchema>;

export const assetSymbolSchema = z.enum(["SOL", "USDC"]);
export type AssetSymbol = z.infer<typeof assetSymbolSchema>;

export const ruleCheckResultSchema = z.enum(["PASS", "REVIEW", "FAIL"]);
export type RuleCheckResult = z.infer<typeof ruleCheckResultSchema>;

export const evidenceSourceTypeSchema = z.enum([
  "PRICE_FEED",
  "ONCHAIN_BALANCE",
  "MARKET_DATA",
  "POLICY_DOCUMENT",
]);
export type EvidenceSourceType = z.infer<typeof evidenceSourceTypeSchema>;

export const commitmentLevelSchema = z.enum([
  "processed",
  "confirmed",
  "finalized",
]);
export type CommitmentLevel = z.infer<typeof commitmentLevelSchema>;

export const reconciliationStatusSchema = z.enum([
  "MATCHED",
  "MISMATCHED",
  "PENDING",
]);
export type ReconciliationStatus = z.infer<typeof reconciliationStatusSchema>;
