export type ActivityEventCode =
  | "PROPOSAL_CREATED"
  | "AI_REVIEW_COMPLETED"
  | "POLICY_DECIDED"
  | "EXECUTION_CLAIMED"
  | "SIMULATION_SUCCEEDED"
  | "KMS_REQUESTED"
  | "TRANSACTION_SUBMITTED"
  | "TRANSACTION_CONFIRMED"
  | "RECONCILED"
  | "BLOCKED"
  | "FAILED";

export type ActivityEvidenceStatus =
  | "complete"
  | "progress"
  | "blocked"
  | "failed"
  | "incomplete";

export interface ActivityEvent {
  code: ActivityEventCode;
  technicalState: string;
  label: string;
  occurredAt?: string;
  proposalId: string;
  details: string[];
  evidenceStatus: ActivityEvidenceStatus;
  sequence: number;
  transactionSignature?: string;
  explorer?: {
    network: string;
    url: string;
  };
}

export interface ProposalActivityGroup {
  proposalId: string;
  sortAt?: string;
  events: ActivityEvent[];
}
