export type Category = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

export const categories: Category[] = [
  {
    id: "fintech",
    name: "Fintech & Banking",
    description: "Brokerages, neobanks, and cash bonuses that convert.",
    icon: "💳",
  },
  {
    id: "crypto",
    name: "Crypto",
    description: "Exchange bonuses, staking rewards, and learn-to-earn.",
    icon: "₿",
  },
  {
    id: "saas",
    name: "SaaS & Tools",
    description: "B2B tools with recurring affiliate upside.",
    icon: "🛠️",
  },
  {
    id: "ai",
    name: "AI Tools",
    description: "AI video, voice, and creator tools with affiliate payouts.",
    icon: "🤖",
  },
  {
    id: "travel",
    name: "Travel & Rewards",
    description: "Airline miles, hotel points, and card referrals.",
    icon: "✈️",
  },
  {
    id: "ecommerce",
    name: "E‑commerce",
    description: "Marketplaces and creator storefronts with strong CPA.",
    icon: "🛒",
  },
  // NOTE: "Health & Wellness" (id: health) was removed 2026-10-11 — it had zero
  // programs and rendered an empty category. Re-add it only when a real
  // program exists in that category. Do not list empty categories.
];
