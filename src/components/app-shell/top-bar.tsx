import {
  IconShieldCheck,
  IconWallet,
} from "@tabler/icons-react";
import type { ConsoleSnapshot } from "@/lib/domain";
import type { ConsoleSession } from "@/lib/auth";
import { MobileNavigation } from "./mobile-navigation";

export function TopBar({
  snapshot,
}: {
  snapshot: ConsoleSnapshot | null;
  session: ConsoleSession;
  now: string;
}) {
  const isProtectionActive = snapshot?.circuitBreaker === "ACTIVE";

  return (
    <header className="border-b border-border text-xs text-foreground-muted">
      <div className="mx-auto grid min-h-[57px] w-full max-w-shell grid-cols-1 gap-2 px-3 py-2.5 sm:px-7 md:flex md:flex-wrap md:items-center md:gap-x-3 md:gap-y-2 lg:px-10">
        <div className="flex min-w-0 items-center gap-1.5 md:contents">
          <MobileNavigation />

          <div className="flex shrink-0 items-center">
            <span
              className="rounded border border-border-strong bg-surface-raised px-2 py-0.5 text-[10px] font-medium tracking-[0.03em] text-foreground"
              title={
                snapshot
                  ? `${snapshot.network.toUpperCase()} · ${snapshot.dataMode.toUpperCase()}`
                  : "Devnet 상태 확인 불가"
              }
            >
              데모 환경
            </span>
          </div>

          <span
            aria-hidden
            className="hidden h-3 w-px bg-[#181a21] md:block"
          />

          <div
            className="ml-auto flex min-w-0 items-center gap-1.5 md:ml-0"
            aria-label={`보호 시스템 ${isProtectionActive ? "정상" : "중단"}`}
          >
            <IconShieldCheck
              size={14}
              stroke={1.75}
              className={
                isProtectionActive ? "text-status-auto" : "text-status-block"
              }
            />
            <span className="whitespace-nowrap text-[11px] text-foreground">
              보호 시스템
            </span>
            <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium">
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${
                  isProtectionActive ? "bg-status-auto" : "bg-status-block"
                }`}
              />
              <span
                className={
                  isProtectionActive ? "text-status-auto" : "text-status-block"
                }
              >
                {snapshot ? (isProtectionActive ? "정상" : "중단") : "N/A"}
              </span>
            </span>
          </div>
        </div>

        <span
          aria-hidden
          className="hidden h-3 w-px bg-[#181a21] md:block"
        />

        <div
          className="flex min-w-0 max-w-full flex-wrap items-center gap-x-2 gap-y-1 tabular-nums md:ml-auto md:w-auto"
          aria-label="운영 지갑"
        >
          <span className="flex max-w-full min-w-0 items-center gap-1.5 whitespace-nowrap">
            <IconWallet
              size={14}
              stroke={1.75}
              className="shrink-0 text-foreground-muted"
            />
            <span className="text-[11px] font-medium text-foreground-muted">
              운영 지갑
            </span>
            <span
              className="min-w-0 truncate font-mono text-[10px] text-foreground"
              title="Operations Wallet"
            >
              {snapshot?.operationsWallet.replace("…", "...") ?? "N/A"}
            </span>
          </span>
        </div>
      </div>
    </header>
  );
}
