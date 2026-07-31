import {
  IconAlertTriangle,
  IconCheck,
  IconCircleCheck,
  IconClock,
  IconExternalLink,
  IconPlayerPlay,
  IconShieldX,
} from "@tabler/icons-react";
import { dataProvider } from "@/lib/data";
import type { ApiEnvironment, Proposal } from "@/lib/domain";
import type {
  ActivityEvent,
  ActivityEventCode,
  ActivityEvidenceStatus,
  ProposalActivityGroup,
} from "./activity-event";

const EVENT_LABELS: Record<ActivityEventCode, string> = {
  PROPOSAL_CREATED: "제안 생성",
  AI_REVIEW_COMPLETED: "AI 검토 기록",
  POLICY_DECIDED: "정책 판정",
  EXECUTION_CLAIMED: "실행 단계 진입",
  SIMULATION_SUCCEEDED: "시뮬레이션 결과",
  KMS_REQUESTED: "서명 요청 기록",
  TRANSACTION_SUBMITTED: "거래 제출",
  TRANSACTION_CONFIRMED: "거래 확인",
  RECONCILED: "잔액 정산",
  BLOCKED: "안전 차단",
  FAILED: "실행 실패",
};

function activityEvent({
  proposal,
  code,
  occurredAt,
  details,
  evidenceStatus,
  sequence,
  technicalState,
  transactionSignature,
}: {
  proposal: Proposal;
  code: ActivityEventCode;
  occurredAt?: string;
  details: Array<string | undefined>;
  evidenceStatus: ActivityEvidenceStatus;
  sequence: number;
  technicalState?: string;
  transactionSignature?: string;
}): ActivityEvent {
  return {
    code,
    technicalState: technicalState ?? code,
    label: EVENT_LABELS[code],
    occurredAt,
    proposalId: proposal.proposalId,
    details: details.filter((detail): detail is string => Boolean(detail)),
    evidenceStatus,
    sequence,
    transactionSignature,
  };
}

function eventsFromProposal(
  proposal: Proposal,
  environment: ApiEnvironment,
): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  const failedRules = proposal.ruleChecks
    .filter((rule) => rule.result === "FAIL")
    .map((rule) => rule.code);
  const execution = proposal.execution;
  const amount =
    proposal.amountDisplay ??
    (typeof proposal.amountUsd === "number"
      ? `$${proposal.amountUsd.toFixed(2)}`
      : undefined);

  events.push(
    activityEvent({
      proposal,
      code: "PROPOSAL_CREATED",
      occurredAt: proposal.dataAsOf,
      details: [
        `작업 ${proposal.action}`,
        amount ?? "금액 증거 없음",
        "dataAsOf · 데이터 생성·관찰 기준 시각",
      ],
      evidenceStatus: amount ? "complete" : "incomplete",
      sequence: 1,
    }),
    activityEvent({
      proposal,
      code: "AI_REVIEW_COMPLETED",
      details: [
        `신뢰도 ${Math.round(proposal.confidence * 100)}%`,
        proposal.rationale || "근거 증거 없음",
      ],
      // AI 검토의 개별 occurredAt은 Proposal 도메인에 없다.
      evidenceStatus: "incomplete",
      sequence: 2,
    }),
  );

  if (proposal.decision) {
    events.push(
      activityEvent({
        proposal,
        code: "POLICY_DECIDED",
        details: [
          `판정 ${proposal.decision}`,
          `정책 ${proposal.policyVersion}`,
          failedRules.length > 0
            ? `위반 규칙 ${failedRules.join(", ")}`
            : undefined,
        ],
        // 정책 판정의 개별 occurredAt은 fixture에 없다.
        evidenceStatus:
          proposal.decision === "BLOCK" ? "blocked" : "incomplete",
        sequence: 3,
      }),
    );
  }

  if (proposal.status === "BLOCKED") {
    const kmsNotRequested = execution?.kmsRequested === false;
    const transactionNotSubmitted =
      !execution?.transactionSignature && !execution?.submittedAt;
    const safeBlockConfirmed =
      failedRules.length > 0 && kmsNotRequested && transactionNotSubmitted;

    events.push(
      activityEvent({
        proposal,
        code: "BLOCKED",
        details: [
          failedRules.length > 0
            ? `위반 코드 ${failedRules.join(", ")}`
            : "위반 코드 증거 없음",
          kmsNotRequested
            ? "서명 요청 없음 · KMS 미호출 확인"
            : "KMS 미호출 확인 불가",
          transactionNotSubmitted
            ? "거래 미제출 확인"
            : "거래 미제출 확인 불가",
          transactionNotSubmitted
            ? "자산 이동 없음 · 안전 차단 결과"
            : "자산 이동 여부 확인 불가",
          "시스템 오류가 아닌 정책의 안전 결과",
        ],
        evidenceStatus: safeBlockConfirmed ? "blocked" : "incomplete",
        sequence: 4,
      }),
    );
    return events;
  }

  if (proposal.status === "FAILED") {
    events.push(
      activityEvent({
        proposal,
        code: "FAILED",
        details: [
          "오류 코드 증거 없음",
          "재시도 가능 여부 확인 불가",
          "발생 시각 증거 없음",
        ],
        evidenceStatus: "incomplete",
        sequence: 4,
      }),
    );
    return events;
  }

  if (execution) {
    events.push(
      activityEvent({
        proposal,
        code: "EXECUTION_CLAIMED",
        details: ["실행 시작 시각 증거 없음", "attempt_id 증거 없음"],
        evidenceStatus: "incomplete",
        sequence: 4,
      }),
    );
  }

  if (execution?.simulation?.ok) {
    events.push(
      activityEvent({
        proposal,
        code: "SIMULATION_SUCCEEDED",
        details: [
          "결과 성공",
          execution.simulation.unitsConsumed !== undefined
            ? `사용 유닛 ${execution.simulation.unitsConsumed.toLocaleString("ko-KR")}`
            : "사용 유닛 증거 없음",
          execution.simulation.error
            ? `오류 ${execution.simulation.error}`
            : undefined,
        ],
        evidenceStatus: "incomplete",
        sequence: 5,
      }),
    );
  }

  if (execution && "kmsRequested" in execution) {
    if (execution.kmsRequested) {
      events.push(
        activityEvent({
          proposal,
          code: "KMS_REQUESTED",
          details: [
            environment === "mock"
              ? "모의 데이터에서 KMS 요청 기록을 확인했습니다."
              : "KMS 요청 기록을 확인했습니다.",
            execution.kmsKeyVersion
              ? `키 버전 ${execution.kmsKeyVersion}`
              : "키 버전 증거 없음",
            "signature verification 증거 없음",
          ],
          technicalState:
            environment === "mock" ? "KMS_REQUESTED · MOCK" : "KMS_REQUESTED",
          evidenceStatus: "incomplete",
          sequence: 6,
        }),
      );
    } else {
      events.push(
        activityEvent({
          proposal,
          code: "KMS_REQUESTED",
          details: ["서명 요청 없음"],
          technicalState:
            environment === "mock"
              ? "KMS_NOT_REQUESTED · MOCK"
              : "KMS_NOT_REQUESTED",
          evidenceStatus: "blocked",
          sequence: 6,
        }),
      );
    }
  }

  if (execution?.transactionSignature || execution?.submittedAt) {
    events.push(
      activityEvent({
        proposal,
        code: "TRANSACTION_SUBMITTED",
        occurredAt: execution.submittedAt,
        details: [
          execution.transactionSignature
            ? undefined
            : "거래 식별자 증거 없음",
          execution.submittedAt ? undefined : "제출 시각 증거 없음",
          "attempt_id 증거 없음",
        ],
        // attempt_id가 도메인에 없어 제출 증거를 완전하다고 판정하지 않는다.
        evidenceStatus: "incomplete",
        sequence: 7,
        transactionSignature: execution.transactionSignature,
      }),
    );
  }

  if (execution?.confirmedAt) {
    events.push(
      activityEvent({
        proposal,
        code: "TRANSACTION_CONFIRMED",
        occurredAt: execution.confirmedAt,
        details: [
          execution.commitment
            ? `확정 수준 ${execution.commitment}`
            : "commitment 증거 없음",
          "slot 증거 없음",
        ],
        evidenceStatus: "incomplete",
        sequence: 8,
        transactionSignature: execution.transactionSignature,
      }),
    );
  }

  if (execution?.reconciliation) {
    const reconciliation = execution.reconciliation;
    events.push(
      activityEvent({
        proposal,
        code: "RECONCILED",
        // 정산은 확인 이후 증거이므로 confirmedAt만 재사용할 수 있다.
        occurredAt: execution.confirmedAt,
        details: [
          `변경 전 ${reconciliation.beforeBalance}`,
          `변경 후 ${reconciliation.afterBalance}`,
          `정산 상태 ${reconciliation.status}`,
        ],
        evidenceStatus:
          execution.confirmedAt && reconciliation.status === "MATCHED"
            ? "complete"
            : reconciliation.status === "PENDING"
              ? "progress"
              : "incomplete",
        sequence: 9,
      }),
    );
  }

  return events;
}

function proposalGroups(
  proposals: Proposal[],
  environment: ApiEnvironment,
): ProposalActivityGroup[] {
  return proposals
    .map((proposal) => {
      const events = eventsFromProposal(proposal, environment);
      const occurredTimes = events
        .flatMap((event) => (event.occurredAt ? [event.occurredAt] : []))
        .sort((a, b) => Date.parse(b) - Date.parse(a));

      events.sort((a, b) => {
        if (a.occurredAt && b.occurredAt) {
          return (
            Date.parse(b.occurredAt) - Date.parse(a.occurredAt) ||
            a.sequence - b.sequence
          );
        }
        if (a.occurredAt) return -1;
        if (b.occurredAt) return 1;
        return a.sequence - b.sequence;
      });

      return {
        proposalId: proposal.proposalId,
        sortAt: occurredTimes[0],
        events,
      };
    })
    .sort((a, b) => {
      if (a.sortAt && b.sortAt) {
        return Date.parse(b.sortAt) - Date.parse(a.sortAt);
      }
      if (a.sortAt) return -1;
      if (b.sortAt) return 1;
      return a.proposalId.localeCompare(b.proposalId);
    });
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

function abbreviate(value: string, head = 10, tail = 6) {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

const EVIDENCE_STYLES: Record<
  ActivityEvidenceStatus,
  {
    badge: string;
    icon: typeof IconCheck;
    label: string;
    iconClassName: string;
  }
> = {
  complete: {
    badge: "border-status-auto/25 bg-status-auto-subtle text-status-auto",
    icon: IconCircleCheck,
    label: "확인 완료",
    iconClassName: "text-status-auto",
  },
  progress: {
    badge: "border-cyan-400/25 bg-cyan-400/10 text-cyan-300",
    icon: IconPlayerPlay,
    label: "진행 중",
    iconClassName: "text-cyan-300",
  },
  blocked: {
    badge: "border-status-block/25 bg-status-block-subtle text-status-block",
    icon: IconShieldX,
    label: "차단",
    iconClassName: "text-status-block",
  },
  failed: {
    badge: "border-status-block/25 bg-status-block-subtle text-status-block",
    icon: IconAlertTriangle,
    label: "실패",
    iconClassName: "text-status-block",
  },
  incomplete: {
    badge:
      "border-status-escalate/25 bg-status-escalate-subtle text-status-escalate",
    icon: IconAlertTriangle,
    label: "증거 불완전",
    iconClassName: "text-status-escalate",
  },
};

export default async function ActivityPage() {
  const { data: proposals, meta } = await dataProvider.listProposals();
  const groups = proposalGroups(proposals, meta.environment);
  const activityCount = groups.reduce(
    (count, group) => count + group.events.length,
    0,
  );

  return (
    <div className="pt-2">
      <header>
        <h1 className="text-[22px] font-semibold leading-tight text-foreground">
          활동 기록
        </h1>
        <p className="mt-1.5 text-[13px] text-foreground-muted">
          제안부터 실행 결과까지 모든 과정을 시간순으로 확인합니다.
        </p>
      </header>

      {activityCount === 0 ? (
        <div className="mt-6 rounded-xl border border-border bg-surface px-5 py-12 text-center text-sm text-foreground-muted">
          아직 기록된 활동이 없습니다.
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {groups.map((group) => (
            <section key={group.proposalId}>
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] text-foreground-subtle">
                <span>proposal_id</span>
                <code
                  className="break-all text-foreground-muted"
                  title={group.proposalId}
                >
                  {group.proposalId}
                </code>
              </div>
              <ol className="relative border-y border-border">
                {group.events.map((activity) => {
                  const visual = EVIDENCE_STYLES[activity.evidenceStatus];
                  const StatusIcon = visual.icon;

                  return (
                    <li
                      key={`${activity.proposalId}-${activity.code}`}
                      className="grid gap-3 border-b border-border/70 px-1 py-4 last:border-b-0 sm:grid-cols-[8.5rem_minmax(0,1fr)_auto] sm:items-start sm:gap-5"
                    >
                      {activity.occurredAt ? (
                        <time
                          dateTime={activity.occurredAt}
                          className="flex items-center gap-1.5 whitespace-nowrap text-[11px] text-foreground-subtle tabular-nums"
                        >
                          <IconClock size={13} stroke={1.6} />
                          {formatTime(activity.occurredAt)}
                        </time>
                      ) : (
                        <span className="flex items-center gap-1.5 whitespace-nowrap text-[11px] text-foreground-subtle">
                          <IconClock size={13} stroke={1.6} />
                          시각 증거 없음
                        </span>
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <StatusIcon
                            size={16}
                            stroke={1.7}
                            className={visual.iconClassName}
                          />
                          <span className="text-[13px] font-medium text-foreground">
                            {activity.label}
                          </span>
                          <span
                            className="font-mono text-[9px] tracking-[0.03em] text-foreground-subtle"
                            aria-label={`원본 이벤트 코드 ${activity.technicalState}`}
                          >
                            {activity.technicalState}
                          </span>
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-foreground-muted">
                          <span
                            className="font-mono text-foreground-subtle"
                            title={activity.proposalId}
                          >
                            {abbreviate(activity.proposalId, 12, 4)}
                          </span>
                          {activity.details.map((detail) => (
                            <span
                              key={detail}
                              className="before:mr-2 before:text-border-strong before:content-['·']"
                            >
                              {detail}
                            </span>
                          ))}
                          {activity.transactionSignature &&
                            (meta.environment === "mock" ? (
                              <>
                                <span
                                  className="font-mono before:mr-2 before:text-border-strong before:content-['·']"
                                  title={activity.transactionSignature}
                                >
                                  MOCK 거래 식별자{" "}
                                  {abbreviate(
                                    activity.transactionSignature,
                                    8,
                                    6,
                                  )}
                                </span>
                                <span className="text-foreground-subtle">
                                  실제 온체인 거래 아님
                                </span>
                              </>
                            ) : activity.explorer ? (
                              <a
                                href={activity.explorer.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 before:mr-1 before:text-border-strong before:content-['·'] hover:text-foreground"
                                title={`${activity.explorer.network}: ${activity.transactionSignature}`}
                              >
                                거래{" "}
                                {abbreviate(
                                  activity.transactionSignature,
                                  8,
                                  6,
                                )}
                                <IconExternalLink
                                  size={11}
                                  stroke={1.7}
                                />
                              </a>
                            ) : (
                              <span className="text-foreground-subtle">
                                Explorer 증거 없음
                              </span>
                            ))}
                        </div>
                      </div>

                      <span
                        className={`w-fit rounded-md border px-2 py-0.5 text-[10px] font-medium ${visual.badge}`}
                      >
                        {visual.label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
