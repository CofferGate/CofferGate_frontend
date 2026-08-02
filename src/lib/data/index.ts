import { realDataProvider } from "./real-provider";
import { realConsoleStateProvider } from "./real-console-provider";
import type { DataProvider } from "./provider";

// Single swap point: point this at a real-API-backed provider later
// without touching any component that calls `dataProvider`.
export const dataProvider: DataProvider = realDataProvider;
export const consoleStateProvider = realConsoleStateProvider;

export type { DataProvider } from "./provider";
export type { ConsoleStateProvider } from "./console-provider";
