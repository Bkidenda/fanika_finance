import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { Wallet, Landmark, Receipt, TrendingUp, Target, CreditCard, Repeat, BookOpen, Bot, Sparkles, History, Calendar, Coins, HandHeart, Scale } from "lucide-react";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Nuru Steward" },
      { name: "description", content: "Net-income budgeting, multi-account net worth, debt planner, AI advisor, financial calendar, monthly close, devotionals — every module in Nuru Steward." },
      { property: "og:title", content: "Features — Nuru Steward" },
      { property: "og:description", content: "Every module in Nuru Steward, from net-income budgeting to monthly reconciliation." },
    ],
  }),
  component: Features,
});

const MODULES = [
  { i: Coins, t: "Net-income first", d: "Start from your take-home pay in any currency. No country-specific payroll math — Nuru works wherever you live." },
  { i: HandHeart, t: "Automated tithes & giving", d: "10% of every income entry is set aside automatically. Track giving alongside everything else." },
  { i: Wallet, t: "Budgets by category", d: "Group budgets across Essentials, Family, Lifestyle and Financial — with overspend alerts and progress bars. Budget the current month or plan ahead." },
  { i: Receipt, t: "Expenses inside budgets", d: "Every expense lands inside an active budget category. Out-of-plan spending is flagged as an emergency." },
  { i: Landmark, t: "Unified accounts", d: "Bank, M-Pesa, SACCO, cash, investment. Balances auto-update with every recorded expense, payment or income receipt." },
  { i: Scale, t: "Net worth tracking", d: "Assets minus liabilities, refreshed live. Cash + investments − debts, with full audit history." },
  { i: CreditCard, t: "Debt planner", d: "Formal loans (rate, monthly, due date) and informal lending from family & friends — track both, schedule payments." },
  { i: Repeat, t: "Subscriptions watchdog", d: "Catch silent recurring drains. Monthly cost, annual projection, pause/resume any time." },
  { i: Target, t: "Savings goals", d: "Visual progress bars for every goal, with target date and current balance." },
  { i: Calendar, t: "Financial calendar", d: "Mark dates with financial implications — bill due dates, expected income, debt deadlines, family obligations, planned giving." },
  { i: History, t: "Monthly close & next-month auto-open", d: "Close each month with a reconciliation snapshot. The next month opens automatically and last month's budgets are copied forward as a starting point." },
  { i: Bot, t: "AI financial advisor", d: "A grounded advisor that reads your snapshot and returns a 0-100 health score plus practical recommendations." },
  { i: Sparkles, t: "Smart insights", d: "Overspend, low-savings, high-debt, family-support ratio — surfaced when they matter." },
  { i: BookOpen, t: "Devotional layer", d: "Scripture and verified Ellen G. White reflections tied to your stewardship rhythm." },
];

function Features() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-primary">Features</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Every module you need to run a household.</h1>
          <p className="mt-4 text-lg text-muted-foreground">Nuru Steward is a personal finance OS, not a tracker. Each module connects to the next so your numbers always reconcile.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <div key={m.t} className="rounded-2xl border bg-card p-6 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><m.i className="h-5 w-5" /></div>
              <h3 className="mt-4 font-semibold">{m.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{m.d}</p>
            </div>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
