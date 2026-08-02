import Link from "next/link";
import { IconAlertTriangle, IconArrowLeft } from "@tabler/icons-react";
import { dataProvider } from "@/lib/data";
import { DemoControl } from "./demo-control";
import { sessionProvider } from "@/lib/auth";
import { selectDemoProposals } from "./select-demo-proposals";

export default async function DemoControlPage() {
  const [{ data: proposals }, session] = await Promise.all([
    dataProvider.listProposals(),
    sessionProvider.getSession(),
  ]);
  const { autoProposal, blockedProposal, missingScenarios } =
    selectDemoProposals(proposals);

  if (!autoProposal || !blockedProposal) {
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
        <div className="mt-6 rounded-xl border border-status-block/25 bg-status-block-subtle px-5 py-4">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <IconAlertTriangle
              size={17}
              stroke={1.7}
              className="text-status-block"
            />
            데모에 필요한 실행 사례가 부족합니다.
          </div>
          <p className="mt-2 text-xs text-foreground-muted">
            {missingScenarios.join(", ")} Proposal이 생성되면 이 페이지에서
            실제 Devnet 시나리오를 확인할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DemoControl
      autoProposal={autoProposal}
      blockedProposal={blockedProposal}
      session={session}
      dataMode="LIVE"
    />
  );
}
