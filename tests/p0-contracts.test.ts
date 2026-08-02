import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import {
  apiResponseSchema,
  consoleSnapshotSchema,
  policySchema,
  proposalSchema,
  systemReadinessSchema,
} from "../src/lib/domain";
import normalAuto from "../fixtures/normal-auto.json";
import currentPolicy from "../fixtures/current-policy.json";
import systemReadiness from "../fixtures/system-readiness.json";

const meta = {
  requestId: "req-contract-test",
  generatedAt: "2026-08-02T00:00:00.000Z",
  environment: "devnet" as const,
};

test("GET /api/v1/dashboard envelope validates", () => {
  const result = apiResponseSchema(consoleSnapshotSchema).parse({
    data: {
      network: "devnet",
      dataMode: "live",
      circuitBreaker: "ACTIVE",
      operationsWallet: "DevnetWalletAddress",
      balances: { sol: "1.25", usdc: "100.00" },
      targetUsdcBalance: "250.00",
      dailyUsageUsd: 0,
      dailyLimitUsd: 500,
      policyVersion: "policy-devnet-v1",
      allowedAssets: ["SOL", "USDC"],
      lastSyncedAt: meta.generatedAt,
    },
    meta,
  });
  assert.equal(result.data.dataMode, "live");
});

test("GET /api/v1/proposals envelope validates", () => {
  const proposal = apiResponseSchema(proposalSchema).parse(normalAuto).data;
  assert.equal(
    apiResponseSchema(z.array(proposalSchema)).parse({ data: [proposal], meta })
      .data.length,
    1,
  );
});

test("GET /api/v1/proposals/:proposalId accepts SIMULATED attestation", () => {
  const base = apiResponseSchema(proposalSchema).parse(normalAuto).data;
  const response = apiResponseSchema(proposalSchema).parse({
    data: {
      ...base,
      status: "SIMULATED",
      decision: "AUTO",
      execution: {
        ...base.execution,
        kmsRequested: true,
        attestationSignature: "MEUCIQDevnetAttestation",
        attestedAt: meta.generatedAt,
        transactionSignature: undefined,
        reconciliation: undefined,
      },
    },
    meta,
  });
  assert.equal(response.data.status, "SIMULATED");
  assert.equal(response.data.execution?.attestationSignature, "MEUCIQDevnetAttestation");
});

test("GET /api/v1/policy/current envelope validates", () => {
  assert.ok(apiResponseSchema(policySchema.nullable()).parse(currentPolicy).data);
});

test("GET /api/v1/system/readiness envelope validates", () => {
  assert.equal(
    apiResponseSchema(systemReadinessSchema).parse(systemReadiness).data.network,
    "devnet",
  );
});
