import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#F2F5FB",
          100: "#E3E9F5",
          200: "#C3CFE8",
          500: "#2B4FB8",
          600: "#22409A",
          700: "#1A3170",
          800: "#122450",
          900: "#0B1A3A",
          950: "#071228",
        },
        emerald: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          500: "#0E9F6E",
          600: "#0B8A5F",
          700: "#08704D",
        },
        accent: {
          50: "#FFF5EC",
          100: "#FFE8D4",
          500: "#D9650B",
          600: "#B95509",
        },
        ink: {
          DEFAULT: "#0F172A",
          muted: "#475569",
          subtle: "#64748B",
        },
        line: "#E6E9F0",
        canvas: "#F7F8FB",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
        pop: "0 10px 30px -10px rgba(11,26,58,0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
