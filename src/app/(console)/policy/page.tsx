import {
  IconAlertTriangle,
  IconCheck,
  IconInfoCircle,
  IconShieldCheck,
} from "@tabler/icons-react";
import { dataProvider } from "@/lib/data";

export const dynamic = "force-dynamic";

function display(value: unknown, fallback = "설정되지 않음") {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
}

function formatUsd(value: number | null | undefined) {
  if (value === undefined || value === null) return "설정되지 않음";
  return `${new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value)} 이하`;
}

function formatBps(value: number | null | undefined) {
  if (value === undefined || value === null) return "설정되지 않음";
  return `${value}bps (${value / 100}%)`;
}

function shorten(value: string) {
  if (value.length <= 18) return value;
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

function listValue(values: string[]) {
  return values.length > 0 ? values.join(", ") : "설정되지 않음";
}

function MintList({ values }: { values: string[] }) {
  if (values.length === 0) return <>설정되지 않음</>;
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1">
      {values.map((mint) => (
        <span key={mint} className="font-mono" title={mint}>
          {shorten(mint)}
        </span>
      ))}
    </span>
  );
}

function PolicyRow({
  label,
  value,
  evidence,
}: {
  label: string;
  value: React.ReactNode;
  evidence?: string;
}) {
  return (
    <div className="grid gap-1 border-b border-border/60 py-3 last:border-b-0 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-baseline sm:gap-5">
      <dt className="text-[12px] font-normal text-foreground-muted">{label}</dt>
      <dd className="min-w-0 break-words text-[13px] font-medium text-foreground">
        {value}
        {evidence && (
          <span className="ml-2 font-mono text-[10px] font-normal text-foreground-subtle">
            {evidence}
          </span>
        )}
      </dd>
    </div>
  );
}

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border pt-5">
      <h2 className="text-[13px] font-semibold text-foreground">{title}</h2>
      <dl className="mt-2">{children}</dl>
    </section>
  );
}

export default async function PolicyPage() {
  const response = await dataProvider.getCurrentPolicy();
  const policy = response.data;

  if (!policy) {
    return (
      <div className="pt-2">
        <h1 className="text-[22px] font-semibold leading-tight text-foreground">
          운영 정책
        </h1>
        <p className="mt-1.5 text-[13px] text-foreground-muted">
          자동 실행이 허용되는 범위와 안전 기준을 확인합니다.
        </p>
        <div className="mt-6 rounded-xl border border-border bg-surface px-5 py-12 text-center text-sm text-foreground-muted">
          표시할 정책 데이터가 없습니다.
        </div>
      </div>
    );
  }

  const isDemoPolicy = response.meta.environment === "mock";
  const generatedAt = response.meta.generatedAt;
  const generatedAtMs = Date.parse(generatedAt);
  const isStale =
    Number.isFinite(generatedAtMs) && Date.now() - generatedAtMs >= 60_000;
  const circuitParameters = policy.circuitBreakerParameters;
  const circuitParametersDisplay =
    circuitParameters && Object.keys(circuitParameters).length > 0
      ? Object.entries(circuitParameters)
          .map(([key, value]) => `${key}: ${String(value)}`)
          .join(", ")
      : "설정되지 않음";

  return (
    <div className="pt-2">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[22px] font-semibold leading-tight text-foreground">
            운영 정책
          </h1>
          {isDemoPolicy && (
            <span className="rounded-md border border-status-escalate/25 bg-status-escalate-subtle px-2 py-0.5 text-[10px] font-medium text-status-escalate">
              데모 정책
            </span>
          )}
        </div>
        <p className="mt-1.5 text-[13px] text-foreground-muted">
          자동 실행이 허용되는 범위와 안전 기준을 확인합니다.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-foreground-subtle tabular-nums">
          <span>
            정책 버전{" "}
            <span className="font-mono text-foreground-muted">
              {policy.policyVersion}
            </span>
          </span>
          <span>
            적용 시작 시각{" "}
            <span className="text-foreground-muted">
              {display(policy.effectiveFrom)}
            </span>
          </span>
        </div>
      </header>

      {isStale && (
        <div
          role="status"
          className="mt-5 flex items-start gap-2 rounded-lg border border-status-escalate/25 bg-status-escalate-subtle px-4 py-3 text-xs text-status-escalate"
        >
          <IconAlertTriangle size={15} stroke={1.7} className="mt-px shrink-0" />
          정책 데이터가 마지막 생성 시점으로부터 60초 이상 경과했습니다.
          <time
            dateTime={generatedAt}
            className="font-mono text-[10px] opacity-80"
          >
            {generatedAt}
          </time>
        </div>
      )}

      <section className="mt-6 rounded-xl border border-border bg-surface px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <IconInfoCircle
            size={15}
            stroke={1.7}
            className="text-foreground-muted"
          />
          <h2 className="text-[13px] font-semibold text-foreground">핵심 기준</h2>
        </div>
        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["허용 자산", listValue(policy.allowedAssets)],
            ["건별 거래 한도", formatUsd(policy.maxTransactionUsd)],
            ["일일 사용 한도", formatUsd(policy.dailyLimitUsd)],
            [
              "최소 보유 잔액",
              `${policy.minimumReserve.amount.toFixed(2)} ${policy.minimumReserve.asset} 이상`,
            ],
            ["최대 슬리피지", formatBps(policy.maxSlippageBps)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] text-foreground-subtle">{label}</dt>
              <dd className="mt-1 text-[13px] font-medium text-foreground tabular-nums">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-7 space-y-7">
        <PolicySection title="자산 범위">
          <PolicyRow
            label="허용 입력 mint"
            value={<MintList values={policy.allowedInputMints} />}
          />
          <PolicyRow
            label="허용 출력 mint"
            value={<MintList values={policy.allowedOutputMints} />}
          />
          <PolicyRow
            label="허용 자산"
            value={listValue(policy.allowedAssets)}
          />
        </PolicySection>

        <PolicySection title="거래 한도">
          <PolicyRow
            label="건별 최대 거래 금액"
            value={formatUsd(policy.maxTransactionUsd)}
          />
          <PolicyRow
            label="일일 사용 한도"
            value={formatUsd(policy.dailyLimitUsd)}
          />
          <PolicyRow
            label="최소 보유 잔액"
            value={`${policy.minimumReserve.amount.toFixed(2)} ${policy.minimumReserve.asset} 이상`}
          />
          <PolicyRow
            label="최대 슬리피지"
            value={formatBps(policy.maxSlippageBps)}
          />
          <PolicyRow
            label="최대 가격 영향"
            value={formatBps(policy.maxPriceImpactBps)}
          />
          <PolicyRow
            label="시세 최대 유효 시간"
            value={`${policy.quoteMaxAgeSeconds}초`}
          />
        </PolicySection>

        <PolicySection title="실행 안전 조건">
          <PolicyRow
            label="실행 전 검증"
            value={policy.simulationRequired ? "필수" : "사용 안 함"}
          />
          <PolicyRow
            label="허용 프로그램"
            value={listValue(policy.allowedPrograms)}
          />
          <PolicyRow
            label="허용 서명자"
            value={listValue(policy.allowedSigners)}
          />
        </PolicySection>

        <PolicySection title="비상 보호">
          <div className="flex flex-wrap items-center gap-2 py-3">
            <IconShieldCheck
              size={16}
              stroke={1.7}
              className={
                policy.circuitBreakerStatus === "ACTIVE"
                  ? "text-status-auto"
                  : "text-status-block"
              }
            />
            <span className="text-[12px] text-foreground-muted">
              보호 시스템
            </span>
            <span
              className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-[0.04em] ${
                policy.circuitBreakerStatus === "ACTIVE"
                  ? "border-status-auto/25 bg-status-auto-subtle text-status-auto"
                  : "border-status-block/25 bg-status-block-subtle text-status-block"
              }`}
            >
              {policy.circuitBreakerStatus}
            </span>
            <span className="text-[13px] font-medium text-foreground">
              {policy.circuitBreakerStatus === "ACTIVE"
                ? "자동 실행 가능"
                : "자동 실행 중단"}
            </span>
          </div>
          <PolicyRow
            label="Circuit Breaker 상태"
            value={policy.circuitBreakerStatus}
          />
          <PolicyRow
            label="Circuit Breaker 세부 파라미터"
            value={circuitParametersDisplay}
          />
        </PolicySection>
      </div>

      <footer className="mt-8 flex items-center gap-1.5 border-t border-border pt-4 text-[11px] text-foreground-subtle">
        <IconCheck size={13} stroke={1.7} />
        표시된 기준은 데모용이며 투자 권고가 아닙니다.
      </footer>
    </div>
  );
}
