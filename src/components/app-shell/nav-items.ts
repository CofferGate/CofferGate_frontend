import {
  IconActivity,
  IconLayoutDashboard,
  IconListDetails,
  IconServer2,
  IconShieldCheck,
  type Icon,
} from "@tabler/icons-react";

export interface NavItem {
  label: string;
  labelEn: string;
  href: string;
  icon: Icon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "대시보드", labelEn: "Dashboard", href: "/dashboard", icon: IconLayoutDashboard },
  { label: "제안", labelEn: "Proposals", href: "/proposals", icon: IconListDetails },
  { label: "활동", labelEn: "Activity", href: "/activity", icon: IconActivity },
  { label: "정책", labelEn: "Policy", href: "/policy", icon: IconShieldCheck },
  { label: "시스템", labelEn: "System", href: "/system", icon: IconServer2 },
];
