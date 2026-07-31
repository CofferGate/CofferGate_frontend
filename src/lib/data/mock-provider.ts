import {
  apiResponseSchema,
  policySchema,
  proposalSchema,
  systemReadinessSchema,
  ApiError,
  type ApiMeta,
  type Policy,
  type Proposal,
  type SystemReadiness,
} from "@/lib/domain";
import type { DataProvider } from "./provider";

import normalAuto from "@fixtures/normal-auto.json";
import blockedLimit from "@fixtures/blocked-limit.json";
import blockedProgram from "@fixtures/blocked-program.json";
import escalated from "@fixtures/escalated.json";
import rpcUnknown from "@fixtures/rpc-unknown.json";
import currentPolicy from "@fixtures/current-policy.json";
import systemReadiness from "@fixtures/system-readiness.json";

const proposalResponseSchema = apiResponseSchema(proposalSchema);
const policyResponseSchema = apiResponseSchema(policySchema.nullable());
const systemReadinessResponseSchema = apiResponseSchema(
  systemReadinessSchema.nullable(),
);

const RAW_FIXTURES: unknown[] = [
  normalAuto,
  blockedLimit,
  blockedProgram,
  escalated,
  rpcUnknown,
];

function parseFixture(raw: unknown): { proposal: Proposal; meta: ApiMeta } {
  const result = proposalResponseSchema.safeParse(raw);
  if (!result.success) {
    // SPEC 17: never render invalid data as if it were normal.
    // SPEC 24: this is where a schema_validation_failed telemetry event
    // would be recorded once analytics is wired up.
    console.error("[mock-provider] fixture failed schema validation", result.error.issues);
    throw new ApiError({
      code: "SCHEMA_VALIDATION_FAILED",
      message: "Mock fixture failed schema validation.",
      retryable: false,
      requestId: "req_mock_schema_error",
    });
  }
  return { proposal: result.data.data, meta: result.data.meta };
}

const FIXTURES_BY_ID = new Map(
  RAW_FIXTURES.map((raw) => {
    const parsed = parseFixture(raw);
    return [parsed.proposal.proposalId, parsed] as const;
  }),
);

function createMockMeta(): ApiMeta {
  return {
    requestId: `req_mock_${Math.random().toString(36).slice(2, 10)}`,
    generatedAt: new Date().toISOString(),
    environment: "mock",
  };
}

function parsePolicyFixture(raw: unknown): {
  policy: Policy | null;
  meta: ApiMeta;
} {
  const result = policyResponseSchema.safeParse(raw);
  if (!result.success) {
    console.error(
      "[mock-provider] policy fixture failed schema validation",
      result.error.issues,
    );
    throw new ApiError({
      code: "SCHEMA_VALIDATION_FAILED",
      message: "Mock policy fixture failed schema validation.",
      retryable: false,
      requestId: "req_mock_policy_schema_error",
    });
  }
  return { policy: result.data.data, meta: result.data.meta };
}

const CURRENT_POLICY = parsePolicyFixture(currentPolicy);

function parseSystemReadinessFixture(raw: unknown): {
  readiness: SystemReadiness | null;
  meta: ApiMeta;
} {
  const result = systemReadinessResponseSchema.safeParse(raw);
  if (!result.success) {
    console.error(
      "[mock-provider] readiness fixture failed schema validation",
      result.error.issues,
    );
    throw new ApiError({
      code: "SCHEMA_VALIDATION_FAILED",
      message: "Mock system readiness fixture failed schema validation.",
      retryable: false,
      requestId: "req_mock_readiness_schema_error",
    });
  }
  return { readiness: result.data.data, meta: result.data.meta };
}

const SYSTEM_READINESS = parseSystemReadinessFixture(systemReadiness);

export const mockDataProvider: DataProvider = {
  async listProposals() {
    return {
      data: Array.from(FIXTURES_BY_ID.values()).map((entry) => entry.proposal),
      meta: createMockMeta(),
    };
  },

  async getProposal(proposalId) {
    const entry = FIXTURES_BY_ID.get(proposalId);
    if (!entry) {
      throw new ApiError({
        code: "PROPOSAL_NOT_FOUND",
        message: `Proposal ${proposalId} was not found.`,
        retryable: false,
        proposalId,
        requestId: `req_mock_${Math.random().toString(36).slice(2, 10)}`,
      });
    }
    return { data: entry.proposal, meta: entry.meta };
  },

  async getCurrentPolicy() {
    return {
      data: CURRENT_POLICY.policy,
      meta: CURRENT_POLICY.meta,
    };
  },

  async getSystemReadiness() {
    if (!SYSTEM_READINESS.readiness) {
      return {
        data: null,
        meta: SYSTEM_READINESS.meta,
      };
    }

    const checkedAt = new Date().toISOString();
    return {
      data: {
        ...SYSTEM_READINESS.readiness,
        checkedAt,
        services: SYSTEM_READINESS.readiness.services.map((service) => ({
          ...service,
          checkedAt,
        })),
      },
      meta: {
        ...SYSTEM_READINESS.meta,
        generatedAt: checkedAt,
      },
    };
  },
};
