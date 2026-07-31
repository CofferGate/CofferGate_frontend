import type {
  ApiResponse,
  Policy,
  Proposal,
  SystemReadiness,
} from "@/lib/domain";

/**
 * Contract every data source (mock fixtures now, real API later) must
 * satisfy. Per SPEC 26, swapping the implementation must not require
 * changing the components that call these methods.
 */
export interface DataProvider {
  listProposals(): Promise<ApiResponse<Proposal[]>>;
  getProposal(proposalId: string): Promise<ApiResponse<Proposal>>;
  getCurrentPolicy(): Promise<ApiResponse<Policy | null>>;
  getSystemReadiness(): Promise<ApiResponse<SystemReadiness | null>>;
}
