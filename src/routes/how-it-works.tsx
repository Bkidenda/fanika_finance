import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — Nuru Steward" },
      { name: "description", content: "Four steps to a fully reconciled financial life with Nuru Steward." },
      { property: "og:title", content: "How it works — Nuru Steward" },
      { property: "og:description", content: "Setup, daily rhythm, monthly close, plan ahead — exactly how Nuru Steward works." },
    ],
  }),
  component: HowItWorks,
});

const STEPS = [
  { n: "01", t: "Set up your profile", d: "Add your name, preferred currency and connect your accounts — bank, M-Pesa, SACCO, cash, investments. Record any standing income streams and loan obligations on their own pages." },
  { n: "02", t: "Plan & log monthly", d: "Build budgets across Essentials, Family, Lifestyle and Financial. Record each income entry as it lands and every expense against an active category. Account balances update automatically — emergencies get flagged." },
  { n: "03", t: "Mark the calendar", d: "Pin bill due dates, expected payslips, debt deadlines, family obligations and planned giving on the financial calendar so nothing catches you off guard." },
  { n: "04", t: "Close the month — next month auto-opens", d: "At month end, hit Close month. Nuru generates a reconciliation snapshot (income, expenses, savings rate, debt paid, tithe, net worth) and immediately opens the next month, copying your budgets forward so you can plan before the 1st." },
];

function HowItWorks() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-primary">How it works</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Four steps. Every month. Forever.</h1>
          <p className="mt-4 text-lg text-muted-foreground">A simple rhythm that keeps every shilling visible and every account reconciled — before the next month starts.</p>
        </div>
        <div className="mt-12 space-y-6">
          {STEPS.map((s) => (
            <div key={s.n} className="grid items-start gap-6 rounded-2xl border bg-card p-8 shadow-card md:grid-cols-[120px_1fr]">
              <div className="text-5xl font-semibold text-gradient-primary tabular-nums">{s.n}</div>
              <div>
                <h3 className="text-xl font-semibold">{s.t}</h3>
                <p className="mt-2 text-muted-foreground">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 flex justify-center">
          <Button size="lg" asChild>
            <Link to="/signup">Get started <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
