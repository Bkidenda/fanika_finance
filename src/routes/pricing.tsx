import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { Check, Calendar } from "lucide-react";
import { PLANS } from "@/lib/plans";

const DEMO_MAILTO = "https://calendly.com/bkidenda/30min?back=1&month=2026-06";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Nuru Steward" },
      { name: "description", content: "Three simple tiers. Start free, upgrade for AI advisory and family-scale stewardship." },
    ],
  }),
  component: Pricing,
});

function Pricing() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <p className="text-sm font-medium text-primary">Pricing</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Simple, household-friendly pricing.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">Start free. Upgrade when you want AI advisory or want to plan with your family. Every tier is the same product — just more capacity and features unlocked.</p>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-3">
          {PLANS.map((t) => (
            <div
              key={t.id}
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
                <div className="text-4xl font-semibold tracking-tight">{t.priceLabel}</div>
                <div className="text-sm text-muted-foreground">{t.per}</div>
              </div>
              <Button size="lg" className="mt-6 w-full" variant={t.highlight ? "default" : "outline"} asChild>
                <Link to="/signup">{t.ctaLabel}</Link>
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
