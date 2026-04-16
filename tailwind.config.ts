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
          "var(--font-inter)",
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        brand: {
          50: "#ecf4ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8"
        },
        page: {
          DEFAULT: "#edf2fb",
          subtle: "#f6f9ff"
        }
      },
      /* Typography scale */
      fontSize: {
        display: ["2rem", { lineHeight: "2.5rem" }],
        title: ["1.5rem", { lineHeight: "2rem" }],
        "title-sm": ["1.125rem", { lineHeight: "1.75rem" }],
        body: ["1rem", { lineHeight: "1.5rem" }],
        "body-sm": ["0.875rem", { lineHeight: "1.25rem" }],
        caption: ["0.75rem", { lineHeight: "1rem" }]
      },
      spacing: {
        "page-y": "1.5rem",
        "section": "1.25rem",
        "card": "1.25rem",
        "touch": "2.75rem" /* min ~44px touch target */
      },
      borderRadius: {
        card: "1rem",
        "card-lg": "1.25rem",
        input: "0.5rem",
        pill: "9999px"
      },
      boxShadow: {
        card: "0 14px 32px -24px rgba(15, 23, 42, 0.48), 0 6px 14px -12px rgba(15, 23, 42, 0.26)",
        "card-hover": "0 18px 38px -22px rgba(37, 99, 235, 0.4), 0 10px 20px -16px rgba(15, 23, 42, 0.24)",
        glass: "0 6px 16px -12px rgba(15, 23, 42, 0.25)"
      },
      transitionDuration: {
        fast: "150ms",
        normal: "200ms"
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)"
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.25s ease-out"
      }
    }
  },
  plugins: []
};

export default config;
