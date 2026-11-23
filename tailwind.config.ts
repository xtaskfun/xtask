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
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        rainbow: "linear-gradient(90deg, #ff1a1a, #ff8a00, #ffe600, #2bff2b, #00f0ff, #1a3cff, #b300ff)",
        "rainbow-loop":
          "linear-gradient(90deg, #ff1a1a, #ff8a00, #ffe600, #2bff2b, #00f0ff, #1a3cff, #b300ff, #ff1a1a)",
        grid: "linear-gradient(to right, #ffffff08 1px, transparent 1px), linear-gradient(to bottom, #ffffff08 1px, transparent 1px)",
      },
      keyframes: {
        aurora: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(8%, -6%) scale(1.1)" },
          "66%": { transform: "translate(-6%, 6%) scale(0.95)" },
        },
        shimmer: { "0%": { backgroundPosition: "0% 50%" }, "100%": { backgroundPosition: "200% 50%" } },
        float: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        "pop-in": {
          "0%": { opacity: "0", transform: "translateY(8px) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "fade-up": { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        aurora: "aurora 18s ease-in-out infinite",
        "aurora-slow": "aurora 26s ease-in-out infinite reverse",
        shimmer: "shimmer 4s linear infinite",
        float: "float 6s ease-in-out infinite",
        "float-delayed": "float 7s ease-in-out 1.5s infinite",
        marquee: "marquee 30s linear infinite",
        "pop-in": "pop-in 0.5s cubic-bezier(.2,.8,.2,1) both",
        "fade-up": "fade-up 0.7s cubic-bezier(.2,.8,.2,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
