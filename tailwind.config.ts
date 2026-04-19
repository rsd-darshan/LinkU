import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif"
        ]
      },
      letterSpacing: {
        tight: "-0.02em",
        snug: "-0.01em"
      },
      colors: {
        /** Twitter-aligned accent (single emotional color) */
        brand: {
          50: "#e8f7fd",
          100: "#d1effb",
          200: "#a3dff7",
          300: "#75cee8",
          400: "#47bee0",
          500: "#1DA1F2",
          600: "#1a94df",
          700: "#1781c7"
        },
        page: {
          DEFAULT: "#FFFFFF",
          subtle: "#F7F9F9"
        },
        ink: {
          DEFAULT: "#0F1419",
          secondary: "#4E5B66",
          tertiary: "#6B7C8A"
        },
        line: {
          DEFAULT: "#EFF3F4"
        },
        like: "#F91880",
        retweet: "#00BA7C",
        /** Surfaces nested on the feed (aliases of the light shell — not a separate dark theme) */
        main: {
          bg: "#FFFFFF",
          panel: "#F7F9F9",
          raised: "#EFF3F4",
          border: "#EFF3F4",
          fg: "#0F1419",
          muted: "#4E5B66",
          dim: "#4E5B66"
        }
      },
      fontSize: {
        display: ["1.875rem", { lineHeight: "2.25rem", letterSpacing: "-0.02em", fontWeight: "700" }],
        title: ["1.25rem", { lineHeight: "1.45rem", letterSpacing: "-0.02em", fontWeight: "700" }],
        "title-sm": ["1.0625rem", { lineHeight: "1.4rem", letterSpacing: "-0.01em", fontWeight: "700" }],
        tweet: ["1rem", { lineHeight: "1.5rem", letterSpacing: "-0.01em" }],
        body: ["1rem", { lineHeight: "1.45rem" }],
        "body-sm": ["0.9375rem", { lineHeight: "1.35rem" }],
        meta: ["0.8125rem", { lineHeight: "1.2rem" }],
        caption: ["0.75rem", { lineHeight: "1rem" }]
      },
      spacing: {
        "page-y": "1rem",
        section: "0.75rem",
        card: "1rem",
        touch: "2.75rem"
      },
      borderRadius: {
        card: "1rem",
        "card-lg": "1rem",
        input: "9999px",
        pill: "9999px"
      },
      boxShadow: {
        card: "none",
        "card-hover": "none",
        glass: "none"
      },
      transitionDuration: {
        fast: "120ms",
        normal: "160ms"
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.25, 0.1, 0.25, 1)"
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "fade-in": "fade-in 0.15s ease-out",
        "fade-in-up": "fade-in-up 0.18s ease-out"
      }
    }
  },
  plugins: []
};

export default config;
