import type { Proposal } from "@/lib/domain";

export interface ProposalGroup {
  key: string;
  proposal: Proposal;
  repeatedProposals: Proposal[];
}

function failedRuleCodes(proposal: Proposal) {
  return proposal.ruleChecks
    .filter((rule) => rule.result === "FAIL")
    .map((rule) => rule.code)
    .sort((left, right) => left.localeCompare(right));
}

function blockedProposalFingerprint(proposal: Proposal) {
  if (proposal.status !== "BLOCKED" || proposal.decision !== "BLOCK") {
    return null;
  }

  return JSON.stringify({
    action: proposal.action,
    inputMint: proposal.inputMint ?? null,
    outputMint: proposal.outputMint ?? null,
    amountAtomic: proposal.amountAtomic ?? null,
    amountUsd: proposal.amountUsd ?? null,
    policyVersion: proposal.policyVersion,
    failedRuleCodes: failedRuleCodes(proposal),
  });
}

export function groupRepeatedBlockedProposals(
  proposals: Proposal[],
): ProposalGroup[] {
  const groupedByFingerprint = new Map<string, Proposal[]>();

  for (const proposal of proposals) {
    const fingerprint = blockedProposalFingerprint(proposal);
    if (!fingerprint) continue;
    const group = groupedByFingerprint.get(fingerprint) ?? [];
    group.push(proposal);
    groupedByFingerprint.set(fingerprint, group);
  }

  const emittedFingerprints = new Set<string>();
  return proposals.flatMap((proposal) => {
    const fingerprint = blockedProposalFingerprint(proposal);
    if (!fingerprint) {
      return [{ key: proposal.proposalId, proposal, repeatedProposals: [] }];
    }
    if (emittedFingerprints.has(fingerprint)) return [];

    emittedFingerprints.add(fingerprint);
    const matchingProposals = groupedByFingerprint.get(fingerprint) ?? [proposal];
    return [
      {
        key: `blocked:${fingerprint}`,
        proposal,
        repeatedProposals: matchingProposals.slice(1),
      },
    ];
  });
}
