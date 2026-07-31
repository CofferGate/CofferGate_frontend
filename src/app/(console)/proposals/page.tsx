import { dataProvider } from "@/lib/data";
import { ProposalQueue } from "./proposal-queue";

export default async function ProposalsPage() {
  const { data: proposals, meta } = await dataProvider.listProposals();

  return (
    <ProposalQueue
      proposals={proposals}
      environment={meta.environment}
      now={new Date().toISOString()}
    />
  );
}
