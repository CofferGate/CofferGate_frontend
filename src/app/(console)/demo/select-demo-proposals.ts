import { isAutoExecutionComplete, type Proposal } from "@/lib/domain";

export interface DemoProposalSelection {
  autoProposal?: Proposal;
  blockedProposal?: Proposal;
  missingScenarios: Array<"RECONCILED" | "BLOCKED">;
}

export function selectDemoProposals(
  proposals: Proposal[],
): DemoProposalSelection {
  const autoProposal = proposals.find(isAutoExecutionComplete);
  const blockedProposal = proposals.find(
    (proposal) =>
      proposal.decision === "BLOCK" &&
      proposal.status === "BLOCKED" &&
      proposal.execution?.kmsRequested === false &&
      !proposal.execution.transactionSignature,
  );
  const missingScenarios: DemoProposalSelection["missingScenarios"] = [];

  if (!autoProposal) missingScenarios.push("RECONCILED");
  if (!blockedProposal) missingScenarios.push("BLOCKED");

  return { autoProposal, blockedProposal, missingScenarios };
}
