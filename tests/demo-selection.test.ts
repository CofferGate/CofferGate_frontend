import assert from "node:assert/strict";
import test from "node:test";
import { proposalSchema } from "../src/lib/domain";
import { selectDemoProposals } from "../src/app/(console)/demo/select-demo-proposals";
import normalAuto from "../fixtures/normal-auto.json";
import blockedLimit from "../fixtures/blocked-limit.json";

const autoFixture = proposalSchema.parse(normalAuto.data);
const blockedFixture = proposalSchema.parse(blockedLimit.data);

test("selects live RECONCILED and BLOCKED demo proposals", () => {
  const selection = selectDemoProposals([blockedFixture, autoFixture]);

  assert.equal(selection.autoProposal?.proposalId, autoFixture.proposalId);
  assert.equal(selection.blockedProposal?.proposalId, blockedFixture.proposalId);
  assert.deepEqual(selection.missingScenarios, []);
});

test("reports each missing live demo scenario", () => {
  const selection = selectDemoProposals([]);

  assert.deepEqual(selection.missingScenarios, ["RECONCILED", "BLOCKED"]);
});
