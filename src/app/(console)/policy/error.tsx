"use client";

import { IconAlertTriangle } from "@tabler/icons-react";

export default function PolicyError({
  error,
  reset,
}: {
  error: Error & { code?: string };
  reset: () => void;
}) {
  const schemaFailed =
    error.code === "SCHEMA_VALIDATION_FAILED" ||
    error.message.toLowerCase().includes("schema");

  return (
    <div className="pt-2">
      <h1 className="text-[22px] font-semibold leading-tight text-foreground">
        운영 정책
      </h1>
      <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-status-block/25 bg-status-block-subtle px-5 py-4">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <IconAlertTriangle size={17} stroke={1.7} className="text-status-block" />
          {schemaFailed
            ? "정책 데이터 형식 검증에 실패했습니다."
            : "정책 데이터를 불러오지 못했습니다."}
        </div>
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-raised"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
