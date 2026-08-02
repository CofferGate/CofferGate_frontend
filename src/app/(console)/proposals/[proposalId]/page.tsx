import { notFound } from "next/navigation";
import { ApiError } from "@/lib/domain";
import { dataProvider } from "@/lib/data";
import { ProposalDetail } from "./proposal-detail";
import { sessionProvider } from "@/lib/auth";

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ proposalId: string }>;
}) {
  const { proposalId } = await params;

  try {
    const { data: proposal, meta } = await dataProvider.getProposal(
      proposalId,
    );
    const [{ data: currentPolicy }, session] = await Promise.all([
      dataProvider.getCurrentPolicy(),
      sessionProvider.getSession(),
    ]);

    return (
      <ProposalDetail
        proposal={proposal}
        environment={meta.environment}
        currentPolicyVersion={currentPolicy?.policyVersion}
        session={session}
        now={new Date().toISOString()}
      />
    );
  } catch (error) {
    if (error instanceof ApiError && error.code === "PROPOSAL_NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}
