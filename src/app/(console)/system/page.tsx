import type { Icon } from "@tabler/icons-react";
import {
  IconAlertTriangle,
  IconBrain,
  IconCloudComputing,
  IconDatabase,
  IconHelpCircle,
  IconRoute,
  IconServerCog,
  IconShieldLock,
  IconWorld,
} from "@tabler/icons-react";
import { dataProvider } from "@/lib/data";
import type {
  ServiceReadinessStatus,
  SystemServiceId,
} from "@/lib/domain";

interface ServiceDefinition {
  id: SystemServiceId;
  name: string;
  technicalName: string;
  description: string;
  icon: Icon;
}

const SERVICES: ServiceDefinition[] = [
  {
    id: "control-plane",
    name: "자동화 제어",
    technicalName: "Control Plane",
    description: "제안과 실행 흐름을 관리합니다.",
    icon: IconServerCog,
  },
  {
    id: "vertex-ai",
    name: "AI 분석",
    technicalName: "Vertex AI",
    description: "시장 상태를 분석하고 제안을 생성합니다.",
    icon: IconBrain,
  },
  {
    id: "firestore",
    name: "데이터 저장",
    technicalName: "Firestore",
    description: "제안과 실행 기록을 저장합니다.",
    icon: IconDatabase,
  },
  {
    id: "private-executor",
    name: "거래 실행",
    technicalName: "Private Executor",
    description: "정책을 통과한 거래를 안전하게 실행합니다.",
    icon: IconCloudComputing,
  },
  {
    id: "cloud-kms",
    name: "보안 서명",
    technicalName: "Cloud KMS",
    description: "허용된 거래에만 보안 서명을 수행합니다.",
    icon: IconShieldLock,
  },
  {
    id: "jupiter-api",
    name: "교환 경로",
    technicalName: "Jupiter API",
    description: "자산 교환 경로와 가격을 확인합니다.",
    icon: IconRoute,
  },
  {
    id: "solana-rpc",
    name: "블록체인 연결",
    technicalName: "Solana RPC",
    description: "거래 제출과 온체인 상태를 확인합니다.",
    icon: IconWorld,
  },
];

const STATUS_PRESENTATION: Record<
  ServiceReadinessStatus,
  { label: string; className: string; dotClassName: string; icon: Icon }
> = {
  healthy: {
    label: "정상",
    className: "border-status-auto/25 bg-status-auto-subtle text-status-auto",
    dotClassName: "bg-status-auto",
    icon: IconShieldLock,
  },
  degraded: {
    label: "지연",
    className:
      "border-status-escalate/25 bg-status-escalate-subtle text-status-escalate",
    dotClassName: "bg-status-escalate",
    icon: IconAlertTriangle,
  },
  down: {
    label: "중단",
    className: "border-status-block/25 bg-status-block-subtle text-status-block",
    dotClassName: "bg-status-block",
    icon: IconAlertTriangle,
  },
  unknown: {
    label: "확인 불가",
    className: "border-border-strong bg-surface-raised text-foreground-muted",
    dotClassName: "bg-status-neutral",
    icon: IconHelpCircle,
  },
};

function overallSummary(statuses: ServiceReadinessStatus[]) {
  if (statuses.every((status) => status === "unknown")) {
    return "현재 시스템 상태를 확인할 수 없습니다.";
  }
  if (statuses.some((status) => status === "down")) {
    return "일부 기능을 사용할 수 없습니다.";
  }
  if (statuses.some((status) => status === "degraded")) {
    return "일부 서비스가 지연되고 있습니다.";
  }
  if (statuses.every((status) => status === "healthy")) {
    return "모든 시스템이 정상적으로 작동하고 있습니다.";
  }
  return "일부 시스템의 상태를 확인할 수 없습니다.";
}

export default async function SystemStatusPage() {
  const response = await dataProvider.getSystemReadiness();
  const readiness = response.data;
  const serviceRows = SERVICES.map((service) => {
    const health = readiness?.services.find(
      (entry) => entry.serviceId === service.id,
    );
    return {
      ...service,
      status: health?.status ?? ("unknown" as const),
      checkedAt: health?.checkedAt,
      impact: health?.impact,
      action: health?.action,
    };
  });
  const latestCheckedAt = readiness?.checkedAt;
  const summary = overallSummary(serviceRows.map((service) => service.status));
  const allStatusesUnknown = serviceRows.every(
    (service) => service.status === "unknown",
  );
  const checkedAtMs = latestCheckedAt ? Date.parse(latestCheckedAt) : NaN;
  const isStale =
    Number.isFinite(checkedAtMs) && Date.now() - checkedAtMs >= 60_000;

  return (
    <div className="pt-2">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[22px] font-semibold leading-tight text-foreground">
            시스템 상태
          </h1>
          {readiness?.dataMode === "mock" && (
            <span className="rounded border border-border-strong bg-surface-raised px-2 py-0.5 text-[10px] font-medium text-foreground-muted">
              MOCK READINESS
            </span>
          )}
        </div>
        <p className="mt-1.5 text-[13px] text-foreground-muted">
          자동화와 온체인 실행에 필요한 서비스의 연결 상태를 확인합니다.
        </p>
        <p className="mt-2 text-[11px] text-foreground-subtle tabular-nums">
          마지막 상태 확인{" "}
          {latestCheckedAt ? (
            <time dateTime={latestCheckedAt} className="text-foreground-muted">
              {latestCheckedAt}
            </time>
          ) : (
            <span className="text-foreground-muted">확인 시각 없음</span>
          )}
        </p>
        {isStale && (
          <p className="mt-1 text-[10px] text-status-escalate">
            마지막 readiness 확인 시각이 60초 이상 경과했습니다.
          </p>
        )}
      </header>

      <section className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
          {allStatusesUnknown ? (
            <IconHelpCircle
              size={16}
              stroke={1.7}
              className="shrink-0 text-foreground-muted"
            />
          ) : (
            <span
              aria-hidden
              className={`h-2 w-2 shrink-0 rounded-full ${
                serviceRows.some((service) => service.status === "down")
                  ? "bg-status-block"
                  : serviceRows.some(
                        (service) => service.status === "degraded",
                      )
                    ? "bg-status-escalate"
                    : "bg-status-auto"
              }`}
            />
          )}
          <p className="text-[13px] font-medium text-foreground">{summary}</p>
        </div>

        <ul className="divide-y divide-border/70">
          {serviceRows.map((service) => {
            const presentation = STATUS_PRESENTATION[service.status];
            const StatusIcon = presentation.icon;
            const ServiceIcon = service.icon;
            const showIncident =
              service.status === "degraded" || service.status === "down";

            return (
              <li
                key={service.id}
                className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-surface-raised text-foreground-muted">
                    <ServiceIcon size={16} stroke={1.6} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-[13px] font-medium text-foreground">
                        {service.name}
                      </span>
                      <span className="text-[10px] text-foreground-subtle">
                        {service.technicalName}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-foreground-muted">
                      {service.description}
                    </p>
                    {showIncident && (service.impact || service.action) && (
                      <div className="mt-2 space-y-0.5 text-[11px]">
                        {service.impact && (
                          <p className="text-foreground-muted">
                            영향: {service.impact}
                          </p>
                        )}
                        {service.action && (
                          <p className="text-foreground-subtle">
                            대응: {service.action}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <span
                  className={`inline-flex w-fit items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-medium ${presentation.className}`}
                >
                  <span
                    aria-hidden
                    className={`h-1.5 w-1.5 rounded-full ${presentation.dotClassName}`}
                  />
                  <StatusIcon size={12} stroke={1.8} />
                  {presentation.label}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
