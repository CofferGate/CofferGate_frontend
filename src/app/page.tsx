"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import {
  IconArrowDown,
  IconArrowRight,
  IconEye,
  IconGavel,
  IconLayoutDashboard,
  IconPlayerPlay,
  IconSparkles,
} from "@tabler/icons-react";
import { Logo } from "@/components/Logo";

const VALUE_CARDS = [
  {
    kicker: "OBSERVE · PROPOSE",
    title: "AI가 시장을 읽고 제안합니다",
    description:
      "Gemini가 온체인 상태를 해석해 근거와 확신도가 담긴 실행 제안을 만듭니다.",
    icon: IconSparkles,
    colorClass: "text-status-proposal",
  },
  {
    kicker: "POLICY · DECIDE",
    title: "정책이 예외 없이 판단합니다",
    description:
      "결정론적 Policy Gate가 모든 제안을 AUTO, NO_ACTION, BLOCK으로 판정합니다.",
    icon: IconGavel,
    colorClass: "text-status-auto",
  },
  {
    kicker: "EXECUTE · AUDIT",
    title: "안전하게 실행하고 증명합니다",
    description:
      "시뮬레이션과 KMS 서명을 거쳐 실행하며, 전 과정을 하나의 제안 ID로 연결합니다.",
    icon: IconEye,
    colorClass: "text-status-observed",
  },
];

export default function LandingPage() {
  const handlePointerMove = (event: MouseEvent<HTMLDivElement>) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 2;
    const y = (event.clientY / window.innerHeight - 0.5) * 2;
    event.currentTarget.style.setProperty("--pointer-x", `${x}`);
    event.currentTarget.style.setProperty("--pointer-y", `${y}`);
  };

  return (
    <main
      className="cg-landing relative min-h-screen overflow-hidden bg-background"
      onMouseMove={handlePointerMove}
    >
      <div aria-hidden className="cg-hero-glow pointer-events-none absolute inset-0" />
      <div aria-hidden className="cg-grid pointer-events-none absolute inset-0" />
      <div aria-hidden className="cg-vignette pointer-events-none absolute inset-0" />

      <div className="relative mx-auto flex max-w-shell flex-col px-6 sm:px-8">
        <section className="relative flex min-h-screen flex-col items-center justify-center pb-12 text-center">
          <div className="cg-reveal cg-reveal-logo relative grid h-[clamp(190px,24vh,260px)] w-[clamp(190px,24vh,260px)] place-items-center">
            <div aria-hidden className="cg-orbit cg-orbit-outer absolute inset-0 rounded-full" />
            <div aria-hidden className="cg-orbit cg-orbit-inner absolute inset-[9%] rounded-full" />
            <span aria-hidden className="cg-orbit-node absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#c9ad68]" />
            <Logo
              variant="symbol"
              size={180}
              glow
              animated
              className="relative z-10 h-[72%] w-[72%] items-center justify-center"
            />
          </div>

          <div className="cg-reveal cg-reveal-title mt-8 w-full">
            <h1
              className="bg-[linear-gradient(112deg,#fffdf7_12%,#f5f1ed_54%,#d8ccf6_100%)] bg-clip-text text-[clamp(2.7rem,6.2vw,5.25rem)] font-semibold leading-[0.96] tracking-[0.025em] text-transparent"
              style={{
                fontFamily:
                  '"Avenir Next", "Segoe UI Variable Display", "Helvetica Neue", Arial, sans-serif',
              }}
            >
              COFFERGATE
            </h1>
          </div>

          <div className="cg-reveal cg-reveal-copy mt-7 w-full">
            <div className="mb-3 text-[9px] font-medium uppercase tracking-[0.32em] text-[#9983c8]">
              Autonomous Asset Gateway
            </div>
            <p className="whitespace-nowrap text-[1.05rem] font-semibold tracking-normal text-[#ddd7e5] sm:text-[1.125rem]">
              자동화는 빠르게. 자산은 안전하게.
            </p>
          </div>

          <div className="cg-reveal cg-reveal-actions mt-9 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href="/dashboard"
              className="group inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-[#9b7de0]/55 bg-[linear-gradient(145deg,#6843ae_0%,#4b2b82_100%)] px-5 text-sm font-semibold text-[#fbf8ff] shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_8px_24px_rgba(45,24,81,.28)] transition-[transform,border-color,box-shadow,background] duration-300 hover:-translate-y-0.5 hover:border-[#b49be8]/75 hover:shadow-[inset_0_1px_0_rgba(255,255,255,.24),0_11px_30px_rgba(81,47,137,.38),0_0_20px_rgba(139,92,246,.12)] sm:w-auto"
            >
              <IconLayoutDashboard size={16} stroke={1.65} />
              대시보드 열기
              <IconArrowRight size={14} stroke={1.75} className="ml-0.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/demo"
              className="group inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-[#8f71cf]/35 bg-[#121019]/65 px-5 text-sm font-medium text-[#d9d5e1] shadow-[inset_0_1px_0_rgba(255,255,255,.035)] backdrop-blur-md transition-[border-color,background-color,color] duration-300 hover:border-[#9f82dc]/55 hover:bg-[#191522]/80 hover:text-[#f2edf8] sm:w-auto"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full border border-[#8f71cf]/35 bg-[#8060bb]/10 transition-[background-color,border-color] duration-300 group-hover:border-[#ad90e5]/55 group-hover:bg-[#8060bb]/20">
                <IconPlayerPlay size={12} stroke={1.8} />
              </span>
              데모 보기
            </Link>
          </div>

          <a
            href="#system"
            aria-label="시스템 소개로 스크롤"
            className="cg-scroll-cue absolute bottom-7 flex flex-col items-center gap-2 text-[9px] uppercase tracking-[0.35em] text-foreground-subtle transition-colors hover:text-foreground-muted"
          >
            Scroll
            <IconArrowDown size={16} stroke={1.3} />
          </a>
        </section>

        <section id="system" className="flex flex-col gap-4 pb-24 pt-14 sm:flex-row sm:items-stretch">
          {VALUE_CARDS.map((card, index) => {
            const CardIcon = card.icon;
            return (
              <div key={card.title} className="flex flex-1 items-stretch gap-4">
                <article className="group flex-1 rounded-2xl border border-white/[.07] bg-white/[.025] p-6 backdrop-blur-sm transition duration-500 hover:-translate-y-1 hover:border-[#9b7aee]/25 hover:bg-white/[.04]">
                  <CardIcon size={21} stroke={1.5} className={card.colorClass} />
                  <div className="mt-5 text-[10px] tracking-[0.2em] text-foreground-subtle">
                    {card.kicker}
                  </div>
                  <h2 className="mt-3 text-sm font-medium text-foreground">{card.title}</h2>
                  <p className="mt-2 text-xs leading-relaxed text-foreground-muted">{card.description}</p>
                </article>
                {index < VALUE_CARDS.length - 1 && (
                  <div className="hidden items-center sm:flex">
                    <IconArrowRight size={15} stroke={1.4} className="text-foreground-subtle" />
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
