"use server";

import { hasPermission, sessionProvider } from "@/lib/auth";

export interface EvaluationActionResult {
  status: "accepted" | "conflict" | "unavailable" | "error";
  message: string;
  idempotencyKey: string;
}

export async function requestEvaluation(
  idempotencyKey: string,
): Promise<EvaluationActionResult> {
  const session = await sessionProvider.getSession();
  if (!hasPermission(session, "request:evaluation")) {
    return {
      status: "error",
      message: "평가 요청 권한이 없습니다.",
      idempotencyKey,
    };
  }
  if (!idempotencyKey.trim()) {
    return {
      status: "error",
      message: "Idempotency-Key가 필요합니다.",
      idempotencyKey,
    };
  }
  // POST /api/v1/evaluations 백엔드가 연결되기 전에는 성공 응답을 만들지 않는다.
  return {
    status: "unavailable",
    message: "MOCK 평가 준비 상태 · 백엔드 연결 필요",
    idempotencyKey,
  };
}
