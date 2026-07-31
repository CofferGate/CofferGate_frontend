"use client";

import { useId } from "react";

interface LogoProps {
  /** Symbol-only for compact placements, or the complete signature. */
  variant?: "symbol" | "wordmark";
  /** Symbol size in pixels. */
  size?: number;
  className?: string;
  glow?: boolean;
  animated?: boolean;
}

function LogoSymbol({
  size,
  glow,
  animated,
}: Pick<LogoProps, "size" | "glow" | "animated">) {
  const rawId = useId();
  const id = rawId.replace(/:/g, "");
  const violet = `cg-violet-${id}`;
  const gold = `cg-gold-${id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={animated ? "cg-logo-breathe" : undefined}
      style={{
        filter: glow
          ? "drop-shadow(0 0 18px rgba(124, 78, 220, .28))"
          : undefined,
      }}
    >
      <defs>
        <linearGradient id={violet} x1="24" y1="16" x2="96" y2="106">
          <stop stopColor="#D8CBFF" />
          <stop offset=".46" stopColor="#9B7AEE" />
          <stop offset="1" stopColor="#6331B5" />
        </linearGradient>
        <linearGradient id={gold} x1="52" y1="50" x2="70" y2="70">
          <stop stopColor="#F1D99D" />
          <stop offset="1" stopColor="#B88A38" />
        </linearGradient>
      </defs>

      {/* Architectural outer coffer: two fine frames create an inset edge. */}
      <path
        d="M60 8.5 103.3 33.5v53L60 111.5 16.7 86.5v-53L60 8.5Z"
        stroke={`url(#${violet})`}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="m60 15.8 37 21.4v45.6l-37 21.4-37-21.4V37.2L60 15.8Z"
        stroke={`url(#${violet})`}
        strokeWidth="1.15"
        strokeLinejoin="round"
        opacity=".48"
      />

      {/* Rotated inner gate adds the second plane of depth. */}
      <path
        d="m60 24.5 35.5 35.5L60 95.5 24.5 60 60 24.5Z"
        stroke={`url(#${violet})`}
        strokeWidth="1.6"
        strokeLinejoin="round"
        opacity=".78"
      />
      <path
        d="M60 30.5 89.5 60 60 89.5 30.5 60 60 30.5Z"
        stroke={`url(#${violet})`}
        strokeWidth=".9"
        strokeDasharray="1.5 4"
        strokeLinecap="round"
        opacity=".38"
      />

      {/* Vault opening: the right leaf is fixed, the left leaf turns inward. */}
      <path
        d="M60 40v40M60 40l18 8v24l-18 8"
        stroke={`url(#${violet})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m60 40-13 7.5v25L60 80M47 47.5l-7.5 5v15L47 72.5"
        stroke={`url(#${violet})`}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M78 48 84 44.5M78 72l6 3.5"
        stroke={`url(#${violet})`}
        strokeWidth="1"
        strokeLinecap="round"
        opacity=".6"
      />

      {/* The warm core is the single protected asset / decision point. */}
      <circle cx="60" cy="60" r="5.5" fill="#080910" stroke={`url(#${gold})`} strokeWidth="1.5" />
      <path
        d="M60 56.8v6.4M56.8 60h6.4"
        stroke={`url(#${gold})`}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="60" cy="60" r="1.15" fill="#E3C47B" />

      {/* Precision index marks. */}
      <path
        d="M60 8.5v7.3M60 104.2v7.3M16.7 33.5l6.3 3.7M97 82.8l6.3 3.7M103.3 33.5 97 37.2M23 82.8l-6.3 3.7"
        stroke={`url(#${gold})`}
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity=".9"
      />
    </svg>
  );
}

export function Logo({
  variant = "wordmark",
  size = 28,
  className = "",
  glow = false,
  animated = false,
}: LogoProps) {
  if (variant === "symbol") {
    return (
      <span role="img" aria-label="CofferGate" className={`inline-flex ${className}`}>
        <LogoSymbol size={size} glow={glow} animated={animated} />
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label="CofferGate"
      className={`inline-flex items-center ${className}`}
      style={{ gap: Math.max(8, Math.round(size * 0.3)) }}
    >
      <LogoSymbol size={size} glow={glow} animated={animated} />
      <span
        className="font-semibold text-foreground"
        style={{
          fontSize: Math.round(size * 0.54),
          letterSpacing: "0.055em",
        }}
      >
        COFFER<span className="font-light text-[#b9a0f4]">GATE</span>
      </span>
    </span>
  );
}
