import { z } from "zod";
import {
  apiResponseSchema,
  policySchema,
  proposalSchema,
  systemReadinessSchema,
} from "@/lib/domain";
import { callBackend } from "./coffergate-backend";
import type { DataProvider } from "./provider";

export const realDataProvider: DataProvider = {
  async listProposals() {
    const response = await callBackend<unknown>("/api/v1/proposals");
    return apiResponseSchema(z.array(proposalSchema)).parse(response);
  },
  async getProposal(proposalId) {
    const response = await callBackend<unknown>(
      `/api/v1/proposals/${encodeURIComponent(proposalId)}`,
    );
    return apiResponseSchema(proposalSchema).parse(response);
  },
  async getCurrentPolicy() {
    const response = await callBackend<unknown>("/api/v1/policy/current");
    return apiResponseSchema(policySchema.nullable()).parse(response);
  },
  async getSystemReadiness() {
    const response = await callBackend<unknown>("/api/v1/system/readiness");
    return apiResponseSchema(systemReadinessSchema).parse(response);
  },
};
