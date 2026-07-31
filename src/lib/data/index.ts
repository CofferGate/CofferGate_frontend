import { mockDataProvider } from "./mock-provider";
import { mockConsoleStateProvider } from "./mock-console-provider";
import type { DataProvider } from "./provider";

// Single swap point: point this at a real-API-backed provider later
// without touching any component that calls `dataProvider`.
export const dataProvider: DataProvider = mockDataProvider;
export const consoleStateProvider = mockConsoleStateProvider;

export type { DataProvider } from "./provider";
export type { ConsoleStateProvider } from "./console-provider";
