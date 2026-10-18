import type { Config } from "tailwindcss";

// REBUILD 2026-10-18: theme moved from neon-green sci-fi to the house
// dark-premium + gold money identity. Legacy class names (neon/electric/
// cyber) are kept so existing components re-skin without a class rewrite —
// they now resolve to gold tones.
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        neon:     "#ffd700",
        gold:     "#ffd700",
        electric: "#ffe27a",
        cyber:    "#c9962e",
        void:     "#050403",
        surface:  "#0b0906",
        surface2: "#14100a",
        muted:    "#9a8f7a",
      },
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        body:    ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        neon:      "0 0 10px rgba(255,215,0,0.45), 0 0 40px rgba(255,215,0,0.18), 0 0 80px rgba(255,215,0,0.07)",
        "neon-sm": "0 0 6px rgba(255,215,0,0.35), 0 0 20px rgba(255,215,0,0.13)",
        gold:      "0 0 10px rgba(255,215,0,0.5), 0 0 40px rgba(255,215,0,0.18)",
        electric:  "0 0 10px rgba(255,226,122,0.45), 0 0 40px rgba(255,226,122,0.16)",
        cyber:     "0 0 10px rgba(201,150,46,0.5), 0 0 40px rgba(201,150,46,0.18)",
        "deep-1":  "0 8px 32px rgba(0,0,0,0.7)",
        "deep-2":  "0 24px 80px rgba(0,0,0,0.8)",
        "deep-3":  "0 48px 120px rgba(0,0,0,0.92)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, rgba(5,4,3,0.15), rgba(5,4,3,0.97)), radial-gradient(circle at 50% 0%, rgba(255,215,0,0.10), transparent 55%)",
        "neon-gradient":  "linear-gradient(135deg, #ffd700, #ffb700)",
        "gold-gradient":  "linear-gradient(135deg, #ffd700, #ff8c00)",
        "cyber-gradient": "linear-gradient(135deg, #c9962e, #ffd700)",
      },
    },
  },
  plugins: [],
} satisfies Config;
