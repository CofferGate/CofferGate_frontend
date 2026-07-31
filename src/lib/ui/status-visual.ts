import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconClockHour4,
  IconHelpCircle,
  type Icon,
} from "@tabler/icons-react";
import type { PolicyDecision, ProposalStatus } from "@/lib/domain";

/**
 * Status color is used sparingly (SPEC redesign: green/red/violet/blue/amber
 * only). Every other status renders neutral and leans on the icon + label
 * for meaning instead of color.
 */
export function statusVisual(status: ProposalStatus): {
  icon: Icon;
  colorClass: string;
} {
  switch (status) {
    case "CONFIRMED":
    case "RECONCILED":
    case "POLICY_APPROVED":
      return { icon: IconCircleCheck, colorClass: "text-status-auto" };
    case "ESCALATED":
      return { icon: IconAlertTriangle, colorClass: "text-status-escalate" };
    case "BLOCKED":
    case "FAILED":
      return { icon: IconCircleX, colorClass: "text-status-block" };
    case "EXECUTING":
    case "SUBMITTED":
    case "EXPIRED":
      return { icon: IconClockHour4, colorClass: "text-foreground-muted" };
    default:
      return { icon: IconHelpCircle, colorClass: "text-foreground-muted" };
  }
}

export function decisionTextClass(decision: PolicyDecision | undefined): string {
  switch (decision) {
    case "AUTO":
      return "text-status-auto";
    case "ESCALATE":
      return "text-status-escalate";
    case "BLOCK":
      return "text-status-block";
    default:
      return "text-foreground-muted";
  }
}
