import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { Wallet, Landmark, Receipt, TrendingUp, Target, CreditCard, Repeat, BookOpen, Bot, Sparkles, History, Calendar, Coins, HandHeart, Scale, FileText, Eraser } from "lucide-react";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Fanika" },
      { name: "description", content: "Net-income budgeting, optional automated tithe, recurring budget lines, multi-account net worth, debt planner, AI advisor with monthly history, financial calendar, monthly close, printable statements, devotionals." },
      { property: "og:title", content: "Features — Fanika" },
      { property: "og:description", content: "Every module in Fanika, from net-income budgeting to printable statements." },
    ],
  }),
  component: Features,
});

const MODULES = [
  { i: Coins, t: "Net-income first", d: "Start from your take-home pay in any currency. No country-specific payroll math — Fanika works wherever you live." },
  { i: HandHeart, t: "Optional automatic tithe", d: "Turn tithe on if you want — pick the rate. Tithe is set aside before disposable income is calculated. Off by default; entirely your call." },
  { i: Wallet, t: "Budgets entered each month", d: "Income and budgets are entered fresh each month because life isn't standard. Standing categories (rent, insurance) are added once as recurring lines." },
  { i: Repeat, t: "Recurring budget lines", d: "Rent, insurance, school fees — set them once and they auto-seed every new month when you close the previous one." },
  { i: Receipt, t: "Expenses inside budgets", d: "Every expense lands inside an active budget category. Out-of-plan spending is flagged as an emergency, not silently absorbed." },
  { i: Landmark, t: "Unified accounts", d: "Bank, M-Pesa, SACCO, cash, investment. Balances auto-update with every recorded expense, payment or income receipt." },
  { i: Scale, t: "Net worth tracking", d: "Assets minus liabilities, refreshed live. Cash + investments − debts, with full audit history." },
  { i: CreditCard, t: "Debt planner", d: "Formal loans (rate, monthly, due date) and informal lending from family & friends — track both, schedule payments." },
  { i: Repeat, t: "Subscriptions watchdog", d: "Catch silent recurring drains. Monthly cost, annual projection, pause/resume any time." },
  { i: Target, t: "Savings goals", d: "Visual progress bars for every goal, with target date and current balance." },
  { i: Calendar, t: "Financial calendar", d: "Mark dates with financial implications — bill due dates, expected income, debt deadlines, family obligations, planned giving." },
  { i: History, t: "Monthly close & next-month auto-open", d: "Close each month with a reconciliation snapshot. Next month auto-opens with only your recurring lines pre-filled, so fresh income and budgets stay deliberate." },
  { i: Bot, t: "AI advisor with history", d: "A grounded advisor that reads your current month plus the last three closed months and returns a 0-100 health score, trend commentary, and practical recommendations." },
  { i: Sparkles, t: "Always-on AI assistant", d: "Floating chatbot that answers stewardship and finance questions anywhere in the app." },
  { i: FileText, t: "Printable PDF statements", d: "Generate a monthly or quarterly account statement for your records — income, spend, top categories, accounts, debts, net worth, all on one page." },
  { i: BookOpen, t: "Devotional layer", d: "Scripture and verified Ellen G. White reflections tied to your stewardship rhythm." },
  { i: Eraser, t: "Account control", d: "Clear your data, deactivate your account, or delete it permanently — your data, your call, no hoops." },
];

function Features() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-primary">Features</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Every module you need to run a household.</h1>
          <p className="mt-4 text-lg text-muted-foreground">Fanika is a personal finance OS, not a tracker. Each module connects to the next so your numbers always reconcile — fresh income each month, standing lines carried forward, accounts live, statements printable.</p>
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
