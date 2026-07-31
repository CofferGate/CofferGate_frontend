"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { Logo } from "@/components/Logo";
import { NAV_ITEMS } from "./nav-items";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function MobileNavigation() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    const background = document.getElementById("app-shell-background");
    const previousOverflow = document.body.style.overflow;
    background?.setAttribute("inert", "");
    background?.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;

      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown, true);
      background?.removeAttribute("inert");
      background?.removeAttribute("aria-hidden");
      document.body.style.overflow = previousOverflow;
      window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    };
  }, [open]);

  const drawer = mounted
    ? createPortal(
        <div
          className={`fixed inset-0 z-50 md:hidden ${
            open ? "pointer-events-auto" : "pointer-events-none"
          }`}
          aria-hidden={!open}
        >
          <button
            type="button"
            tabIndex={open ? 0 : -1}
            aria-label="메뉴 닫기"
            onClick={() => setOpen(false)}
            className={`absolute inset-0 bg-black/65 transition-opacity duration-200 motion-reduce:transition-none ${
              open ? "opacity-100" : "opacity-0"
            }`}
          />
          <nav
            id="mobile-navigation-drawer"
            ref={drawerRef}
            aria-label="모바일 내비게이션"
            aria-modal="true"
            role="dialog"
            className={`absolute inset-y-0 left-0 flex w-[min(19rem,86vw)] flex-col border-r border-border bg-background shadow-2xl transition-transform duration-200 motion-reduce:transition-none ${
              open ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-5">
              <Logo size={22} />
              <button
                ref={closeButtonRef}
                type="button"
                tabIndex={open ? 0 : -1}
                onClick={() => setOpen(false)}
                aria-label="메뉴 닫기"
                className="grid h-9 w-9 place-items-center rounded-md border border-border-strong text-foreground-muted hover:bg-surface-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <IconX size={19} stroke={1.8} aria-hidden="true" />
              </button>
            </div>

            <ul className="flex flex-1 flex-col gap-1 px-3 py-4">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      tabIndex={open ? 0 : -1}
                      onClick={() => setOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                        isActive
                          ? "border-border-strong bg-surface-raised text-foreground"
                          : "border-transparent text-foreground-muted hover:bg-surface hover:text-foreground"
                      }`}
                    >
                      <Icon size={18} stroke={1.75} aria-hidden="true" />
                      <span className="font-medium">{item.label}</span>
                      {isActive && (
                        <span className="ml-auto text-[10px] text-cyan-300">
                          현재
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        ref={menuButtonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="메뉴 열기"
        aria-expanded={open}
        aria-controls="mobile-navigation-drawer"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border-strong text-foreground-muted hover:bg-surface-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background md:hidden"
      >
        <IconMenu2 size={18} stroke={1.8} aria-hidden="true" />
      </button>
      {drawer}
    </>
  );
}
