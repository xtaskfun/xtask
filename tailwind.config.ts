import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#000000",
        surface: "#0a0a0a",
        card: "#101010",
        line: "#222222",
        muted: "#8f8f8f",
        // Logo spectrum
        brand: { DEFAULT: "#00f0ff", soft: "#00f0ff1a" },
        accent: "#2bff2b",
        spectrum: {
          red: "#ff1a1a",
          orange: "#ff8a00",
          yellow: "#ffe600",
          green: "#2bff2b",
          cyan: "#00f0ff",
          blue: "#1a3cff",
          violet: "#b300ff",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        rainbow: "linear-gradient(90deg, #ff1a1a, #ff8a00, #ffe600, #2bff2b, #00f0ff, #1a3cff, #b300ff)",
        grid: "linear-gradient(to right, #ffffff08 1px, transparent 1px), linear-gradient(to bottom, #ffffff08 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
