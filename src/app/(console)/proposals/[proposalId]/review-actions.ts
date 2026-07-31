"use server";

import { hasPermission, sessionProvider } from "@/lib/auth";
import { dataProvider } from "@/lib/data";

export interface ReviewActionResult {
  status: "unavailable" | "conflict" | "forbidden" | "invalid" | "error";
  message: string;
  idempotencyKey: string;
}

export async function submitProposalReview(input: {
  proposalId: string;
  expectedStatus: string;
  expectedPolicyVersion: string;
  intent: "approve" | "reject";
  reason: string;
  idempotencyKey: string;
}): Promise<ReviewActionResult> {
  const session = await sessionProvider.getSession();
  if (!hasPermission(session, "review:escalation")) {
    return {
      status: "forbidden",
      message: "ESCALATE 검토 권한이 없습니다.",
      idempotencyKey: input.idempotencyKey,
    };
  }
  if (!input.idempotencyKey.trim()) {
    return {
      status: "invalid",
      message: "Idempotency-Key가 필요합니다.",
      idempotencyKey: input.idempotencyKey,
    };
  }
  if (input.intent === "reject" && !input.reason.trim()) {
    return {
      status: "invalid",
      message: "거절 사유를 입력해주세요.",
      idempotencyKey: input.idempotencyKey,
    };
  }

  try {
    const [{ data: proposal }, { data: policy }] = await Promise.all([
      dataProvider.getProposal(input.proposalId),
      dataProvider.getCurrentPolicy(),
    ]);
    const changed =
      proposal.status !== input.expectedStatus ||
      proposal.status !== "ESCALATED" ||
      proposal.decision !== "ESCALATE" ||
      proposal.policyVersion !== input.expectedPolicyVersion;
    if (changed) {
      return {
        status: "conflict",
        message: "이미 처리되었거나 상태가 변경되었습니다.",
        idempotencyKey: input.idempotencyKey,
      };
    }
    if (!policy || policy.policyVersion !== proposal.policyVersion) {
      return {
        status: "conflict",
        message: "현재 정책 버전이 달라 새 평가가 필요합니다.",
        idempotencyKey: input.idempotencyKey,
      };
    }
    if (Date.parse(proposal.expiresAt) <= Date.now()) {
      return {
        status: "conflict",
        message: "제안이 만료되어 새 평가가 필요합니다.",
        idempotencyKey: input.idempotencyKey,
      };
    }

    return {
      status: "unavailable",
      message: "MOCK 검토 준비 상태 · 백엔드 연결 필요",
      idempotencyKey: input.idempotencyKey,
    };
  } catch {
    return {
      status: "error",
      message: "검토 요청을 준비하지 못했습니다.",
      idempotencyKey: input.idempotencyKey,
    };
  }
}
