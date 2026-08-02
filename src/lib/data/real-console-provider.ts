import { apiResponseSchema, consoleSnapshotSchema } from "@/lib/domain";
import { callBackend } from "./coffergate-backend";
import type { ConsoleStateProvider } from "./console-provider";

export const realConsoleStateProvider: ConsoleStateProvider = {
  async getConsoleSnapshot() {
    const response = await callBackend<unknown>("/api/v1/dashboard");
    return apiResponseSchema(consoleSnapshotSchema).parse(response).data;
  },
};
