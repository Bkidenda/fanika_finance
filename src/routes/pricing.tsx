import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Nuru Steward" },
      { name: "description", content: "Nuru Steward is free for individuals. Every module included." },
      { property: "og:title", content: "Pricing — Nuru Steward" },
      { property: "og:description", content: "Free for individuals — every module included." },
    ],
  }),
  component: Pricing,
});

const INCLUDED = [
  "Unlimited budgets, expenses & accounts", "Kenya statutory engine (NSSF · SHIF · AHL · PAYE)",
  "Salary breakdown & net worth", "Debt & subscriptions planning", "Monthly close & history",
  "AI financial advisor", "Daily devotionals", "Multi-currency display",
];

function Pricing() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <p className="text-sm font-medium text-primary">Pricing</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Free. Every module. Forever.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">Personal stewardship shouldn't have a paywall.</p>
        </div>
        <div className="mx-auto mt-12 max-w-md rounded-3xl border bg-card p-8 shadow-elevated">
          <div className="text-sm font-medium text-muted-foreground">Personal</div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="text-5xl font-semibold tracking-tight">Free</div>
            <div className="text-muted-foreground">/ forever</div>
          </div>
          <Button size="lg" className="mt-6 w-full" asChild>
            <Link to="/signup">Create your account</Link>
          </Button>
          <ul className="mt-8 space-y-3 text-sm">
            {INCLUDED.map((f) => (
              <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-primary" /><span>{f}</span></li>
            ))}
          </ul>
        </div>
      </section>
    </PublicLayout>
  );
}
