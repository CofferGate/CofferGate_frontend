"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconAlertTriangle,
  IconBan,
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconInfoCircle,
  IconLoader2,
  IconShieldCheck,
} from "@tabler/icons-react";
import type {
  ApiEnvironment,
  PolicyDecision,
  Proposal,
  ProposalStatus,
  ReconciliationStatus,
  RuleCheck,
} from "@/lib/domain";
import {
  formatDemoTokenBalance,
  getFailedExecutionEvidence,
  getTransactionExplorerUrl,
  isAutoExecutionComplete,
} from "@/lib/domain";
import {
  hasPermission,
  type ConsoleSession,
} from "@/lib/auth";
import {
  submitProposalReview,
  type ReviewActionResult,
} from "./review-actions";

interface ProposalDetailProps {
  proposal: Proposal;
  environment: ApiEnvironment;
  currentPolicyVersion?: string;
  session: ConsoleSession;
  now: string;
}

type EvidenceState =
  | "complete"
  | "collecting"
  | "incomplete"
  | "integrity-error"
  | "failed";

const STATUS_LABELS: Record<ProposalStatus, string> = {
  OBSERVED: "상태 관찰",
  PROPOSED: "제안 생성",
  AI_REVIEWED: "AI 검토 완료",
  POLICY_APPROVED: "정책 통과",
  SIMULATED: "서명 증명 완료",
  ESCALATED: "운영자 검토 필요",
  BLOCKED: "차단됨",
  EXECUTING: "실행 중",
  SUBMITTED: "제출됨",
  CONFIRMED: "거래 확정",
  RECONCILED: "정산 완료",
  FAILED: "실행 실패",
  EXPIRED: "만료됨",
};

const DECISION_LABELS: Record<PolicyDecision, string> = {
  AUTO: "자동 실행",
  ESCALATE: "운영자 검토 필요",
  BLOCK: "정책 차단",
};

const RULE_LABELS: Record<string, string> = {
  ALLOWED_MINT: "허용 자산",
  PER_TX_LIMIT: "건별 거래 한도",
  DAILY_LIMIT: "일일 거래 한도",
  RESERVE_THRESHOLD: "최소 준비금",
  QUOTE_FRESHNESS: "시세 최신성",
  SLIPPAGE: "슬리피지",
  PRICE_IMPACT: "가격 영향",
  ALLOWED_PROGRAM: "허용 프로그램",
  ALLOWED_SIGNER: "허용 서명자",
  SIMULATION: "실행 전 시뮬레이션",
  CIRCUIT_BREAKER: "회로 차단기",
};

const DECISION_STYLE: Record<PolicyDecision, string> = {
  AUTO: "border-border-strong bg-surface-raised text-foreground-muted",
  ESCALATE:
    "border-status-escalate/30 bg-status-escalate-subtle text-status-escalate",
  BLOCK: "border-status-block/30 bg-status-block-subtle text-status-block",
};

const STATUS_STYLE: Partial<Record<ProposalStatus, string>> = {
  POLICY_APPROVED: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  SIMULATED: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  EXECUTING: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  SUBMITTED: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  CONFIRMED: "border-status-auto/30 bg-status-auto-subtle text-status-auto",
  RECONCILED: "border-status-auto/30 bg-status-auto-subtle text-status-auto",
  BLOCKED: "border-status-block/30 bg-status-block-subtle text-status-block",
  FAILED: "border-status-block/30 bg-status-block-subtle text-status-block",
  ESCALATED:
    "border-status-escalate/30 bg-status-escalate-subtle text-status-escalate",
};

const EVIDENCE_STATE = {
  complete: {
    label: "증거 확인 완료",
    style: "border-status-auto/25 bg-status-auto-subtle text-status-auto",
    icon: IconShieldCheck,
  },
  collecting: {
    label: "증거 수집 중",
    style: "border-cyan-400/25 bg-cyan-400/10 text-cyan-300",
    icon: IconLoader2,
  },
  incomplete: {
    label: "증거 불완전",
    style:
      "border-status-escalate/25 bg-status-escalate-subtle text-status-escalate",
    icon: IconAlertTriangle,
  },
  "integrity-error": {
    label: "증거 무결성 오류",
    style: "border-status-block/25 bg-status-block-subtle text-status-block",
    icon: IconBan,
  },
  failed: {
    label: "실행 실패",
    style: "border-status-block/25 bg-status-block-subtle text-status-block",
    icon: IconBan,
  },
} satisfies Record<
  EvidenceState,
  { label: string; style: string; icon: typeof IconCheck }
>;

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "증거 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function shorten(value: string, head = 12, tail = 6) {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

function isSafeExternalUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function displayValue(value: string | number | boolean | undefined) {
  if (value === undefined) return "증거 없음";
  if (typeof value === "boolean") return value ? "예" : "아니오";
  return String(value);
}

function getEvidenceAssessment(
  proposal: Proposal,
  expired: boolean,
): { state: EvidenceState; missing: string[] } {
  const missing: string[] = [];
  if (proposal.evidenceRefs.length === 0) missing.push("관찰 데이터 출처");
  if (!proposal.rationale) missing.push("AI 제안 근거");
  if (!proposal.decision) missing.push("정책 판정");
  if (proposal.ruleChecks.length === 0) missing.push("정책 규칙 기록");

  const integrityError =
    (proposal.decision === "BLOCK" &&
      Boolean(
        proposal.execution?.kmsRequested ||
          proposal.execution?.transactionSignature,
      )) ||
    (proposal.status === "BLOCKED" && proposal.decision !== "BLOCK");

  if (integrityError) return { state: "integrity-error", missing };

  if (proposal.status === "FAILED") {
    if (!proposal.execution?.failure) missing.push("실패 정보");
    return { state: "failed", missing };
  }

  if (proposal.decision === "AUTO" && proposal.status === "SIMULATED") {
    if (!proposal.execution) missing.push("서명 증명");
    if (!proposal.execution?.simulation) missing.push("시뮬레이션 결과");
    if (!proposal.execution?.kmsRequested) missing.push("KMS 요청 기록");
    if (!proposal.execution?.attestationSignature) missing.push("KMS attestation 서명");
    if (!proposal.execution?.attestedAt) missing.push("KMS attestation 시각");
  } else if (
    proposal.decision === "AUTO" &&
    proposal.status === "RECONCILED"
  ) {
    if (!proposal.execution) missing.push("실행 증거");
    if (proposal.execution?.simulation?.ok !== true) missing.push("성공한 시뮬레이션");
    if (proposal.execution?.kmsRequested !== true) missing.push("KMS 요청 기록");
    if (!proposal.execution?.transactionSignature) missing.push("거래 식별자");
    if (
      proposal.execution?.commitment !== "confirmed" &&
      proposal.execution?.commitment !== "finalized"
    ) {
      missing.push("confirmed 이상 commitment");
    }
    if (proposal.execution?.reconciliation?.status !== "MATCHED") {
      missing.push("MATCHED 정산 증거");
    }
  } else if (proposal.decision === "AUTO") {
    if (!proposal.execution) missing.push("실행 증거");
  }

  if (proposal.decision === "BLOCK") {
    if (!proposal.ruleChecks.some((rule) => rule.result === "FAIL")) {
      missing.push("차단 위반 규칙");
    }
    if (proposal.execution?.kmsRequested !== false) {
      missing.push("KMS 미요청 기록");
    }
  }

  if (proposal.decision === "ESCALATE") {
    if (expired) missing.push("만료 전 운영자 판정");
    return {
      state: expired || missing.length > 0 ? "incomplete" : "collecting",
      missing,
    };
  }

  const collectingStatuses: ProposalStatus[] = [
    "OBSERVED",
    "PROPOSED",
    "AI_REVIEWED",
    "POLICY_APPROVED",
    "EXECUTING",
    "SUBMITTED",
    "CONFIRMED",
  ];
  if (missing.length > 0) return { state: "incomplete", missing };
  if (isAutoExecutionComplete(proposal)) return { state: "complete", missing };
  if (collectingStatuses.includes(proposal.status)) {
    return { state: "collecting", missing };
  }
  return { state: "complete", missing };
}

function SummaryField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] text-foreground-subtle">{label}</dt>
      <dd
        className={`mt-1 break-words text-[12px] text-foreground ${mono ? "font-mono" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-baseline gap-2">
      <span className="font-mono text-[9px] tracking-wider text-foreground-subtle">
        {eyebrow}
      </span>
      <h2 className="text-[16px] font-semibold text-foreground">{children}</h2>
    </div>
  );
}

function MissingEvidence({ children }: { children?: React.ReactNode }) {
  return (
    <span className="text-[11px] text-foreground-subtle">
      {children ?? "제공된 증거 없음"}
    </span>
  );
}

export function ProposalDetail({
  proposal,
  environment,
  currentPolicyVersion,
  session,
  now,
}: ProposalDetailProps) {
  const [copied, setCopied] = useState(false);
  const expired =
    new Date(proposal.expiresAt).getTime() <= new Date(now).getTime();
  const assessment = getEvidenceAssessment(proposal, expired);
  const assessmentVisual = EVIDENCE_STATE[assessment.state];
  const AssessmentIcon = assessmentVisual.icon;

  async function copyProposalId() {
    await navigator.clipboard.writeText(proposal.proposalId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="pb-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-medium text-foreground">제안 상세</h1>
            {environment === "mock" && (
              <span className="rounded border border-border-strong bg-surface-raised px-2 py-0.5 text-[10px] font-medium text-foreground-muted">
                MOCK · FIXTURE
              </span>
            )}
          </div>
          <div className="mt-2 flex min-w-0 items-center gap-2">
            <code className="break-all text-[11px] text-foreground-muted">
              {proposal.proposalId}
            </code>
            <button
              type="button"
              onClick={copyProposalId}
              className="inline-flex shrink-0 items-center gap-1 rounded border border-border-strong px-2 py-1 text-[10px] text-foreground-muted hover:bg-surface-raised hover:text-foreground"
              aria-label="proposal_id 복사"
            >
              <IconCopy size={11} stroke={1.8} aria-hidden="true" />
              {copied ? "복사됨" : "복사"}
            </button>
          </div>
        </div>
      </header>

      <section
        className={`mt-5 rounded-xl border border-t-2 bg-surface p-5 ${
          proposal.status === "FAILED" || proposal.status === "BLOCKED"
            ? "border-border border-t-status-block"
            : proposal.status === "RECONCILED"
              ? "border-border border-t-status-auto"
              : proposal.status === "SIMULATED"
                ? "border-border border-t-cyan-400"
                : "border-border"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-md border px-2 py-1 text-[11px] font-medium ${
              STATUS_STYLE[proposal.status] ??
              "border-border-strong bg-surface-raised text-foreground"
            }`}
          >
            {STATUS_LABELS[proposal.status]}
            <span className="ml-1 font-mono text-[8px] opacity-70">
              {proposal.status}
            </span>
          </span>
          {proposal.decision && (
            <span
              className={`rounded-md border px-2 py-1 text-[11px] font-medium ${DECISION_STYLE[proposal.decision]}`}
            >
              {DECISION_LABELS[proposal.decision]}
              <span className="ml-1 font-mono text-[8px] opacity-70">
                {proposal.decision}
              </span>
            </span>
          )}
          {expired && proposal.status !== "EXPIRED" && (
            <span className="rounded-md border border-border-strong px-2 py-1 text-[10px] text-foreground-muted">
              만료됨
            </span>
          )}
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
          <SummaryField label="실행 유형 · action" value={proposal.action} mono />
          <SummaryField
            label="자산"
            value={`${proposal.inputSymbol ?? "—"} → ${proposal.outputSymbol ?? "—"}`}
          />
          <SummaryField
            label="거래 금액"
            value={
              proposal.amountDisplay ??
              (typeof proposal.amountUsd === "number"
                ? `$${proposal.amountUsd.toFixed(2)}`
                : "증거 없음")
            }
          />
          <SummaryField
            label="생성·관찰 시각 · dataAsOf"
            value={formatDateTime(proposal.dataAsOf)}
          />
          <SummaryField
            label="데이터 기준 · data_as_of"
            value={formatDateTime(proposal.dataAsOf)}
          />
          <SummaryField
            label="만료 시각 · expires_at"
            value={formatDateTime(proposal.expiresAt)}
          />
          <SummaryField
            label="정책 버전 · policy_version"
            value={proposal.policyVersion}
            mono
          />
          <SummaryField
            label="입력 mint"
            value={proposal.inputMint ? shorten(proposal.inputMint) : "증거 없음"}
            mono
          />
          <SummaryField
            label="출력 mint"
            value={
              proposal.outputMint ? shorten(proposal.outputMint) : "증거 없음"
            }
            mono
          />
        </dl>
      </section>

      <section
        className={`mt-3 flex flex-wrap items-start gap-3 rounded-lg border px-4 py-3 ${assessmentVisual.style}`}
      >
        <AssessmentIcon
          size={16}
          stroke={1.8}
          className={assessment.state === "collecting" ? "animate-spin" : ""}
          aria-hidden="true"
        />
        <div>
          <div className="text-[12px] font-semibold">
            {assessmentVisual.label}
          </div>
          {assessment.missing.length > 0 && (
            <p className="mt-0.5 text-[10px] opacity-85">
              누락: {assessment.missing.join(", ")}
            </p>
          )}
        </div>
      </section>

      <div className="mt-8 border-l border-border pl-4 sm:pl-7">
        <section className="relative pb-9">
          <FlowDot />
          <SectionHeading eyebrow="OBSERVE">무엇을 확인했나요?</SectionHeading>
          <dl className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-5">
            {["SOL 잔고", "USDC 잔고", "목표 잔고", "가격", "변동성"].map(
              (label) => (
                <SummaryField
                  key={label}
                  label={label}
                  value={<MissingEvidence />}
                />
              ),
            )}
          </dl>
          <div className="mt-5 border-t border-border pt-4">
            <div className="text-[11px] text-foreground-muted">
              데이터 기준 시각 {formatDateTime(proposal.dataAsOf)}
            </div>
            {proposal.evidenceRefs.length > 0 ? (
              <ul className="mt-3 divide-y divide-border/70">
                {proposal.evidenceRefs.map((reference) => (
                  <li
                    key={reference.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2 text-[11px]"
                  >
                    <div>
                      <span className="text-foreground">{reference.label}</span>
                      <span className="ml-2 font-mono text-[9px] text-foreground-subtle">
                        {reference.sourceType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground-subtle">
                      {formatDateTime(reference.observedAt)}
                      {reference.url && isSafeExternalUrl(reference.url) && (
                        <a
                          href={reference.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200"
                        >
                          출처
                          <IconExternalLink
                            size={11}
                            stroke={1.7}
                            aria-hidden="true"
                          />
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-3">
                <MissingEvidence>데이터 출처 증거 없음</MissingEvidence>
              </div>
            )}
          </div>
        </section>

        <section className="relative pb-9">
          <FlowDot />
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <SectionHeading eyebrow="AI PROPOSAL">
              AI는 무엇을 제안했나요?
            </SectionHeading>
            <span className="-mt-4 rounded-md border border-violet-400/30 bg-violet-400/10 px-2 py-1 text-[10px] font-medium text-violet-300">
              AI 생성 제안
            </span>
          </div>
          <div className="border-l-2 border-violet-400/35 pl-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <AgentEvidence label="Market Context" />
              <div>
                <div className="text-[11px] font-medium text-violet-300">
                  Treasury Strategy
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-foreground-muted">
                  {proposal.action}
                  {proposal.inputSymbol && proposal.outputSymbol
                    ? ` · ${proposal.inputSymbol} → ${proposal.outputSymbol}`
                    : ""}
                  {proposal.amountDisplay ? ` · ${proposal.amountDisplay}` : ""}
                </p>
                <p className="mt-1 text-[10px] text-foreground-subtle">
                  별도 에이전트 증거는 제공되지 않았습니다.
                </p>
              </div>
              <AgentEvidence label="Risk Review" />
            </div>
            <div className="mt-5 border-t border-violet-400/15 pt-4">
              <div className="text-[10px] text-foreground-subtle">제안 근거</div>
              <p className="mt-1 text-[12px] leading-relaxed text-foreground">
                {proposal.rationale || "증거 없음"}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[10px] text-foreground-muted">
                <span>신뢰도 {Math.round(proposal.confidence * 100)}%</span>
                <span>만료 {formatDateTime(proposal.expiresAt)}</span>
                <span>참조 증거 {proposal.evidenceRefs.length}건</span>
              </div>
              {proposal.evidenceRefs.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-foreground-subtle">
                  {proposal.evidenceRefs.map((reference) => (
                    <li key={reference.id}>{reference.label}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section className="relative pb-9">
          <FlowDot />
          <SectionHeading eyebrow="POLICY DECISION">
            왜 허용되거나 차단됐나요?
          </SectionHeading>
          {proposal.decision === "BLOCK" && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-status-block/20 bg-status-block-subtle px-3 py-2 text-[11px] text-status-block">
              <IconShieldCheck
                size={14}
                stroke={1.8}
                className="shrink-0"
                aria-hidden="true"
              />
              BLOCK은 오류가 아니라 정책이 의도대로 작동한 안전 결과입니다.
            </div>
          )}
          {proposal.ruleChecks.length > 0 ? (
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
              {proposal.ruleChecks.map((rule) => (
                <RuleItem key={rule.code} rule={rule} />
              ))}
            </ul>
          ) : (
            <MissingEvidence>정책 규칙 증거 없음</MissingEvidence>
          )}
        </section>

        <section className="relative pb-9">
          <FlowDot />
          <SectionHeading eyebrow="EXECUTION">
            실제로 무엇이 일어났나요?
          </SectionHeading>
          <ExecutionEvidence
            proposal={proposal}
            environment={environment}
          />
        </section>

        <section className="relative">
          <FlowDot />
          <SectionHeading eyebrow="RECONCILIATION">
            자산은 어떻게 바뀌었나요?
          </SectionHeading>
          <ReconciliationEvidence proposal={proposal} />
        </section>
      </div>

      {proposal.decision === "ESCALATE" && (
        <OperatorReview
          proposal={proposal}
          expired={expired}
          environment={environment}
          currentPolicyVersion={currentPolicyVersion}
          session={session}
        />
      )}
    </div>
  );
}

function FlowDot() {
  return (
    <span
      className="absolute -left-[1.28rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-cyan-300 bg-background sm:-left-[2.05rem]"
      aria-hidden="true"
    />
  );
}

function AgentEvidence({ label }: { label: string }) {
  return (
    <div>
      <div className="text-[11px] font-medium text-violet-300">{label}</div>
      <p className="mt-1 text-[10px] leading-relaxed text-foreground-subtle">
        별도 에이전트 증거가 제공되지 않았습니다.
      </p>
    </div>
  );
}

function RuleItem({ rule }: { rule: RuleCheck }) {
  const visual = {
    PASS: {
      icon: IconCheck,
      label: "통과",
      style: "text-status-auto",
    },
    REVIEW: {
      icon: IconAlertTriangle,
      label: "검토",
      style: "text-status-escalate",
    },
    FAIL: {
      icon: IconBan,
      label: "차단",
      style: "text-status-block",
    },
  }[rule.result];
  const Icon = visual.icon;

  return (
    <li className="grid gap-2 px-4 py-3 sm:grid-cols-[1.1fr_0.65fr_1.5fr] sm:items-center">
      <div className="flex items-start gap-2">
        <Icon
          size={15}
          stroke={1.9}
          className={`mt-0.5 shrink-0 ${visual.style}`}
          aria-hidden="true"
        />
        <div>
          <div className="text-[11px] font-medium text-foreground">
            {RULE_LABELS[rule.code] ?? rule.label}
          </div>
          <div className="font-mono text-[9px] text-foreground-subtle">
            {rule.code}
          </div>
        </div>
      </div>
      <div className={`text-[10px] font-semibold ${visual.style}`}>
        {visual.label} · {rule.result}
      </div>
      <div>
        <div className="flex flex-wrap gap-x-3 text-[9px] text-foreground-subtle">
          <span>실제 {displayValue(rule.actual)}</span>
          <span>기준 {displayValue(rule.expected)}</span>
        </div>
        <p className="mt-1 text-[10px] leading-relaxed text-foreground-muted">
          {rule.message}
        </p>
      </div>
    </li>
  );
}

function ExecutionEvidence({
  proposal,
  environment,
}: {
  proposal: Proposal;
  environment: ApiEnvironment;
}) {
  const execution = proposal.execution;

  if (!execution) {
    return (
      <div className="rounded-lg border border-border bg-surface px-4 py-4">
        <MissingEvidence>실행 증거 없음</MissingEvidence>
        {proposal.decision === "BLOCK" && (
          <p className="mt-2 text-[11px] text-foreground-muted">
            정책 차단으로 KMS를 호출하지 않았고, 거래 제출과 자산 이동이
            없었습니다.
          </p>
        )}
      </div>
    );
  }

  const explorerUrl = getTransactionExplorerUrl(
    execution.transactionSignature,
    environment,
  );
  const failureEvidence = getFailedExecutionEvidence(proposal);
  const fields = [
    ["실행 경로", execution.routeLabel],
    ["예상 입력량", execution.expectedInputAmount],
    ["예상 출력량", execution.expectedOutputAmount],
    ["최소 출력량", execution.minimumOutputAmount],
    [
      "슬리피지",
      execution.slippageBps === undefined
        ? undefined
        : `${execution.slippageBps} bps`,
    ],
    [
      "가격 영향",
      execution.priceImpactBps === undefined
        ? undefined
        : `${execution.priceImpactBps} bps`,
    ],
    [
      "Compute units",
      execution.computeUnits?.toLocaleString("ko-KR"),
    ],
    ["제출 시각", execution.submittedAt && formatDateTime(execution.submittedAt)],
    ["확정 시각", execution.confirmedAt && formatDateTime(execution.confirmedAt)],
    ["Commitment", execution.commitment],
    ["출력 토큰 계정", execution.outputTokenAccount],
  ].filter((field): field is string[] => field[1] !== undefined);

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      {failureEvidence && (
        <div className="mb-4 rounded-lg border border-status-block/25 bg-status-block-subtle p-3 text-status-block">
          <div className="flex items-center gap-2 text-[12px] font-semibold">
            <IconBan size={14} stroke={1.8} aria-hidden="true" />
            실행 실패
          </div>
          <dl className="mt-3 grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">
            <SummaryField label="실패 코드" value={failureEvidence.code ?? "증거 없음"} mono />
            <SummaryField
              label="실패 감지 시각"
              value={failureEvidence.observedAt ? formatDateTime(failureEvidence.observedAt) : "증거 없음"}
            />
            <SummaryField label="실패 메시지" value={failureEvidence.message ?? "증거 없음"} />
            <SummaryField label="KMS 요청 여부" value={failureEvidence.kmsRequested ? "예" : "아니오"} />
            <SummaryField
              label="Transaction signature 존재 여부"
              value={failureEvidence.hasTransactionSignature ? "예" : "아니오"}
            />
          </dl>
        </div>
      )}

      {fields.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4">
          {fields.map(([label, value]) => (
            <SummaryField key={label} label={label} value={value} />
          ))}
        </dl>
      )}

      {execution.simulation && (
        <div className="mt-4 border-t border-border pt-3 text-[11px]">
          <span
            className={
              execution.simulation.ok ? "text-status-auto" : "text-status-block"
            }
          >
            시뮬레이션 {execution.simulation.ok ? "성공" : "실패"}
          </span>
          {execution.simulation.unitsConsumed !== undefined && (
            <span className="ml-3 text-foreground-muted">
              {execution.simulation.unitsConsumed.toLocaleString("ko-KR")} units
            </span>
          )}
          {execution.simulation.error && (
            <p className="mt-1 text-status-block">{execution.simulation.error}</p>
          )}
        </div>
      )}

      {proposal.status === "SIMULATED" && execution.attestationSignature && (
        <dl className="mt-4 grid grid-cols-1 gap-x-5 gap-y-4 border-t border-border pt-3 sm:grid-cols-2">
          <SummaryField
            label="KMS attestation 서명"
            value={execution.attestationSignature}
            mono
          />
          <SummaryField
            label="서명 증명 시각"
            value={
              execution.attestedAt
                ? formatDateTime(execution.attestedAt)
                : "증거 없음"
            }
          />
        </dl>
      )}

      <div className="mt-4 border-t border-border pt-3 text-[11px]">
        {execution.kmsRequested ? (
          <span className="text-foreground-muted">
            {environment === "mock"
              ? "KMS 호출 조건 기록 · MOCK"
              : "KMS 요청됨"}
            {execution.kmsKeyVersion && (
              <span
                className="ml-2 font-mono text-[10px] text-foreground-subtle"
                title={execution.kmsKeyVersion}
              >
                키 {execution.kmsKeyVersion}
              </span>
            )}
          </span>
        ) : (
          <span className="font-medium text-foreground">서명 요청 없음</span>
        )}
      </div>

      {execution.transactionSignature && (
        <div className="mt-3 text-[11px]">
          {environment === "mock" ? (
            <div>
              <span className="font-mono text-foreground-muted">
                MOCK 거래 식별자{" "}
                {shorten(execution.transactionSignature, 10, 6)}
              </span>
              <p className="mt-1 text-[10px] text-foreground-subtle">
                실제 온체인 거래가 아닙니다.
              </p>
            </div>
          ) : explorerUrl ? (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-full items-start gap-1 break-all font-mono text-cyan-300 hover:text-cyan-200"
              title={execution.transactionSignature}
            >
              <span>{execution.transactionSignature}</span>
              <IconExternalLink size={11} stroke={1.7} className="mt-0.5 shrink-0" aria-hidden="true" />
            </a>
          ) : (
            <MissingEvidence>
              LIVE Explorer 연결에 필요한 서버 증거가 없습니다.
            </MissingEvidence>
          )}
        </div>
      )}

      {proposal.decision === "BLOCK" && (
        <p className="mt-3 text-[11px] text-foreground-muted">
          거래가 제출되지 않았으며 자산 이동이 없습니다.
        </p>
      )}
    </div>
  );
}

function ReconciliationEvidence({ proposal }: { proposal: Proposal }) {
  const reconciliation = proposal.execution?.reconciliation;
  if (!reconciliation) {
    return (
      <div className="rounded-lg border border-border bg-surface px-4 py-4">
        <MissingEvidence>정산 증거 없음</MissingEvidence>
      </div>
    );
  }

  const messages: Record<ReconciliationStatus, string> = {
    MATCHED: "예상 결과와 실제 잔액이 일치합니다.",
    MISMATCHED: "예상 결과와 실제 잔액이 일치하지 않습니다.",
    PENDING: "잔액 확인이 진행 중입니다.",
  };
  const statusLabels: Record<ReconciliationStatus, string> = {
    MATCHED: "일치",
    MISMATCHED: "불일치",
    PENDING: "확인 중",
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <dl className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-5">
        <SummaryField
          label="변경 전 잔액"
          value={formatDemoTokenBalance(reconciliation.beforeBalance)}
        />
        <SummaryField
          label="변경 후 잔액"
          value={formatDemoTokenBalance(reconciliation.afterBalance)}
        />
        <SummaryField
          label="예상 변화량"
          value={formatDemoTokenBalance(reconciliation.expectedDelta)}
        />
        <SummaryField
          label="실제 변화량"
          value={formatDemoTokenBalance(reconciliation.actualDelta)}
        />
        <SummaryField
          label="정산 상태"
          value={
            <span>
              {statusLabels[reconciliation.status]}
              <span className="ml-1 font-mono text-[9px] text-foreground-subtle">
                {reconciliation.status}
              </span>
            </span>
          }
        />
      </dl>
      <p className="mt-4 border-t border-border pt-3 text-[11px] text-foreground-muted">
        {messages[reconciliation.status]}
      </p>
    </div>
  );
}

function OperatorReview({
  proposal,
  expired,
  environment,
  currentPolicyVersion,
  session,
}: {
  proposal: Proposal;
  expired: boolean;
  environment: ApiEnvironment;
  currentPolicyVersion?: string;
  session: ConsoleSession;
}) {
  const [reason, setReason] = useState("");
  const [intent, setIntent] = useState<"approve" | "reject" | null>(null);
  const [result, setResult] = useState<ReviewActionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const idempotencyKey = useRef<string | null>(null);
  const requestInFlight = useRef(false);
  const canReview = hasPermission(session, "review:escalation");
  const policyMismatch =
    !currentPolicyVersion ||
    proposal.policyVersion !== currentPolicyVersion;
  const statusChanged = proposal.status !== "ESCALATED";
  const disabled = expired || policyMismatch || statusChanged || !canReview;
  const disabledReason = expired
    ? "제안이 만료되어 새 평가가 필요합니다."
    : policyMismatch
      ? "현재 정책 버전과 달라 새 평가가 필요합니다."
      : statusChanged
        ? "제안 상태가 변경되어 검토할 수 없습니다."
        : !canReview
          ? "Operator 또는 Admin 권한이 필요합니다."
          : null;

  useEffect(() => {
    if (!intent || !modalRef.current) return;
    const modal = modalRef.current;
    const focusableSelector =
      'button:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const first = modal.querySelector<HTMLElement>(focusableSelector);
    first?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !requestInFlight.current) {
        event.preventDefault();
        setIntent(null);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        modal.querySelectorAll<HTMLElement>(focusableSelector),
      );
      if (focusable.length === 0) return;
      const firstItem = focusable[0];
      const lastItem = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    };
  }, [intent]);

  function openReview(
    nextIntent: "approve" | "reject",
    trigger: HTMLButtonElement,
  ) {
    if (disabled || !hasPermission(session, "review:escalation")) return;
    triggerRef.current = trigger;
    idempotencyKey.current = null;
    setReason("");
    setResult(null);
    setIntent(nextIntent);
  }

  async function submitReview() {
    if (!intent || requestInFlight.current) return;
    if (!hasPermission(session, "review:escalation")) {
      setResult({
        status: "forbidden",
        message: "ESCALATE 검토 권한이 없습니다.",
        idempotencyKey: "",
      });
      return;
    }
    if (intent === "reject" && !reason.trim()) {
      setResult({
        status: "invalid",
        message: "거절 사유를 입력해주세요.",
        idempotencyKey: idempotencyKey.current ?? "",
      });
      return;
    }
    if (disabled) return;
    const requestKey = idempotencyKey.current ?? crypto.randomUUID();
    idempotencyKey.current = requestKey;

    requestInFlight.current = true;
    setIsSubmitting(true);
    try {
      const response = await submitProposalReview({
        proposalId: proposal.proposalId,
        expectedStatus: proposal.status,
        expectedPolicyVersion: proposal.policyVersion,
        intent,
        reason,
        idempotencyKey: requestKey,
      });
      setResult(response);
    } finally {
      requestInFlight.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-8 rounded-xl border border-status-escalate/25 bg-status-escalate-subtle p-5">
      <h2 className="text-[14px] font-semibold text-foreground">
        운영자 검토
      </h2>
      {expired && (
        <div
          id="review-disabled-reason"
          className="mt-3 flex items-start gap-2 text-[11px] text-status-escalate"
        >
          <IconAlertTriangle
            size={14}
            stroke={1.8}
            className="shrink-0"
            aria-hidden="true"
          />
          제안 유효 시간이 지나 승인하거나 거절할 수 없습니다. 새 평가가
          필요합니다.
        </div>
      )}
      {disabledReason && !expired && (
        <p
          id="review-disabled-reason"
          className="mt-3 text-[10px] text-status-escalate"
        >
          {disabledReason}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={(event) => openReview("approve", event.currentTarget)}
          disabled={disabled}
          aria-describedby={disabled ? "review-disabled-reason" : undefined}
          className={`min-h-10 rounded-md border border-status-auto/30 px-3 py-1.5 text-[11px] font-medium text-status-auto disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0 ${
            environment === "mock" ? "" : "hidden sm:inline-flex"
          }`}
        >
          승인
        </button>
        <button
          type="button"
          onClick={(event) => openReview("reject", event.currentTarget)}
          disabled={disabled}
          aria-describedby={disabled ? "review-disabled-reason" : undefined}
          className={`min-h-10 rounded-md border border-status-block/30 px-3 py-1.5 text-[11px] font-medium text-status-block disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0 ${
            environment === "mock" ? "" : "hidden sm:inline-flex"
          }`}
        >
          거절
        </button>
      </div>

      {environment !== "mock" && (
        <p className="mt-2 text-[9px] text-foreground-subtle sm:hidden">
          모바일 LIVE 검토는 지원하지 않습니다.
        </p>
      )}

      {intent && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSubmitting) {
              setIntent(null);
            }
          }}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-dialog-title"
            className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-border-strong bg-background p-4 shadow-2xl sm:p-5"
          >
            <div
              id="review-dialog-title"
              className="text-[14px] font-semibold text-foreground"
            >
              {intent === "approve" ? "승인" : "거절"} 확인
            </div>
            <dl className="mt-4 grid grid-cols-1 gap-3 text-[10px] sm:grid-cols-2">
              <SummaryField
                label="proposal_id"
                value={proposal.proposalId}
                mono
              />
              <SummaryField
                label="현재 상태"
                value={`${STATUS_LABELS[proposal.status]} · ${proposal.status}`}
              />
              <SummaryField
                label="만료 시각"
                value={formatDateTime(proposal.expiresAt)}
              />
              <SummaryField
                label="정책 버전"
                value={proposal.policyVersion}
                mono
              />
              <SummaryField
                label="실행 환경"
                value={environment.toUpperCase()}
              />
              <SummaryField
                label="데이터 모드"
                value={environment === "mock" ? "MOCK" : "LIVE"}
              />
            </dl>
            <label className="mt-4 block">
              <span className="text-[10px] text-foreground-muted">
                사유 {intent === "reject" ? "· 필수" : "· 선택"}
              </span>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={isSubmitting}
                rows={3}
                className="mt-1 w-full resize-none rounded-lg border border-border-strong bg-surface px-3 py-2 text-[11px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:opacity-50"
              />
            </label>
            {result && (
              <p className="mt-3 flex items-center gap-1.5 text-[10px] text-status-escalate">
                <IconInfoCircle size={12} stroke={1.8} aria-hidden="true" />
                {result.message}
              </p>
            )}
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setIntent(null)}
                disabled={isSubmitting}
                className="rounded-md border border-border-strong px-3 py-1.5 text-[11px] text-foreground-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:opacity-40"
              >
                취소
              </button>
              <button
                type="button"
                onClick={submitReview}
                disabled={
                  isSubmitting || (intent === "reject" && !reason.trim())
                }
                className="rounded-md border border-status-escalate/30 px-3 py-1.5 text-[11px] font-medium text-status-escalate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting
                  ? "요청 중"
                  : intent === "approve"
                    ? "승인 요청"
                    : "거절 요청"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
