export type UserRole = "Viewer" | "Operator" | "Admin";

export type Permission =
  | "view:dashboard"
  | "view:proposals"
  | "view:activity"
  | "view:policy"
  | "view:system"
  | "request:evaluation"
  | "review:escalation"
  | "manage:policy"
  | "manage:circuit-breaker"
  | "manage:demo";

export interface ConsoleSession {
  role: UserRole;
  dataMode: "mock" | "live";
  label: string;
}

const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<Permission>> = {
  Viewer: new Set<Permission>([
    "view:dashboard",
    "view:proposals",
    "view:activity",
    "view:policy",
    "view:system",
  ]),
  Operator: new Set<Permission>([
    "view:dashboard",
    "view:proposals",
    "view:activity",
    "view:policy",
    "view:system",
    "request:evaluation",
    "review:escalation",
  ]),
  Admin: new Set<Permission>([
    "view:dashboard",
    "view:proposals",
    "view:activity",
    "view:policy",
    "view:system",
    "request:evaluation",
    "review:escalation",
    "manage:policy",
    "manage:circuit-breaker",
    "manage:demo",
  ]),
};

export function hasPermission(
  session: Pick<ConsoleSession, "role">,
  permission: Permission,
) {
  return ROLE_PERMISSIONS[session.role].has(permission);
}
