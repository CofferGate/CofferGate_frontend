import { dataProvider } from "@/lib/data";
import { DemoControl } from "./demo-control";
import { sessionProvider } from "@/lib/auth";

export default async function DemoControlPage() {
  const [{ data: autoProposal }, { data: blockedProposal }, session] =
    await Promise.all([
      dataProvider.getProposal("prop_normal_auto_0001"),
      dataProvider.getProposal("prop_blocked_limit_0001"),
      sessionProvider.getSession(),
    ]);

  return (
    <DemoControl
      autoProposal={autoProposal}
      blockedProposal={blockedProposal}
      session={session}
    />
  );
}
