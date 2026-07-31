"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { NAV_ITEMS } from "./nav-items";

export function SideNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="hidden w-60 shrink-0 flex-col border-r border-border md:flex"
    >
      <div className="px-6 py-7">
        <Link
          href="/"
          className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Logo size={22} />
        </Link>
        <div className="mt-1 text-[11px] text-foreground-subtle">
          Treasury Console
        </div>
      </div>

      <ul className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  isActive
                    ? "border border-border bg-surface text-foreground"
                    : "border border-transparent text-foreground-muted hover:bg-surface/60 hover:text-foreground"
                }`}
              >
                <Icon size={18} stroke={1.75} className="shrink-0" />
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
