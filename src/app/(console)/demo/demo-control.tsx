"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconBan,
  IconCheck,
  IconCircle,
  IconExternalLink,
  IconLoader2,
  IconPlayerPlay,
  IconShieldCheck,
} from "@tabler/icons-react";
import type { Proposal } from "@/lib/domain";
import {
  hasPermission,
  type ConsoleSession,
} from "@/lib/auth";

type ScenarioKey = "auto" | "block";
type StepState = "waiting" | "running" | "complete" | "blocked" | "failed";

interface DemoStep {
  label: string;
  technicalState: string;
  detail?: string;
}

interface DemoControlProps {
  autoProposal: Proposal;
  blockedProposal: Proposal;
  session: ConsoleSession;
  dataMode?: "MOCK" | "LIVE";
  liveEvidence?: {
    network?: string;
    signature?: string;
    explorerUrl?: string;
  };
}

function shortened(value: string, head = 9, tail = 6) {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

function autoEvidenceIsComplete(proposal: Proposal) {
  return Boolean(
    proposal.decision === "AUTO" &&
      proposal.execution?.simulation?.ok &&
      proposal.execution.kmsRequested &&
      proposal.execution.transactionSignature &&
      proposal.execution.reconciliation,
  );
}

function blockEvidenceIsComplete(proposal: Proposal) {
  return Boolean(
    proposal.decision === "BLOCK" &&
      proposal.status === "BLOCKED" &&
      proposal.execution?.kmsRequested === false &&
      !proposal.execution.transactionSignature,
  );
}

const STEP_STYLE: Record<
  StepState,
  { label: string; className: string; icon: typeof IconCircle }
> = {
  waiting: {
    label: "대기",
    className: "border-border-strong bg-surface-raised text-foreground-subtle",
    icon: IconCircle,
  },
  running: {
    label: "진행 중",
    className: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
    icon: IconLoader2,
  },
  complete: {
    label: "완료",
    className: "border-status-auto/30 bg-status-auto-subtle text-status-auto",
    icon: IconCheck,
  },
  blocked: {
    label: "차단",
    className: "border-status-block/30 bg-status-block-subtle text-status-block",
    icon: IconBan,
  },
  failed: {
    label: "실패",
    className: "border-status-block/30 bg-status-block-subtle text-status-block",
    icon: IconAlertTriangle,
  },
};

export function DemoControl({
  autoProposal,
  blockedProposal,
  session,
  dataMode = "MOCK",
  liveEvidence,
}: DemoControlProps) {
  const [selected, setSelected] = useState<ScenarioKey | null>(null);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const canRunDemo = hasPermission(session, "manage:demo");

  const failedRules = blockedProposal.ruleChecks.filter(
    (rule) => rule.result === "FAIL",
  );

  const steps = useMemo<Record<ScenarioKey, DemoStep[]>>(
    () => ({
      auto: [
        {
          label: "상태 확인",
          technicalState: "OBSERVED",
          detail: "운영 잔액 부족 상태를 불러왔습니다.",
        },
        {
          label: "AI 제안",
          technicalState: "AI_REVIEWED",
          detail: `신뢰도 ${Math.round(autoProposal.confidence * 100)}%`,
        },
        {
          label: "정책 통과",
          technicalState: "POLICY_APPROVED · AUTO",
          detail: `${autoProposal.policyVersion} 기준 통과`,
        },
        {
          label: "실행 전 검증",
          technicalState: "SIMULATION_SUCCEEDED",
          detail: autoProposal.execution?.simulation?.unitsConsumed
            ? `사용 유닛 ${autoProposal.execution.simulation.unitsConsumed.toLocaleString("ko-KR")}`
            : undefined,
        },
        {
          label: "서명 조건 확인",
          technicalState: "KMS_REQUESTED · MOCK",
          detail: "모의 데이터에서 KMS 호출 조건과 기록을 확인했습니다.",
        },
        {
          label: "거래 결과 확인",
          technicalState: "MOCK_TRANSACTION_RESULT",
          detail: "모의 거래 결과와 식별자를 확인했습니다.",
        },
        {
          label: "잔액 반영",
          technicalState: "RECONCILED",
          detail: "실행 전후 잔액이 일치합니다.",
        },
      ],
      block: [
        {
          label: "상태 확인",
          technicalState: "OBSERVED",
          detail: "거래 한도 초과 조건을 불러왔습니다.",
        },
        {
          label: "AI 제안",
          technicalState: "AI_REVIEWED",
          detail: `신뢰도 ${Math.round(blockedProposal.confidence * 100)}%`,
        },
        {
          label: "정책 위반 발견",
          technicalState: "POLICY_DECIDED · BLOCK",
          detail: failedRules.map((rule) => rule.code).join(", "),
        },
        {
          label: "서명 전 차단",
          technicalState: "BLOCKED · KMS_NOT_REQUESTED",
          detail: "보안 서명과 거래 제출을 호출하지 않았습니다.",
        },
      ],
    }),
    [autoProposal, blockedProposal, failedRules],
  );

  useEffect(() => {
    if (!isRunning || !selected) return;

    const timer = window.setTimeout(() => {
      if (currentStep >= steps[selected].length - 1) {
        setIsRunning(false);
        return;
      }
      setCurrentStep((step) => step + 1);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [currentStep, isRunning, selected, steps]);

  function startScenario(scenario: ScenarioKey) {
    if (isRunning) return;
    if (!hasPermission(session, "manage:demo")) {
      setSelected(scenario);
      setRunError("데모 실행에는 Admin 권한이 필요합니다.");
      return;
    }

    const evidenceIsComplete =
      scenario === "auto"
        ? autoEvidenceIsComplete(autoProposal)
        : blockEvidenceIsComplete(blockedProposal);

    setSelected(scenario);
    setCurrentStep(-1);
    setRunError(null);

    if (!evidenceIsComplete) {
      setRunError("증거 불완전");
      return;
    }

    setIsRunning(true);
  }

  const activeSteps = selected ? steps[selected] : [];
  const isFinished =
    selected !== null &&
    !isRunning &&
    !runError &&
    currentStep === activeSteps.length - 1;
  const activeProposal =
    selected === "auto"
      ? autoProposal
      : selected === "block"
        ? blockedProposal
        : null;

  function stepState(index: number): StepState {
    if (runError && index === Math.max(currentStep, 0)) return "failed";
    if (index > currentStep) return "waiting";
    if (isRunning && index === currentStep) return "running";
    if (
      selected === "block" &&
      index === activeSteps.length - 1 &&
      index === currentStep
    ) {
      return "blocked";
    }
    return "complete";
  }

  return (
    <div className="pt-2">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/"
            className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-foreground-muted hover:text-foreground"
          >
            <IconArrowLeft size={14} stroke={1.7} />
            홈으로
          </Link>
          <h1 className="text-[22px] font-semibold leading-tight text-foreground">
            CofferGate 작동 방식
          </h1>
          <p className="mt-1.5 text-[13px] text-foreground-muted">
            허용 여부를 모의 검증하고, 기준을 벗어난 거래는 서명 전에 차단하는 흐름을 확인합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5" aria-label="현재 데모 환경">
          <span className="rounded border border-border-strong bg-surface-raised px-2 py-0.5 text-[10px] font-medium text-foreground">
            데모 환경
          </span>
          <span className="rounded border border-border-strong bg-surface-raised px-2 py-0.5 text-[10px] font-medium text-foreground">
            {dataMode}
          </span>
          <span className="rounded border border-cyan-400/25 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
            {dataMode === "MOCK"
              ? "모의 실행 · 실제 자산 이동 없음"
              : "LIVE 데이터"}
          </span>
        </div>
      </header>

      <section className="mt-6 grid gap-3 md:grid-cols-2" aria-label="데모 시나리오 선택">
        <article className="flex flex-col rounded-xl border border-status-auto/20 bg-surface p-5">
          <div className="flex items-center gap-2">
            <IconShieldCheck size={17} stroke={1.7} className="text-status-auto" />
            <h2 className="text-[14px] font-semibold text-foreground">
              정상 자동화 시나리오
            </h2>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-foreground-muted">
            운영 잔액 보충 제안이 정책을 통과하는 과정을 모의 데이터로 확인합니다.
          </p>
          <p className="mt-3 text-[11px] text-foreground-subtle">
            예상 결과{" "}
            <span className="font-medium text-foreground">
              모의 거래 결과 및 잔액 증거 확인
            </span>
          </p>
          <button
            type="button"
            onClick={() => startScenario("auto")}
            disabled={isRunning || !canRunDemo}
            aria-describedby={!canRunDemo ? "demo-permission-reason" : undefined}
            className="mt-4 inline-flex h-10 w-fit items-center gap-1.5 rounded-lg border border-status-auto/35 bg-status-auto-subtle px-3.5 text-xs font-medium text-status-auto transition-colors hover:bg-status-auto/20 disabled:cursor-not-allowed disabled:opacity-40 sm:h-9"
          >
            <IconPlayerPlay size={14} stroke={1.8} />
            시나리오 시작
          </button>
        </article>

        <article className="flex flex-col rounded-xl border border-status-block/20 bg-surface p-5">
          <div className="flex items-center gap-2">
            <IconBan size={17} stroke={1.7} className="text-status-block" />
            <h2 className="text-[14px] font-semibold text-foreground">
              정책 차단 시나리오
            </h2>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-foreground-muted">
            거래 한도를 초과하거나 허용되지 않은 조건을 정책이 감지해 서명 전에 차단합니다.
          </p>
          <p className="mt-3 text-[11px] text-foreground-subtle">
            예상 결과{" "}
            <span className="font-medium text-foreground">
              거래 미실행 및 차단 사유 기록
            </span>
          </p>
          <button
            type="button"
            onClick={() => startScenario("block")}
            disabled={isRunning || !canRunDemo}
            aria-describedby={!canRunDemo ? "demo-permission-reason" : undefined}
            className="mt-4 inline-flex h-10 w-fit items-center gap-1.5 rounded-lg border border-status-block/35 bg-status-block-subtle px-3.5 text-xs font-medium text-status-block transition-colors hover:bg-status-block/20 disabled:cursor-not-allowed disabled:opacity-40 sm:h-9"
          >
            <IconPlayerPlay size={14} stroke={1.8} />
            시나리오 시작
          </button>
        </article>
      </section>
      {!canRunDemo && (
        <p
          id="demo-permission-reason"
          className="mt-2 text-[10px] text-foreground-subtle"
        >
          데모 시나리오 실행에는 Admin 권한이 필요합니다.
        </p>
      )}

      <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="rounded-xl border border-border bg-surface">
          <div className="border-b border-border px-5 py-3.5">
            <h2 className="text-[13px] font-semibold text-foreground">
              실행 단계
            </h2>
            <p className="mt-0.5 text-[10px] text-foreground-subtle">
              MOCK fixture를 순서대로 표시하며 실제 자산을 이동하지 않습니다.
            </p>
          </div>

          {!selected ? (
            <div className="px-5 py-12 text-center text-[12px] text-foreground-muted">
              위에서 시나리오를 선택해 시작해주세요.
            </div>
          ) : (
            <ol className="px-5 py-2">
              {activeSteps.map((step, index) => {
                const state = stepState(index);
                const style = STEP_STYLE[state];
                const StateIcon = style.icon;

                return (
                  <li
                    key={step.technicalState}
                    className="relative flex gap-3 border-b border-border/60 py-3.5 last:border-b-0"
                  >
                    <span
                      className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border ${style.className}`}
                    >
                      <StateIcon
                        size={13}
                        stroke={1.8}
                        className={state === "running" ? "animate-spin" : ""}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-[13px] font-medium text-foreground">
                          {step.label}
                        </span>
                        <span className="font-mono text-[9px] text-foreground-subtle">
                          {step.technicalState}
                        </span>
                      </div>
                      {step.detail && index <= currentStep && (
                        <p className="mt-1 text-[11px] text-foreground-muted">
                          {step.detail}
                        </p>
                      )}
                    </div>
                    <span
                      className={`h-fit rounded-md border px-2 py-0.5 text-[10px] font-medium ${style.className}`}
                    >
                      {style.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <aside className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-[13px] font-semibold text-foreground">실행 결과</h2>

          {!activeProposal ? (
            <p className="mt-4 text-[11px] leading-relaxed text-foreground-muted">
              시나리오를 시작하면 제안과 정책 판정, 실행 증거가 여기에 표시됩니다.
            </p>
          ) : (
            <>
              <dl className="mt-4 space-y-3 text-[11px]">
                <div>
                  <dt className="text-foreground-subtle">제안 ID</dt>
                  <dd
                    className="mt-0.5 font-mono text-foreground"
                    title={activeProposal.proposalId}
                  >
                    {shortened(activeProposal.proposalId, 13, 4)}
                  </dd>
                </div>
                <div>
                  <dt className="text-foreground-subtle">정책 버전</dt>
                  <dd className="mt-0.5 font-mono text-foreground">
                    {activeProposal.policyVersion}
                  </dd>
                </div>
                <div>
                  <dt className="text-foreground-subtle">거래 금액</dt>
                  <dd className="mt-0.5 font-medium text-foreground tabular-nums">
                    {activeProposal.amountDisplay ??
                      (typeof activeProposal.amountUsd === "number"
                        ? `$${activeProposal.amountUsd.toFixed(2)}`
                        : "데이터 없음")}
                  </dd>
                </div>
              </dl>

              {runError && (
                <div className="mt-4 flex gap-2 rounded-lg border border-status-block/25 bg-status-block-subtle p-3 text-[11px] text-status-block">
                  <IconAlertTriangle size={15} stroke={1.7} className="shrink-0" />
                  {runError}
                </div>
              )}

              {isRunning && (
                <div className="mt-4 flex items-center gap-2 text-[11px] text-cyan-300">
                  <IconLoader2 size={14} stroke={1.7} className="animate-spin" />
                  {activeSteps[Math.max(currentStep, 0)]?.label ?? "준비 중"}
                </div>
              )}

              {isFinished && selected === "auto" && (
                <div className="mt-4 border-t border-border pt-4">
                  <div className="inline-flex items-center gap-1.5 rounded-md border border-status-auto/25 bg-status-auto-subtle px-2 py-1 text-[10px] font-semibold text-status-auto">
                    <IconCheck size={12} stroke={1.8} />
                    {dataMode === "MOCK"
                      ? "AUTO 시나리오 완료 · MOCK"
                      : "AUTO 시나리오 완료"}
                  </div>
                  <p className="mt-2 text-[10px] font-medium text-status-auto">
                    데모 증거 확인 완료
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[10px]">
                    <div>
                      <dt className="text-foreground-subtle">정책 판정</dt>
                      <dd className="mt-0.5 text-status-auto">자동 실행 · MOCK</dd>
                    </div>
                    <div>
                      <dt className="text-foreground-subtle">실행 여부</dt>
                      <dd className="mt-0.5 text-foreground-muted">
                        모의 실행 결과 확인
                      </dd>
                    </div>
                    <div>
                      <dt className="text-foreground-subtle">서명 요청 여부</dt>
                      <dd className="mt-0.5 text-foreground-muted">
                        요청 조건 확인 · MOCK
                      </dd>
                    </div>
                    <div>
                      <dt className="text-foreground-subtle">거래 제출 여부</dt>
                      <dd className="mt-0.5 text-foreground-muted">
                        실제 제출 없음 · MOCK
                      </dd>
                    </div>
                  </dl>
                  {dataMode === "MOCK" &&
                    autoProposal.execution?.transactionSignature && (
                      <div className="mt-3 text-[11px] text-foreground-muted">
                        <div className="font-mono text-foreground">
                          MOCK 거래 식별자{" "}
                          {shortened(
                            autoProposal.execution.transactionSignature,
                          )}
                        </div>
                        <p className="mt-1 text-[10px] text-foreground-subtle">
                          실제 온체인 거래가 아닙니다.
                        </p>
                      </div>
                    )}
                  {dataMode === "MOCK" &&
                    autoProposal.execution?.kmsKeyVersion && (
                      <div className="mt-3 text-[10px] text-foreground-subtle">
                        MOCK KMS 키 버전{" "}
                        <span className="font-mono text-foreground-muted">
                          {autoProposal.execution.kmsKeyVersion}
                        </span>
                      </div>
                    )}
                  {dataMode === "LIVE" &&
                    liveEvidence?.network &&
                    liveEvidence.signature &&
                    liveEvidence.explorerUrl && (
                      <a
                        href={liveEvidence.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 flex items-center gap-1.5 text-[11px] text-foreground-muted hover:text-foreground"
                      >
                        {liveEvidence.network} 거래{" "}
                        {shortened(liveEvidence.signature)}
                        <IconExternalLink size={12} stroke={1.7} />
                      </a>
                    )}
                  {autoProposal.execution?.reconciliation && (
                    <dl className="mt-3 space-y-2 text-[10px]">
                      <div>
                        <dt className="text-foreground-subtle">
                          {dataMode === "MOCK" ? "모의 결과 전" : "실행 전"}
                        </dt>
                        <dd className="mt-0.5 text-foreground-muted">
                          {autoProposal.execution.reconciliation.beforeBalance}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-foreground-subtle">
                          {dataMode === "MOCK" ? "모의 결과 후" : "실행 후"}
                        </dt>
                        <dd className="mt-0.5 text-foreground">
                          {autoProposal.execution.reconciliation.afterBalance}
                        </dd>
                      </div>
                    </dl>
                  )}
                </div>
              )}

              {isFinished && selected === "block" && (
                <div className="mt-4 border-t border-border pt-4">
                  <div className="inline-flex items-center gap-1.5 rounded-md border border-status-block/25 bg-status-block-subtle px-2 py-1 text-[10px] font-semibold text-status-block">
                    <IconBan size={12} stroke={1.8} />
                    BLOCK · 안전 차단
                  </div>
                  <p className="mt-2 text-[10px] text-foreground-muted">
                    오류가 아니라 정책이 정상적으로 작동한 안전 결과입니다.
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[10px]">
                    <div>
                      <dt className="text-foreground-subtle">정책 판정</dt>
                      <dd className="mt-0.5 text-status-block">정책 차단</dd>
                    </div>
                    <div>
                      <dt className="text-foreground-subtle">실행 여부</dt>
                      <dd className="mt-0.5 text-foreground-muted">실행 없음</dd>
                    </div>
                    <div>
                      <dt className="text-foreground-subtle">서명 요청 여부</dt>
                      <dd className="mt-0.5 text-foreground-muted">요청 없음</dd>
                    </div>
                    <div>
                      <dt className="text-foreground-subtle">거래 제출 여부</dt>
                      <dd className="mt-0.5 text-foreground-muted">제출 없음</dd>
                    </div>
                  </dl>
                  <ul className="mt-3 space-y-1.5 text-[11px] text-foreground-muted">
                    <li>자산이 이동하지 않았습니다.</li>
                    <li>보안 서명이 실행되지 않았습니다.</li>
                    <li>거래가 블록체인에 제출되지 않았습니다.</li>
                  </ul>
                  {failedRules.length > 0 && (
                    <div className="mt-3">
                      <div className="text-[10px] text-foreground-subtle">
                        위반한 정책 기준
                      </div>
                      {failedRules.map((rule) => (
                        <div key={rule.code} className="mt-1.5">
                          <div className="font-mono text-[10px] text-status-block">
                            {rule.code}
                          </div>
                          <p className="mt-0.5 text-[10px] leading-relaxed text-foreground-muted">
                            {rule.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                <Link
                  href={`/proposals/${activeProposal.proposalId}`}
                  className="rounded-md border border-border-strong px-2.5 py-1.5 text-[10px] font-medium text-foreground-muted hover:bg-surface-raised hover:text-foreground"
                >
                  관련 제안 상세
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-md border border-border-strong px-2.5 py-1.5 text-[10px] font-medium text-foreground-muted hover:bg-surface-raised hover:text-foreground"
                >
                  대시보드로 이동
                </Link>
              </div>
            </>
          )}
        </aside>
      </section>
    </div>
  );
}
