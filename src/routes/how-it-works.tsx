import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — Nuru Steward" },
      { name: "description", content: "Five steps to a fully reconciled financial life with Nuru Steward — set up, plan each month, log day-to-day, close and reconcile, repeat." },
      { property: "og:title", content: "How it works — Nuru Steward" },
      { property: "og:description", content: "Set up, plan monthly, log daily, close and reconcile — the Nuru Steward rhythm." },
    ],
  }),
  component: HowItWorks,
});

const STEPS = [
  {
    n: "01",
    t: "Set up your profile and accounts",
    d: "Add your name, preferred currency, and decide whether tithe / giving should be auto-calculated and at what rate. Connect your bank, M-Pesa, SACCO, cash and investment accounts. Add any standing debts and subscriptions — these are global, not month-by-month.",
  },
  {
    n: "02",
    t: "Plan each new month",
    d: "When a new month opens, enter your expected income and build that month's budgets across Essentials, Family, Lifestyle and Financial. Standing categories like rent are pre-filled from your recurring budget lines, so you only set them once.",
  },
  {
    n: "03",
    t: "Log income and expenses as they happen",
    d: "Every income entry credits the linked account and feeds the dashboard. Every expense lands inside an active budget — out-of-plan spending is flagged as an emergency. Account balances and net worth update live.",
  },
  {
    n: "04",
    t: "Close the month — next month auto-opens",
    d: "At month end, hit Close month. Nuru generates a reconciliation snapshot (income, expenses, savings rate, debt paid, tithe, net worth) and immediately opens the next month with your recurring lines pre-seeded so you can budget before the 1st. If you try to plan the next month while the current one is still open, you'll be prompted to close it first.",
  },
  {
    n: "05",
    t: "Review, learn, repeat",
    d: "Run the AI advisor for a trend-aware review (current month + last three closes). Download a printable monthly or quarterly statement. Reopen any past month from History to make corrections without touching the current month.",
  },
];

function HowItWorks() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-primary">How it works</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">A simple monthly rhythm.</h1>
          <p className="mt-4 text-lg text-muted-foreground">Plan it. Live it. Close it. Reconcile it. Print it.</p>
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
