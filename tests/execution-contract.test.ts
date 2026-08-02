import assert from "node:assert/strict";
import test from "node:test";
import {
  apiResponseSchema,
  formatAtomicTokenAmount,
  formatDemoTokenBalance,
  getFailedExecutionEvidence,
  getTransactionExplorerUrl,
  isAutoExecutionComplete,
  proposalSchema,
} from "../src/lib/domain";
import normalAuto from "../fixtures/normal-auto.json";

const baseProposal = apiResponseSchema(proposalSchema).parse(normalAuto).data;

test("RECONCILED AUTO completion uses execution and reconciliation evidence", () => {
  const proposal = proposalSchema.parse({
    ...baseProposal,
    proposalId: "devnet-reconciled-contract-test",
    status: "RECONCILED",
    decision: "AUTO",
    execution: {
      mode: "demo",
      routeLabel: "Devnet SPL Token TransferChecked",
      simulation: { ok: true, unitsConsumed: 1234 },
      kmsRequested: true,
      kmsKeyVersion: "projects/example/locations/global/keyRings/demo/cryptoKeys/signer/cryptoKeyVersions/1",
      transactionSignature: "DevnetTransactionSignature",
      submittedAt: "2026-08-02T02:44:10.000Z",
      confirmedAt: "2026-08-02T02:44:12.000Z",
      commitment: "confirmed",
      outputTokenAccount: "DevnetOutputTokenAccount",
      beforeOutputBalanceAtomic: "0",
      expectedOutputDeltaAtomic: "1000000",
      reconciliation: {
        beforeBalance: "0",
        afterBalance: "1000000",
        expectedDelta: "1000000",
        actualDelta: "1000000",
        status: "MATCHED",
      },
    },
  });

  assert.equal(isAutoExecutionComplete(proposal), true);
  assert.equal(proposal.execution?.attestationSignature, undefined);
  assert.equal(proposal.execution?.routeLabel, "Devnet SPL Token TransferChecked");
  assert.equal(proposal.execution?.outputTokenAccount, "DevnetOutputTokenAccount");
});

test("legacy SIMULATED proposal remains parseable but is not new-flow complete", () => {
  const proposal = proposalSchema.parse({
    ...baseProposal,
    status: "SIMULATED",
    execution: {
      ...baseProposal.execution,
      kmsRequested: true,
      attestationSignature: "LegacyAttestation",
      attestedAt: "2026-08-02T00:00:00.000Z",
      transactionSignature: undefined,
      reconciliation: undefined,
    },
  });

  assert.equal(proposal.status, "SIMULATED");
  assert.equal(proposal.execution?.attestationSignature, "LegacyAttestation");
  assert.equal(isAutoExecutionComplete(proposal), false);
});

test("FAILED execution preserves failure evidence and is never complete", () => {
  const proposal = proposalSchema.parse({
    ...baseProposal,
    proposalId: "devnet-failed-contract-test",
    status: "FAILED",
    execution: {
      routeLabel: "Devnet SPL Token TransferChecked",
      simulation: { ok: false, error: "simulation rejected" },
      kmsRequested: false,
      failure: {
        code: "SIMULATION_FAILED",
        message: "The Devnet simulation failed.",
        observedAt: "2026-08-02T03:00:00.000Z",
      },
    },
  });

  assert.equal(proposal.execution?.failure?.code, "SIMULATION_FAILED");
  assert.equal(proposal.execution?.kmsRequested, false);
  assert.equal(proposal.execution?.transactionSignature, undefined);
  assert.equal(isAutoExecutionComplete(proposal), false);
  assert.deepEqual(getFailedExecutionEvidence(proposal), {
    code: "SIMULATION_FAILED",
    message: "The Devnet simulation failed.",
    observedAt: "2026-08-02T03:00:00.000Z",
    kmsRequested: false,
    hasTransactionSignature: false,
  });
});

test("Devnet Explorer URL uses the complete transaction signature", () => {
  const signature = "5ZjLiPtyKzEQirr2j7PCpRUCv1UZa3B7bJeXGEmtfWqjwkyGW9cUMfKhYXn7wafy7EtcXBvztcjAxGXybLkyfzgT";
  assert.equal(
    getTransactionExplorerUrl(signature, "devnet"),
    `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
  );
  assert.equal(getTransactionExplorerUrl(undefined, "devnet"), null);
  assert.equal(getTransactionExplorerUrl(signature, "mock"), null);
});

test("demo-token atomic formatting preserves integer precision", () => {
  assert.equal(formatAtomicTokenAmount("1000000"), "1");
  assert.equal(formatAtomicTokenAmount("1"), "0.000001");
  assert.equal(
    formatAtomicTokenAmount("900719925474099312345678"),
    "900719925474099312.345678",
  );
  assert.equal(
    formatDemoTokenBalance("1000000"),
    "1 demo token (1000000 atomic)",
  );
  assert.equal(formatDemoTokenBalance("0.512 SOL"), "0.512 SOL");
});
