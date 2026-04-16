import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        neon: "#00ff88",
        gold: "#ffd700",
        electric: "#00ccff",
        void: "#050508",
        surface: "#0c0c12",
        muted: "#8a8a9a",
      },
      fontFamily: {
        display: ["Orbitron", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        neon: "0 0 24px rgba(0, 255, 136, 0.35)",
        gold: "0 0 24px rgba(255, 215, 0, 0.25)",
        electric: "0 0 24px rgba(0, 204, 255, 0.3)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, rgba(5,5,8,0.2), rgba(5,5,8,0.95)), radial-gradient(circle at 50% 0%, rgba(0,255,136,0.08), transparent 55%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
