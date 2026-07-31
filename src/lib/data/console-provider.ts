import type { ConsoleSnapshot } from "@/lib/domain";

export interface ConsoleStateProvider {
  getConsoleSnapshot(): Promise<ConsoleSnapshot>;
}
