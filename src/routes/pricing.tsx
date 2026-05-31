import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { Check, Calendar } from "lucide-react";

const DEMO_MAILTO = `mailto:bkidenda@gmail.com?subject=Book%20a%20free%20Nuru%20Steward%20demo`;

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Nuru Steward" },
      { name: "description", content: "Three simple tiers. Start free, upgrade for AI advisory and family-scale stewardship." },
      { property: "og:title", content: "Pricing — Nuru Steward" },
      { property: "og:description", content: "Free, Steward Pro and Family Suite — pick what fits your household." },
    ],
  }),
  component: Pricing,
});

type Tier = {
  name: string;
  tagline: string;
  price: string;
  per: string;
  cta: { label: string; to?: string; href?: string };
  highlight?: boolean;
  features: string[];
};

const TIERS: Tier[] = [
  {
    name: "Free",
    tagline: "Start your stewardship journey.",
    price: "KSh 0",
    per: "/ forever",
    cta: { label: "Create account", to: "/signup" },
    features: [
      "Unlimited budgets & expenses",
      "Up to 3 connected accounts",
      "Automated 10% tithe set-aside",
      "Monthly close & reconciliation",
      "Daily devotional layer",
      "Multi-currency display",
    ],
  },
  {
    name: "Steward Pro",
    tagline: "For the disciplined individual.",
    price: "KSh 2,000",
    per: "/ month",
    cta: { label: "Start Pro", to: "/signup" },
    highlight: true,
    features: [
      "Everything in Free",
      "Unlimited accounts & investments",
      "AI financial advisor (monthly analysis)",
      "Always-on AI assistant chatbot",
      "Debt planner with payoff projection",
      "Subscription watchdog",
      "Financial calendar & reminders",
      "Historical insights & exports",
    ],
  },
  {
    name: "Family Suite",
    tagline: "For households planning together.",
    price: "KSh 4,000",
    per: "/ month",
    cta: { label: "Start Family", to: "/signup" },
    features: [
      "Everything in Steward Pro",
      "Up to 5 household members",
      "Shared budgets & goals",
      "Family obligations tracker",
      "Children allowances & school fees",
      "Joint net-worth reporting",
      "Priority email support",
      "Stewardship coaching session (quarterly)",
    ],
  },
];

function Pricing() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <p className="text-sm font-medium text-primary">Pricing</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Simple, household-friendly pricing.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">Start free. Upgrade when you want AI advisory or want to plan with your family.</p>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`relative flex flex-col rounded-3xl border bg-card p-8 shadow-card transition hover:shadow-elevated ${t.highlight ? "border-primary/40 ring-2 ring-primary/20" : ""}`}
            >
              {t.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground shadow-card">
                  Most popular
                </div>
              )}
              <div className="text-sm font-medium text-muted-foreground">{t.name}</div>
              <div className="mt-1 text-sm text-muted-foreground">{t.tagline}</div>
              <div className="mt-4 flex items-baseline gap-2">
                <div className="text-4xl font-semibold tracking-tight">{t.price}</div>
                <div className="text-sm text-muted-foreground">{t.per}</div>
              </div>
              <Button size="lg" className="mt-6 w-full" variant={t.highlight ? "default" : "outline"} asChild>
                {t.cta.to ? <Link to={t.cta.to}>{t.cta.label}</Link> : <a href={t.cta.href}>{t.cta.label}</a>}
              </Button>
              <ul className="mt-8 space-y-3 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{f}</span></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-3xl rounded-2xl border bg-gradient-hero p-6 text-center text-primary-foreground shadow-card">
          <div className="text-lg font-semibold">Not sure which tier fits?</div>
          <p className="mt-1 text-sm opacity-90">Book a free 20-minute demo and we'll walk through your household together.</p>
          <Button size="lg" variant="secondary" asChild className="mt-4">
            <a href={DEMO_MAILTO}><Calendar className="mr-1 h-4 w-4" /> Book a free demo</a>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
