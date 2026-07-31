import Link from "next/link";
import type { ReactNode } from "react";
import {
  IconAlertTriangle,
  IconBolt,
  IconCircleCheck,
  IconCoin,
  IconFileText,
  IconHelpCircle,
  IconShieldCheck,
  IconX,
} from "@tabler/icons-react";
import { consoleStateProvider, dataProvider } from "@/lib/data";
import type {
  PolicyDecision,
  ProposalStatus,
  ServiceReadinessStatus,
  SystemServiceId,
} from "@/lib/domain";
import { decisionTextClass, statusVisual } from "@/lib/ui/status-visual";
import { EvaluationControl, ExpiryCountdown } from "./dashboard-controls";
import { hasPermission, sessionProvider } from "@/lib/auth";

function AutomationTile({
  icon,
  label,
  value,
  valueClassName,
  code,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
  code?: string;
}) {
  return (
    <div className="rounded-lg border border-border/80 bg-surface px-4 py-3.5">
      <div className="flex items-center gap-2 text-foreground-muted">
        {icon}
        <span className="text-[11px] font-normal">{label}</span>
      </div>
      <div
        className={`mt-1.5 text-[13px] font-medium tracking-[-0.01em] ${valueClassName ?? "text-foreground"}`}
      >
        {value}
        {code && (
          <span className="ml-1.5 font-mono text-[9px] font-normal text-foreground-subtle">
            {code}
          </span>
        )}
      </div>
    </div>
  );
}

const SYSTEM_SERVICE_NAMES: Record<SystemServiceId, string> = {
  "control-plane": "Control Plane",
  "vertex-ai": "Vertex AI",
  firestore: "Firestore",
  "private-executor": "Private Executor",
  "cloud-kms": "Cloud KMS",
  "jupiter-api": "Jupiter API",
  "solana-rpc": "Solana RPC",
};

const READINESS_PRESENTATION: Record<
  ServiceReadinessStatus,
  {
    label: string;
    dotClassName: string;
    icon: typeof IconCircleCheck;
    iconClassName: string;
  }
> = {
  healthy: {
    label: "정상",
    dotClassName: "bg-status-auto",
    icon: IconCircleCheck,
    iconClassName: "text-status-auto",
  },
  degraded: {
    label: "지연",
    dotClassName: "bg-status-escalate",
    icon: IconAlertTriangle,
    iconClassName: "text-status-escalate",
  },
  down: {
    label: "중단",
    dotClassName: "bg-status-block",
    icon: IconX,
    iconClassName: "text-status-block",
  },
  unknown: {
    label: "확인 불가",
    dotClassName: "bg-status-neutral",
    icon: IconHelpCircle,
    iconClassName: "text-foreground-muted",
  },
};

const DECISION_LABELS: Record<PolicyDecision, string> = {
  AUTO: "자동 실행",
  ESCALATE: "검토 필요",
  BLOCK: "정책 차단",
};

const STATUS_LABELS: Record<ProposalStatus, string> = {
  OBSERVED: "상태 관찰",
  PROPOSED: "제안 생성",
  AI_REVIEWED: "AI 검토 완료",
  POLICY_APPROVED: "정책 통과",
  ESCALATED: "검토 필요",
  BLOCKED: "차단됨",
  EXECUTING: "실행 중",
  SUBMITTED: "제출됨",
  CONFIRMED: "거래 확정",
  RECONCILED: "정산 완료",
  FAILED: "실행 실패",
  EXPIRED: "만료됨",
};

function formatActivityTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export default async function DashboardPage() {
  const [
    proposalsResult,
    snapshotResult,
    policyResult,
    readinessResult,
    sessionResult,
  ] =
    await Promise.allSettled([
      dataProvider.listProposals(),
      consoleStateProvider.getConsoleSnapshot(),
      dataProvider.getCurrentPolicy(),
      dataProvider.getSystemReadiness(),
      sessionProvider.getSession(),
    ]);
  const proposalsResponse =
    proposalsResult.status === "fulfilled" ? proposalsResult.value : null;
  const snapshot =
    snapshotResult.status === "fulfilled" ? snapshotResult.value : null;
  const policyResponse =
    policyResult.status === "fulfilled" ? policyResult.value : null;
  const readiness =
    readinessResult.status === "fulfilled" ? readinessResult.value : null;
  const session =
    sessionResult.status === "fulfilled" ? sessionResult.value : null;
  const proposals = proposalsResponse?.data ?? [];
  const policy = policyResponse?.data;
  const now = new Date().toISOString();
  const lastSyncedAt = snapshot?.lastSyncedAt;
  const freshnessMs = lastSyncedAt ? Date.parse(lastSyncedAt) : NaN;
  const isStale =
    Number.isFinite(freshnessMs) &&
    Date.parse(now) - freshnessMs >= 60_000;
  const readinessServices = Object.keys(SYSTEM_SERVICE_NAMES).map(
    (serviceId) =>
      readiness?.data?.services.find(
        (service) => service.serviceId === serviceId,
      ) ?? {
        serviceId: serviceId as SystemServiceId,
        status: "unknown" as const,
      },
  );
  const sorted = [...proposals].sort((a, b) =>
    b.dataAsOf.localeCompare(a.dataAsOf),
  );
  const latest = sorted[0];
  const recent = sorted.slice(0, 5);
  const latestExpired = latest
    ? Date.parse(latest.expiresAt) <= Date.parse(now)
    : false;
  const automationEnabled =
    snapshot?.circuitBreaker === "ACTIVE" &&
    policy?.circuitBreakerStatus === "ACTIVE";

  return (
    <div className="space-y-7 tracking-[-0.01em]">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold leading-tight text-foreground">
            운영 대시보드
          </h1>
          <p className="mt-1.5 text-[13px] font-normal text-foreground-muted">
            지갑 잔고, 자동화 상태, 최신 제안과 최근 활동을 한눈에 확인합니다.
          </p>
          {isStale && (
            <p className="mt-1 text-[10px] text-status-escalate">
              마지막 동기화로부터 60초 이상 경과했습니다.
            </p>
          )}
        </div>
        <EvaluationControl
          dataMode={snapshot?.dataMode}
          allowed={
            session ? hasPermission(session, "request:evaluation") : false
          }
        />
      </header>

      {/* Section 10.2.1: Operations Wallet */}
      <section className="rounded-xl border border-border bg-surface px-4 py-5 sm:px-6">
        <h2 className="text-xs font-medium text-foreground-muted">운영 지갑</h2>

        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-8">
          <div>
            <div className="text-[11px] font-normal text-foreground-subtle">SOL 잔고</div>
            <div className="mt-1.5 flex min-w-0 flex-wrap items-baseline gap-2 text-[30px] font-medium leading-none tracking-[-0.025em] text-foreground tabular-nums sm:text-[34px]">
              {snapshot?.balances.sol ?? "데이터 없음"}
              {snapshot?.balances.sol && (
                <span className="text-sm font-normal tracking-normal text-foreground-muted">
                  SOL
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-normal text-foreground-subtle">USDC 잔고</div>
            <div className="mt-1.5 flex min-w-0 flex-wrap items-baseline gap-2 text-[30px] font-medium leading-none tracking-[-0.025em] text-foreground tabular-nums sm:text-[34px]">
              {snapshot?.balances.usdc ?? "데이터 없음"}
              {snapshot?.balances.usdc && (
                <span className="text-sm font-normal tracking-normal text-foreground-muted">
                  USDC
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 border-t border-border/70 pt-3 text-[11px] font-normal text-foreground-muted tabular-nums">
          <span className="flex items-center gap-2">
            목표 USDC 잔고
            <span className="font-medium text-foreground">
              {snapshot?.targetUsdcBalance
                ? `${snapshot.targetUsdcBalance} USDC`
                : "데이터 없음"}
            </span>
          </span>
          <span className="flex items-center gap-2">
            일일 사용
            <span>
              {snapshot?.dailyUsageUsd !== undefined &&
              snapshot.dailyLimitUsd !== undefined ? (
                <>
                  <span className="font-medium text-foreground">
                    {snapshot.dailyUsageUsd.toFixed(2)}
                  </span>{" "}
                  / {snapshot.dailyLimitUsd.toFixed(2)} USD
                </>
              ) : (
                "데이터 없음"
              )}
            </span>
          </span>
        </div>
      </section>

      {/* Section 10.2.2: Automation status */}
      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <AutomationTile
          icon={<IconBolt size={16} stroke={1.75} />}
          label="자동화"
          value={
            snapshot && policy
              ? automationEnabled
                ? "AUTO 활성"
                : "자동 실행 중단"
              : "확인 불가"
          }
          valueClassName={
            snapshot && policy
              ? automationEnabled
                ? "text-status-auto"
                : "text-status-block"
              : "text-foreground-muted"
          }
        />
        <AutomationTile
          icon={<IconShieldCheck size={16} stroke={1.75} />}
          label="회로 차단기"
          value={
            snapshot
              ? snapshot.circuitBreaker === "ACTIVE"
                ? "보호 시스템 정상"
                : "자동 실행 중단"
              : "확인 불가"
          }
          valueClassName={
            snapshot
              ? snapshot.circuitBreaker === "ACTIVE"
                ? "text-status-auto"
                : "text-status-block"
              : "text-foreground-muted"
          }
          code={snapshot?.circuitBreaker}
        />
        <AutomationTile
          icon={<IconFileText size={16} stroke={1.75} />}
          label="정책 버전"
          value={policy?.policyVersion ?? "데이터 없음"}
        />
        <AutomationTile
          icon={<IconCoin size={16} stroke={1.75} />}
          label="허용 자산"
          value={
            policy
              ? policy.allowedAssets.length > 0
                ? policy.allowedAssets.join(", ")
                : "데이터 없음"
              : "데이터 없음"
          }
        />
      </section>

      {/* Section 10.2.3: Latest Proposal */}
      <section>
        <h2 className="text-sm font-medium text-foreground">최신 제안</h2>
        {!proposalsResponse ? (
          <div className="mt-2.5 rounded-xl border border-border bg-surface px-5 py-6 text-xs text-foreground-muted">
            최신 제안 데이터를 불러오지 못했습니다.
          </div>
        ) : !latest ? (
          <div className="mt-2.5 rounded-xl border border-border bg-surface px-5 py-6 text-xs text-foreground-muted">
            아직 생성된 제안이 없습니다.
          </div>
        ) : (
          <Link
            href={`/proposals/${latest.proposalId}`}
            className="mt-2.5 grid gap-4 rounded-xl border border-border bg-surface px-5 py-4 transition-colors hover:border-border-strong sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground">
                {latest.action}
                {latest.inputSymbol && latest.outputSymbol
                  ? ` · ${latest.inputSymbol} → ${latest.outputSymbol}`
                  : ""}
                {latest.amountDisplay
                  ? ` · ${latest.amountDisplay}`
                  : typeof latest.amountUsd === "number"
                    ? ` · $${latest.amountUsd.toFixed(2)}`
                    : " · 금액 증거 없음"}
              </div>
              <p className="mt-1 max-w-2xl truncate text-xs font-normal text-foreground-muted">
                {latest.rationale}
              </p>
              <div className="mt-2 text-[11px] font-normal text-foreground-subtle tabular-nums">
                신뢰도 {Math.round(latest.confidence * 100)}% &middot;{" "}
                <ExpiryCountdown
                  expiresAt={latest.expiresAt}
                  initialNow={now}
                />
              </div>
            </div>
            <span
              className={`w-fit rounded-md border border-current/25 bg-current/[0.06] px-2.5 py-1 text-[11px] font-semibold ${
                latestExpired && latest.decision === "ESCALATE"
                  ? "text-foreground-muted"
                  : decisionTextClass(latest.decision)
              }`}
            >
              {latest.decision
                ? DECISION_LABELS[latest.decision]
                : STATUS_LABELS[latest.status]}
            </span>
          </Link>
        )}
      </section>

      {/* Section 10.2.4: Recent Activity */}
      <section>
        <h2 className="text-sm font-medium text-foreground">최근 활동</h2>
        {!proposalsResponse ? (
          <div className="mt-3 rounded-xl border border-border bg-surface px-5 py-6 text-xs text-foreground-muted">
            최근 활동 데이터를 불러오지 못했습니다.
          </div>
        ) : recent.length === 0 ? (
          <div className="mt-3 rounded-xl border border-border bg-surface px-5 py-6 text-xs text-foreground-muted">
            아직 기록된 활동이 없습니다.
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-surface">
            {recent.map((proposal) => {
              const { icon: StatusIcon, colorClass } = statusVisual(
                proposal.status,
              );
              const violations = proposal.ruleChecks
                .filter((rule) => rule.result === "FAIL")
                .map((rule) => rule.code);
              const evidence = proposal.execution?.transactionSignature
                ? proposalsResponse.meta.environment === "mock"
                  ? `MOCK 식별자 ${proposal.execution.transactionSignature.slice(0, 8)}…`
                  : `${proposal.execution.transactionSignature.slice(0, 8)}…`
                : proposal.status === "BLOCKED" && violations.length > 0
                  ? `위반 코드 ${violations.join(", ")}`
                  : "증거 없음";
              return (
                <li key={proposal.proposalId}>
                  <Link
                    href={`/proposals/${proposal.proposalId}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm transition-colors hover:bg-surface-raised"
                  >
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-foreground">
                      <StatusIcon
                        size={16}
                        stroke={1.75}
                        className={colorClass}
                      />
                      <span className="max-w-full truncate font-mono text-xs text-foreground-subtle">
                        {proposal.proposalId}
                      </span>
                      <span>{STATUS_LABELS[proposal.status]}</span>
                      <span className="text-[10px] text-foreground-subtle tabular-nums">
                        {formatActivityTime(proposal.dataAsOf)}
                      </span>
                    </div>
                    <span className="text-xs text-foreground-muted">
                      {evidence}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Section 10.2.5: System Health */}
      <section>
        <h2 className="text-sm font-medium text-foreground">
          시스템 상태
          {readiness?.data?.dataMode === "mock" && (
            <span className="ml-2 rounded border border-border-strong bg-surface-raised px-1.5 py-0.5 text-[9px] font-medium text-foreground-muted">
              MOCK
            </span>
          )}
        </h2>
        {!readiness && (
          <p className="mt-1 text-[10px] text-status-escalate">
            시스템 상태를 불러오지 못해 확인 불가로 표시합니다.
          </p>
        )}
        {readiness && !readiness.data && (
          <p className="mt-1 text-[10px] text-foreground-subtle">
            readiness 데이터가 없습니다.
          </p>
        )}
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {readinessServices.map((service) => {
            const presentation = READINESS_PRESENTATION[service.status];
            const ReadinessIcon = presentation.icon;
            return (
              <li
                key={service.serviceId}
                className="rounded-xl border border-border bg-surface"
              >
                <Link
                  href="/system"
                  className="block p-4 transition-colors hover:bg-surface-raised"
                >
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className={`h-1.5 w-1.5 rounded-full ${presentation.dotClassName}`}
                    />
                    <ReadinessIcon
                      size={12}
                      stroke={1.8}
                      className={presentation.iconClassName}
                      aria-hidden="true"
                    />
                    <span className="text-xs text-foreground">
                      {presentation.label}
                    </span>
                  </div>
                  <div className="mt-1.5 text-xs text-foreground-subtle">
                    {SYSTEM_SERVICE_NAMES[service.serviceId]}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
