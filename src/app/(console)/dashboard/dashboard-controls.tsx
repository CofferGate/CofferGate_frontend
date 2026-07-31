"use client";

import { useEffect, useRef, useState } from "react";
import { IconPlayerPlay } from "@tabler/icons-react";
import {
  requestEvaluation,
  type EvaluationActionResult,
} from "./actions";

export function ExpiryCountdown({
  expiresAt,
  initialNow,
}: {
  expiresAt: string;
  initialNow: string;
}) {
  const [now, setNow] = useState(() => Date.parse(initialNow));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remainingSeconds = Math.max(
    0,
    Math.floor((Date.parse(expiresAt) - now) / 1000),
  );
  if (!Number.isFinite(remainingSeconds) || remainingSeconds <= 0) {
    return <span className="text-foreground-muted">만료됨</span>;
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  return (
    <span>
      {minutes > 0 ? `${minutes}분 ` : ""}
      {seconds}초 남음
    </span>
  );
}

export function EvaluationControl({
  dataMode,
  allowed,
}: {
  dataMode?: "mock" | "live";
  allowed: boolean;
}) {
  const idempotencyKey = useRef<string | null>(null);
  const pendingRequest = useRef(false);
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<EvaluationActionResult | null>(null);

  async function runEvaluation() {
    if (!allowed) {
      setResult({
        status: "error",
        message: "Operator 또는 Admin 권한이 필요합니다.",
        idempotencyKey: idempotencyKey.current ?? "",
      });
      return;
    }
    if (pendingRequest.current) return;
    const requestKey = idempotencyKey.current ?? crypto.randomUUID();
    idempotencyKey.current = requestKey;

    pendingRequest.current = true;
    setIsPending(true);
    try {
      const response = await requestEvaluation(requestKey);
      setResult(
        response.status === "conflict"
          ? {
              ...response,
              message: "이미 처리 중이거나 상태가 변경되었습니다.",
            }
          : response,
      );
    } catch {
      setResult({
        status: "error",
        message: "평가 요청을 준비하지 못했습니다.",
        idempotencyKey: idempotencyKey.current,
      });
    } finally {
      pendingRequest.current = false;
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        onClick={runEvaluation}
        disabled={isPending || !allowed}
        aria-describedby={!allowed ? "evaluation-permission-reason" : undefined}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border-strong bg-surface px-3 text-[11px] font-medium text-foreground hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-50"
      >
        <IconPlayerPlay size={13} stroke={1.8} aria-hidden="true" />
        {isPending ? "요청 준비 중" : "새 평가 실행"}
      </button>
      {dataMode === "mock" && (
        <span className="text-[9px] text-foreground-subtle">MOCK 평가</span>
      )}
      {!dataMode && (
        <span className="text-[9px] text-foreground-subtle">
          데이터 환경 확인 불가
        </span>
      )}
      {!allowed && (
        <span
          id="evaluation-permission-reason"
          className="text-[9px] text-foreground-subtle"
        >
          Operator 또는 Admin 권한 필요
        </span>
      )}
      {result && (
        <span
          className={`text-[10px] ${
            result.status === "conflict" || result.status === "error"
              ? "text-status-escalate"
              : "text-foreground-muted"
          }`}
        >
          {result.message}
        </span>
      )}
    </div>
  );
}
