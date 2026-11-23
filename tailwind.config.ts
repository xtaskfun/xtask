import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#07080c",
        surface: "#0f1118",
        card: "#141722",
        line: "#232838",
        muted: "#8a90a6",
        brand: { DEFAULT: "#1d9bf0", soft: "#1d9bf01a" },
        accent: "#a3ff12",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        grid: "linear-gradient(to right, #ffffff08 1px, transparent 1px), linear-gradient(to bottom, #ffffff08 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
