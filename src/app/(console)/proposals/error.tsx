"use client";

import { IconAlertTriangle } from "@tabler/icons-react";

export default function ProposalsError({ reset }: { reset: () => void }) {
  return (
    <div>
      <h1 className="text-2xl font-medium text-foreground">제안</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        AI가 생성한 제안과 정책 판정 결과를 확인합니다.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-status-block/25 bg-status-block-subtle px-5 py-4">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <IconAlertTriangle
            size={17}
            stroke={1.7}
            className="text-status-block"
            aria-hidden="true"
          />
          제안 데이터를 불러오지 못했습니다.
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
