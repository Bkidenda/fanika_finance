// Pricing tiers — single source of truth shared by /pricing and in-app gating.
export type PlanId = "free" | "pro" | "family";

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  priceLabel: string;
  per: string;
  highlight?: boolean;
  features: string[];
  ctaLabel: string;
};

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Start your stewardship journey.",
    priceLabel: "KSh 0",
    per: "/ forever",
    ctaLabel: "Create account",
    features: [
      "Budgets & expenses (current month + 1 ahead)",
      "Up to 3 connected accounts",
      "Net-income based, multi-currency",
      "Optional automated tithe set-aside",
      "Monthly close & reconciliation",
      "Daily devotional layer",
      "Monthly PDF statement",
    ],
  },
  {
    id: "pro",
    name: "Steward Pro",
    tagline: "For the disciplined individual.",
    priceLabel: "KSh 2,000",
    per: "/ month",
    highlight: true,
    ctaLabel: "Start Pro",
    features: [
      "Everything in Free",
      "Unlimited accounts, investments & goals",
      "AI financial advisor (current month + 3-month history)",
      "Always-on AI assistant chatbot",
      "Debt planner — formal & informal loans",
      "Subscription watchdog",
      "Recurring budget lines (rent, etc.)",
      "Financial calendar & reminders",
      "Monthly & quarterly PDF statements",
      "Historical insights & data export",
    ],
  },
  {
    id: "family",
    name: "Family Suite",
    tagline: "For households planning together.",
    priceLabel: "KSh 4,000",
    per: "/ month",
    ctaLabel: "Start Family",
    features: [
      "Everything in Steward Pro",
      "Up to 5 household members",
      "Shared budgets & goals",
      "Family obligations tracker",
      "Children allowances & school fees",
      "Joint net-worth reporting",
      "Priority email support",
      "Quarterly stewardship coaching session",
    ],
  },
];
