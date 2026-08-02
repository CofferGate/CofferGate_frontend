import type { ReactNode } from "react";
import { SideNav } from "./side-nav";
import { TopBar } from "./top-bar";
import { consoleStateProvider } from "@/lib/data";
import { sessionProvider } from "@/lib/auth";

export async function AppShell({ children }: { children: ReactNode }) {
  const [snapshotResult, session] = await Promise.all([
    Promise.resolve(consoleStateProvider.getConsoleSnapshot()).then(
      (value) => value,
      () => null,
    ),
    sessionProvider.getSession(),
  ]);
  const now = new Date().toISOString();

  return (
    <div
      id="app-shell-background"
      className="flex min-h-screen max-w-full overflow-x-hidden bg-background font-['Pretendard_Variable',Pretendard,sans-serif] text-foreground"
    >
      <SideNav />
      <div className="flex min-w-0 max-w-full flex-1 flex-col overflow-x-hidden">
        <TopBar snapshot={snapshotResult} session={session} now={now} />
        <main className="min-w-0 max-w-full flex-1 overflow-x-hidden overflow-y-auto">
          <div className="mx-auto w-full min-w-0 max-w-[1280px] px-4 py-8 sm:px-7 lg:px-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
