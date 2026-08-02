import assert from "node:assert/strict";
import test from "node:test";
import { proposalSchema } from "../src/lib/domain";
import { groupRepeatedBlockedProposals } from "../src/app/(console)/proposals/group-proposals";
import blockedLimit from "../fixtures/blocked-limit.json";
import normalAuto from "../fixtures/normal-auto.json";

const blockedFixture = proposalSchema.parse(blockedLimit.data);
const autoFixture = proposalSchema.parse(normalAuto.data);

test("groups equivalent blocked proposals without hiding other outcomes", () => {
  const repeatedBlocked = {
    ...blockedFixture,
    proposalId: `${blockedFixture.proposalId}-repeat`,
    dataAsOf: "2026-08-02T12:00:00.000Z",
  };

  const groups = groupRepeatedBlockedProposals([
    repeatedBlocked,
    autoFixture,
    blockedFixture,
  ]);

  assert.equal(groups.length, 2);
  assert.equal(groups[0].proposal.proposalId, repeatedBlocked.proposalId);
  assert.deepEqual(
    groups[0].repeatedProposals.map((proposal) => proposal.proposalId),
    [blockedFixture.proposalId],
  );
  assert.equal(groups[1].proposal.proposalId, autoFixture.proposalId);
});

test("keeps blocked proposals separate when failed rules differ", () => {
  const differentRule = {
    ...blockedFixture,
    proposalId: `${blockedFixture.proposalId}-different`,
    ruleChecks: blockedFixture.ruleChecks.map((rule) =>
      rule.result === "FAIL" ? { ...rule, code: "DIFFERENT_RULE" } : rule,
    ),
  };

  const groups = groupRepeatedBlockedProposals([
    differentRule,
    blockedFixture,
  ]);

  assert.equal(groups.length, 2);
  assert.ok(groups.every((group) => group.repeatedProposals.length === 0));
});
