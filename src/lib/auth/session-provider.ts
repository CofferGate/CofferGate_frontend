import type { ConsoleSession } from "./session";

export interface SessionProvider {
  getSession(): Promise<ConsoleSession>;
}

const MOCK_ADMIN_SESSION: ConsoleSession = {
  role: "Admin",
  dataMode: "mock",
  label: "데모 관리자",
};

export const sessionProvider: SessionProvider = {
  async getSession() {
    return MOCK_ADMIN_SESSION;
  },
};
