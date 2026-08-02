"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import {
  IconAlertTriangle,
  IconBan,
  IconCheck,
  IconChevronRight,
  IconClock,
  IconExternalLink,
} from "@tabler/icons-react";
import type {
  ApiEnvironment,
  PolicyDecision,
  Proposal,
  ProposalAction,
  ProposalStatus,
} from "@/lib/domain";
import { groupRepeatedBlockedProposals } from "./group-proposals";

interface ProposalQueueProps {
  proposals: Proposal[];
  environment: ApiEnvironment;
  now: string;
}

interface Filters {
  status: string;
  action: string;
  decision: string;
  createdDate: string;
  policyVersion: string;
  environment: string;
}

const EMPTY_FILTERS: Filters = {
  status: "",
  action: "",
  decision: "",
  createdDate: "",
  policyVersion: "",
  environment: "",
};

const STATUS_LABELS: Record<ProposalStatus, string> = {
  OBSERVED: "상태 관찰",
  PROPOSED: "제안 생성",
  AI_REVIEWED: "AI 검토 완료",
  POLICY_APPROVED: "정책 통과",
  SIMULATED: "서명 증명 완료",
  ESCALATED: "검토 필요",
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
  ESCALATE: "검토 필요",
  BLOCK: "정책 차단",
};

const ACTION_LABELS: Record<ProposalAction, string> = {
  SWAP: "자산 교환",
  NO_ACTION: "실행 없음",
};

const DECISION_STYLE: Record<PolicyDecision, string> = {
  AUTO: "border-status-auto/30 bg-status-auto-subtle text-status-auto",
  ESCALATE: "border-status-escalate/30 bg-status-escalate-subtle text-status-escalate",
  BLOCK: "border-status-block/30 bg-status-block-subtle text-status-block",
};

function unique(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function shorten(value: string, head = 11, tail = 5) {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDateOption(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function proposalEvidence(proposal: Proposal) {
  if (proposal.status === "BLOCKED") {
    const violations = proposal.ruleChecks
      .filter((rule) => rule.result === "FAIL")
      .map((rule) => rule.code);
    return violations.length > 0 ? violations.join(", ") : null;
  }
  if (proposal.status === "SIMULATED") {
    return proposal.execution?.attestationSignature ?? null;
  }
  return proposal.execution?.transactionSignature ?? null;
}

function explorerUrl(
  signature: string,
  environment: ApiEnvironment,
): string | null {
  if (environment === "devnet") {
    return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
  }
  if (environment === "mainnet-beta") {
    return `https://explorer.solana.com/tx/${signature}`;
  }
  return null;
}

function DecisionBadge({ decision }: { decision?: PolicyDecision }) {
  if (!decision) return <span className="text-foreground-subtle">—</span>;
  const Icon =
    decision === "AUTO"
      ? IconCheck
      : decision === "ESCALATE"
        ? IconAlertTriangle
        : IconBan;

  return (
    <span
      className={`inline-flex h-7 items-center justify-center gap-1 whitespace-nowrap rounded-md border px-2 text-[11px] font-medium md:w-[7.75rem] ${DECISION_STYLE[decision]}`}
      title={decision}
    >
      <Icon size={12} stroke={1.8} aria-hidden="true" />
      {DECISION_LABELS[decision]}
      <span className="font-mono text-[8px] opacity-70">{decision}</span>
    </span>
  );
}

function StatusBadge({
  status,
  expired,
}: {
  status: ProposalStatus;
  expired: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="rounded-md border border-border-strong bg-surface-raised px-2 py-1 text-[11px] text-foreground">
        {STATUS_LABELS[status]}
        <span className="ml-1 font-mono text-[8px] text-foreground-subtle">
          {status}
        </span>
      </span>
      {expired && status !== "EXPIRED" && (
        <span className="inline-flex items-center gap-1 rounded-md border border-border-strong px-2 py-1 text-[10px] font-medium text-foreground-muted">
          <IconClock size={11} stroke={1.8} aria-hidden="true" />
          만료됨
        </span>
      )}
    </div>
  );
}

function Evidence({
  proposal,
  environment,
}: {
  proposal: Proposal;
  environment: ApiEnvironment;
}) {
  const evidence = proposalEvidence(proposal);
  if (!evidence) {
    return <span className="text-foreground-subtle">증거 없음</span>;
  }

  if (proposal.status === "BLOCKED") {
    return (
      <span className="font-mono text-[10px] text-status-block" title={evidence}>
        {evidence}
      </span>
    );
  }

  const url =
    proposal.status === "SIMULATED"
      ? null
      : explorerUrl(evidence, environment);
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        onClick={(event) => event.stopPropagation()}
        className="inline-flex items-center gap-1 font-mono text-[10px] text-cyan-300 hover:text-cyan-200"
        title={evidence}
      >
        {shorten(evidence, 8, 5)}
        <IconExternalLink size={11} stroke={1.7} aria-hidden="true" />
      </a>
    );
  }

  return (
    <span className="font-mono text-[10px] text-foreground-muted" title={evidence}>
      {proposal.status === "SIMULATED"
        ? "KMS 증명 "
        : environment === "mock"
          ? "MOCK 식별자 "
          : "거래 "}
      {shorten(evidence, 8, 5)}
    </span>
  );
}

function RepetitionControl({
  count,
  expanded,
  onToggle,
}: {
  count: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (count <= 1) return null;
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
      className="pointer-events-auto mt-1 inline-flex rounded border border-status-block/30 bg-status-block-subtle px-1.5 py-0.5 text-[9px] font-medium text-status-block hover:border-status-block/60"
      aria-expanded={expanded}
    >
      동일 조건 {count}회 · {expanded ? "접기" : "기록 보기"}
    </button>
  );
}

function DesktopProposalRow({
  proposal,
  environment,
  currentTime,
  repeatedCount = 1,
  expanded = false,
  onToggle = () => undefined,
  nested = false,
}: {
  proposal: Proposal;
  environment: ApiEnvironment;
  currentTime: number;
  repeatedCount?: number;
  expanded?: boolean;
  onToggle?: () => void;
  nested?: boolean;
}) {
  const expired = new Date(proposal.expiresAt).getTime() <= currentTime;
  return (
    <li className={`relative ${nested ? "bg-surface-raised/40" : ""}`}>
      <Link
        href={`/proposals/${proposal.proposalId}`}
        className="absolute inset-0 z-0 transition-colors hover:bg-surface-raised"
        aria-label={`${shorten(proposal.proposalId, 14, 4)} 상세 보기`}
      />
      <div className="pointer-events-none relative z-10 grid grid-cols-[1.25fr_0.8fr_0.9fr_1.15fr_1.05fr_0.95fr_1fr_0.4fr] items-center gap-3 px-4 py-3">
        <div className={`min-w-0 ${nested ? "pl-4" : ""}`}>
          <div className="truncate font-mono text-[11px] text-foreground" title={proposal.proposalId}>
            {shorten(proposal.proposalId, 14, 4)}
          </div>
          <div className="mt-1 text-[10px] text-foreground-subtle">
            {formatDateTime(proposal.dataAsOf)}
          </div>
          <RepetitionControl
            count={repeatedCount}
            expanded={expanded}
            onToggle={onToggle}
          />
        </div>
        <div className="text-[11px] text-foreground">
          {ACTION_LABELS[proposal.action]}
          <div className="font-mono text-[9px] text-foreground-subtle">{proposal.action}</div>
        </div>
        <div className="min-w-0 text-[11px] text-foreground">
          <div>{proposal.inputSymbol ?? "—"} → {proposal.outputSymbol ?? "—"}</div>
          <div className="mt-1 truncate text-[10px] text-foreground-muted">
            {proposal.amountDisplay ?? (typeof proposal.amountUsd === "number" ? `$${proposal.amountUsd.toFixed(2)}` : "금액 없음")}
          </div>
        </div>
        <DecisionBadge decision={proposal.decision} />
        <StatusBadge status={proposal.status} expired={expired} />
        <div className="text-[10px] text-foreground-muted">{formatDateTime(proposal.expiresAt)}</div>
        <div className="pointer-events-auto min-w-0 overflow-hidden">
          <Evidence proposal={proposal} environment={environment} />
        </div>
        <IconChevronRight size={15} stroke={1.7} className="justify-self-end text-foreground-subtle" aria-hidden="true" />
      </div>
    </li>
  );
}

function MobileProposalRow({
  proposal,
  environment,
  currentTime,
  repeatedCount = 1,
  expanded = false,
  onToggle = () => undefined,
  nested = false,
}: {
  proposal: Proposal;
  environment: ApiEnvironment;
  currentTime: number;
  repeatedCount?: number;
  expanded?: boolean;
  onToggle?: () => void;
  nested?: boolean;
}) {
  const expired = new Date(proposal.expiresAt).getTime() <= currentTime;
  return (
    <li className={`relative ${nested ? "bg-surface-raised/40" : ""}`}>
      <Link href={`/proposals/${proposal.proposalId}`} className="absolute inset-0 z-0 transition-colors hover:bg-surface-raised" aria-label={`${shorten(proposal.proposalId, 14, 4)} 상세 보기`} />
      <div className={`pointer-events-none relative z-10 px-4 py-4 ${nested ? "pl-8" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate font-mono text-[11px] text-foreground">{shorten(proposal.proposalId, 14, 4)}</div>
            <div className="mt-1 text-[10px] text-foreground-subtle">생성 {formatDateTime(proposal.dataAsOf)}</div>
            <RepetitionControl count={repeatedCount} expanded={expanded} onToggle={onToggle} />
          </div>
          <IconChevronRight size={15} stroke={1.7} className="text-foreground-subtle" aria-hidden="true" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <DecisionBadge decision={proposal.decision} />
          <StatusBadge status={proposal.status} expired={expired} />
        </div>
        <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-[11px] min-[400px]:grid-cols-2">
          <div className="min-w-0"><dt className="text-foreground-subtle">실행 유형</dt><dd className="mt-0.5 text-foreground">{ACTION_LABELS[proposal.action]} · {proposal.action}</dd></div>
          <div className="min-w-0"><dt className="text-foreground-subtle">자산 / 금액</dt><dd className="mt-0.5 break-words text-foreground">{proposal.inputSymbol ?? "—"} → {proposal.outputSymbol ?? "—"}<span className="ml-1 text-foreground-muted">{proposal.amountDisplay ?? (typeof proposal.amountUsd === "number" ? `$${proposal.amountUsd.toFixed(2)}` : "금액 없음")}</span></dd></div>
          <div className="min-w-0"><dt className="text-foreground-subtle">만료 시각</dt><dd className="mt-0.5 text-foreground-muted">{formatDateTime(proposal.expiresAt)}</dd></div>
          <div className="min-w-0"><dt className="text-foreground-subtle">증거 / 차단 사유</dt><dd className="pointer-events-auto mt-0.5"><Evidence proposal={proposal} environment={environment} /></dd></div>
        </dl>
      </div>
    </li>
  );
}

export function ProposalQueue({
  proposals,
  environment,
  now,
}: ProposalQueueProps) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const currentTime = new Date(now).getTime();

  const options = useMemo(
    () => ({
      statuses: unique(proposals.map((proposal) => proposal.status)),
      actions: unique(proposals.map((proposal) => proposal.action)),
      decisions: unique(
        proposals.flatMap((proposal) =>
          proposal.decision ? [proposal.decision] : [],
        ),
      ),
      // Proposal 도메인에는 createdAt이 없으므로 dataAsOf를 생성·관찰 시각으로 사용한다.
      createdDates: unique(
        proposals.map((proposal) => proposal.dataAsOf.slice(0, 10)),
      ).reverse(),
      policyVersions: unique(
        proposals.map((proposal) => proposal.policyVersion),
      ),
      environments: proposals.length > 0 ? [environment] : [],
    }),
    [environment, proposals],
  );

  const filteredProposals = useMemo(
    () =>
      proposals
        .filter(
          (proposal) =>
            (!filters.status || proposal.status === filters.status) &&
            (!filters.action || proposal.action === filters.action) &&
            (!filters.decision || proposal.decision === filters.decision) &&
            (!filters.createdDate ||
              proposal.dataAsOf.slice(0, 10) === filters.createdDate) &&
            (!filters.policyVersion ||
              proposal.policyVersion === filters.policyVersion) &&
            (!filters.environment || environment === filters.environment),
        )
        .sort((a, b) => {
          const escalatedOrder =
            Number(b.status === "ESCALATED") - Number(a.status === "ESCALATED");
          if (escalatedOrder !== 0) return escalatedOrder;
          return (
            new Date(b.dataAsOf).getTime() - new Date(a.dataAsOf).getTime()
          );
        }),
    [environment, filters, proposals],
  );

  const hasActiveFilters = Object.values(filters).some(Boolean);
  const proposalGroups = useMemo(
    () => groupRepeatedBlockedProposals(filteredProposals),
    [filteredProposals],
  );

  function setFilter(key: keyof Filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function toggleGroup(key: string) {
    setExpandedGroups((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium text-foreground">제안</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            AI가 생성한 제안과 정책 판정 결과를 확인합니다.
          </p>
        </div>
        {environment === "mock" && (
          <span className="rounded border border-border-strong bg-surface-raised px-2 py-0.5 text-[10px] font-medium text-foreground-muted">
            MOCK
          </span>
        )}
      </header>

      {proposals.length > 0 && (
        <section
          className="mt-6 flex flex-wrap items-end gap-2 rounded-lg border border-border bg-surface px-3 py-3"
          aria-label="제안 필터"
        >
          <FilterSelect
            label="상태"
            value={filters.status}
            onChange={(value) => setFilter("status", value)}
            options={options.statuses.map((value) => ({
              value,
              label: STATUS_LABELS[value as ProposalStatus],
            }))}
          />
          <FilterSelect
            label="실행 유형"
            value={filters.action}
            onChange={(value) => setFilter("action", value)}
            options={options.actions.map((value) => ({
              value,
              label: ACTION_LABELS[value as ProposalAction],
            }))}
          />
          <FilterSelect
            label="정책 판정"
            value={filters.decision}
            onChange={(value) => setFilter("decision", value)}
            options={options.decisions.map((value) => ({
              value,
              label: DECISION_LABELS[value as PolicyDecision],
            }))}
          />
          <FilterSelect
            label="생성일"
            value={filters.createdDate}
            onChange={(value) => setFilter("createdDate", value)}
            options={options.createdDates.map((value) => ({
              value,
              label: formatDateOption(value),
            }))}
          />
          <FilterSelect
            label="정책 버전"
            value={filters.policyVersion}
            onChange={(value) => setFilter("policyVersion", value)}
            options={options.policyVersions.map((value) => ({
              value,
              label: value,
            }))}
          />
          <FilterSelect
            label="데이터 환경"
            value={filters.environment}
            onChange={(value) => setFilter("environment", value)}
            options={options.environments.map((value) => ({
              value,
              label: value.toUpperCase(),
            }))}
          />
          <button
            type="button"
            onClick={() => setFilters(EMPTY_FILTERS)}
            disabled={!hasActiveFilters}
            className="h-8 px-2 text-[11px] font-medium text-foreground-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            필터 초기화
          </button>
        </section>
      )}

      {proposals.length === 0 ? (
        <EmptyState>아직 생성된 제안이 없습니다.</EmptyState>
      ) : filteredProposals.length === 0 ? (
        <EmptyState>조건에 맞는 제안이 없습니다.</EmptyState>
      ) : (
        <>
          <div className="mt-4 hidden overflow-hidden rounded-xl border border-border bg-surface md:block">
            <div className="grid grid-cols-[1.25fr_0.8fr_0.9fr_1.15fr_1.05fr_0.95fr_1fr_0.4fr] gap-3 border-b border-border bg-surface-raised/60 px-4 py-2 text-[10px] font-medium text-foreground-subtle">
              <span>제안 / 생성 시각</span>
              <span>실행 유형</span>
              <span>자산 / 금액</span>
              <span>정책 판정</span>
              <span>현재 상태</span>
              <span>만료 시각</span>
              <span>증거 / 차단 사유</span>
              <span className="sr-only">상세</span>
            </div>
            <ul className="divide-y divide-border">
              {proposalGroups.map((group) => {
                const expanded = expandedGroups.has(group.key);
                return (
                  <Fragment key={group.key}>
                    <DesktopProposalRow
                      proposal={group.proposal}
                      environment={environment}
                      currentTime={currentTime}
                      repeatedCount={group.repeatedProposals.length + 1}
                      expanded={expanded}
                      onToggle={() => toggleGroup(group.key)}
                    />
                    {expanded &&
                      group.repeatedProposals.map((proposal) => (
                        <DesktopProposalRow
                          key={proposal.proposalId}
                          proposal={proposal}
                          environment={environment}
                          currentTime={currentTime}
                          nested
                        />
                      ))}
                  </Fragment>
                );
              })}
            </ul>
          </div>

          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface md:hidden">
            {proposalGroups.map((group) => {
              const expanded = expandedGroups.has(group.key);
              return (
                <Fragment key={group.key}>
                  <MobileProposalRow
                    proposal={group.proposal}
                    environment={environment}
                    currentTime={currentTime}
                    repeatedCount={group.repeatedProposals.length + 1}
                    expanded={expanded}
                    onToggle={() => toggleGroup(group.key)}
                  />
                  {expanded &&
                    group.repeatedProposals.map((proposal) => (
                      <MobileProposalRow
                        key={proposal.proposalId}
                        proposal={proposal}
                        environment={environment}
                        currentTime={currentTime}
                        nested
                      />
                    ))}
                </Fragment>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-[7.5rem] flex-1 sm:flex-none">
      <span className="mb-1 block text-[9px] font-medium text-foreground-subtle">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-full rounded-md border border-border-strong bg-surface-raised px-2 text-[11px] text-foreground outline-none focus:border-cyan-400/50"
      >
        <option value="">전체</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-xl border border-border bg-surface px-5 py-14 text-center text-sm text-foreground-muted">
      {children}
    </div>
  );
}
