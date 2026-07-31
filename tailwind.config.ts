import type { Config } from "tailwindcss";

const statusColor = (name: string) => ({
  DEFAULT: `var(--status-${name})`,
  subtle: `var(--status-${name}-subtle)`,
});

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // Only two weights exist in this system — regular and medium.
    fontWeight: {
      normal: "400",
      medium: "500",
    },
    extend: {
      colors: {
        background: "var(--color-bg)",
        surface: {
          DEFAULT: "var(--color-surface)",
          raised: "var(--color-surface-raised)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          strong: "var(--color-border-strong)",
        },
        foreground: {
          DEFAULT: "var(--color-foreground)",
          muted: "var(--color-foreground-muted)",
          subtle: "var(--color-foreground-subtle)",
        },
        status: {
          observed: statusColor("observed"),
          proposal: statusColor("proposal"),
          auto: statusColor("auto"),
          escalate: statusColor("escalate"),
          block: statusColor("block"),
          neutral: statusColor("neutral"),
        },
      },
      maxWidth: {
        shell: "1440px",
      },
      boxShadow: {
        none: "none",
      },
    },
  },
  plugins: [],
};
export default config;
