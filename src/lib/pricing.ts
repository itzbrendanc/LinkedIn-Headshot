export type PlanId = "basic" | "pro" | "executive";

export type Plan = {
  id: PlanId;
  name: string;
  priceUsd: number;
  images: number;
  includedStyles: number | "all";
  blurb: string;
  highlights: string[];
};

export const PLANS: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    priceUsd: 19,
    images: 20,
    includedStyles: 2,
    blurb: "Perfect for a quick LinkedIn refresh.",
    highlights: [
      "20 headshots delivered",
      "Pick 2 styles",
      "Standard queue",
      "Private gallery + downloads",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceUsd: 49,
    images: 80,
    includedStyles: 8,
    blurb: "For founders and operators who want options.",
    highlights: [
      "80 headshots delivered",
      "Pick up to 8 styles",
      "Faster queue",
      "Regenerations while credits last",
    ],
  },
  {
    id: "executive",
    name: "Executive",
    priceUsd: 99,
    images: 120,
    includedStyles: "all",
    blurb: "Fastest queue + premium review.",
    highlights: [
      "120 headshots delivered",
      "All styles unlocked",
      "Fastest queue priority",
      "Premium review (placeholder)",
    ],
  },
];
