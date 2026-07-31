"use client";

import Link from "next/link";
import { IconAlertTriangle, IconArrowLeft } from "@tabler/icons-react";

export default function DemoError({ reset }: { reset: () => void }) {
  return (
    <div className="pt-2">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-foreground-muted hover:text-foreground"
      >
        <IconArrowLeft size={14} stroke={1.7} />
        홈으로
      </Link>
      <h1 className="mt-3 text-[22px] font-semibold leading-tight text-foreground">
        CofferGate 작동 방식
      </h1>
      <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-status-block/25 bg-status-block-subtle px-5 py-4">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <IconAlertTriangle size={17} stroke={1.7} className="text-status-block" />
          데모 시나리오 데이터를 불러오지 못했습니다.
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
