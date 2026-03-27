import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#050814",
        panel: "#0b1220",
        panel2: "#111827",
        line: "rgba(255,255,255,0.08)",
        accent: "#6D5DF6",
        accent2: "#34D1FF",
        win: "#22c55e",
        warn: "#f59e0b",
        danger: "#ef4444"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(109, 93, 246, 0.28), 0 16px 50px rgba(52, 209, 255, 0.12)"
      }
    }
  },
  plugins: []
} satisfies Config;
