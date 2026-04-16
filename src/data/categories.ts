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
  {
    id: "health",
    name: "Health & Wellness",
    description: "Fitness apps, telehealth, and subscription boxes.",
    icon: "💚",
  },
];
