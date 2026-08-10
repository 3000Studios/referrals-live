import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        neon:     "#00ff88",
        gold:     "#ffd700",
        electric: "#34d399",
        cyber:    "#059669",
        void:     "#030407",
        surface:  "#060a14",
        surface2: "#0a0e1e",
        muted:    "#7a7a94",
      },
      fontFamily: {
        display: ["Orbitron", "system-ui", "sans-serif"],
        body:    ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        neon:      "0 0 10px rgba(0,255,136,0.5), 0 0 40px rgba(0,255,136,0.2), 0 0 80px rgba(0,255,136,0.08)",
        "neon-sm": "0 0 6px rgba(0,255,136,0.4), 0 0 20px rgba(0,255,136,0.15)",
        gold:      "0 0 10px rgba(255,215,0,0.5), 0 0 40px rgba(255,215,0,0.18)",
        electric:  "0 0 10px rgba(52,211,153,0.5), 0 0 40px rgba(52,211,153,0.18)",
        cyber:     "0 0 10px rgba(5,150,105,0.5), 0 0 40px rgba(5,150,105,0.18)",
        "deep-1":  "0 8px 32px rgba(0,0,0,0.7)",
        "deep-2":  "0 24px 80px rgba(0,0,0,0.8)",
        "deep-3":  "0 48px 120px rgba(0,0,0,0.92)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, rgba(3,4,7,0.15), rgba(3,4,7,0.97)), radial-gradient(circle at 50% 0%, rgba(0,255,136,0.1), transparent 55%)",
        "neon-gradient":  "linear-gradient(135deg, #00ff88, #34d399)",
        "gold-gradient":  "linear-gradient(135deg, #ffd700, #ff8c00)",
        "cyber-gradient": "linear-gradient(135deg, #059669, #34d399)",
      },
    },
  },
  plugins: [],
} satisfies Config;
