import type { Config } from "tailwindcss";
import animatePlugin from "tailwindcss-animate";

export default {
  // Appearance follows the OS via prefers-color-scheme in index.css. There is
  // no class-based toggle, so darkMode is deliberately not configured.
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        // Display is for lesson and section titles only, never body copy.
        display: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      /*
       * Type scale in rem so browser zoom and OS text size scale the whole
       * system. Nothing below 0.8125rem (13px) exists; `text-xs` survives only
       * as the uppercase Label role, never for a sentence.
       */
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.06em" }],
        sm: ["0.875rem", { lineHeight: "1.3125rem" }],
        base: ["1rem", { lineHeight: "1.625rem" }],
        lg: ["1.1875rem", { lineHeight: "1.625rem", letterSpacing: "-0.01em" }],
        xl: ["1.375rem", { lineHeight: "1.875rem", letterSpacing: "-0.01em" }],
        "2xl": ["1.75rem", { lineHeight: "2.125rem", letterSpacing: "-0.015em" }],
        "3xl": ["2.25rem", { lineHeight: "2.5rem", letterSpacing: "-0.02em" }],
        "4xl": ["2.75rem", { lineHeight: "2.75rem", letterSpacing: "-0.02em" }],
      },
      colors: {
        border: "hsl(var(--border))",
        "border-strong": "hsl(var(--rule-strong))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Domain signals. One colour, one meaning.
        clearing: "hsl(var(--clearing))",
        floor: "hsl(var(--floor))",
        nobid: "hsl(var(--nobid))",
        // Supply-chain data encoding. Permitted in the ecosystem map and the
        // chain rail only — never on a button, badge, border, icon or card.
        chain: {
          advertiser: "hsl(var(--chain-advertiser))",
          agency: "hsl(var(--chain-agency))",
          dsp: "hsl(var(--chain-dsp))",
          dmp: "hsl(var(--chain-dmp))",
          exchange: "hsl(var(--chain-exchange))",
          ssp: "hsl(var(--chain-ssp))",
          adserver: "hsl(var(--chain-adserver))",
          publisher: "hsl(var(--chain-publisher))",
          user: "hsl(var(--chain-user))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Accordion transitions only. Nothing in this product loops.
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  // shadcn/ui components rely on this for their enter/exit transitions.
  plugins: [animatePlugin],
} satisfies Config;
