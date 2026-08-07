import { createFileRoute, Link } from "@tanstack/react-router";
import { Wallet, Landmark, CreditCard, Repeat, Target, FileText, Bot, CalendarDays } from "lucide-react";
import { PublicLayout, BtnPrimary, BtnSecondary, SectionHeading, DEMO_URL } from "@/components/public-layout";
import { IMG } from "@/lib/site-images";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Fanika personal finance platform" },
      { name: "description", content: "Monthly budgeting, unified accounts, debt planner, subscriptions, savings goals, AI advisory and printable statements — every Fanika module explained." },
      { property: "og:title", content: "Features — Fanika personal finance platform" },
      { property: "og:description", content: "Budgets, accounts, debt, goals, reports and AI advisory in one connected system." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: IMG.charts },
      { name: "twitter:image", content: IMG.charts },
    ],
  }),
  component: Features,
});

const MODULES = [
  { img: IMG.planning, t: "Budgets", d: "Plan by category each month. Recurring lines carry forward, one-off amounts reset.", featured: true },
  { img: IMG.receipts, t: "Money tracker", d: "Income and expenses in one timestamped ledger, grouped by week." },
  { img: IMG.dashboard, t: "Accounts & net worth", d: "Bank, mobile money, SACCO and cash in one live balance sheet." },
];

const MODULES_2 = [
  { img: IMG.savings, t: "Savings & goals", d: "Progress bars, target dates and contributions tracked per goal." },
  { img: IMG.reports, t: "Reports & statements", d: "Income statement, balance sheet and cash flow — PDF, Excel or CSV." },
  { img: IMG.family, t: "Family Suite", d: "Shared budgets, member allowances, chores and joint net worth." },
];

const CAPABILITIES = [
  { i: Wallet, t: "Monthly planning", d: "Enter income as it arrives and budget before the month begins." },
  { i: Landmark, t: "Unified accounts", d: "Balances update automatically with every entry, transfer or fee." },
  { i: CreditCard, t: "Debt planner", d: "Formal loans and informal borrowing, with repayments that post everywhere at once." },
  { i: Repeat, t: "Subscriptions", d: "Auto-renewal on the due date, with the expense and account debit logged." },
  { i: Target, t: "Savings goals", d: "Set targets, watch funding progress, adjust without breaking the plan." },
  { i: CalendarDays, t: "Financial calendar", d: "Mark any date with a financial implication and get ahead of it." },
  { i: Bot, t: "AI advisor", d: "A health score, trend commentary and next actions from your own history." },
  { i: FileText, t: "Statements", d: "Monthly, quarterly and annual documents branded and ready to print." },
];

function Features() {
  return (
    <PublicLayout>
      {/* IMAGE HERO BAND */}
      <section className="relative isolate">
        <img src={IMG.planning} alt="Reviewing a monthly financial plan" className="h-[320px] w-full object-cover md:h-[380px]" />
        <div className="absolute inset-0 bg-black/65" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">Features</h1>
          <p className="mt-3 max-w-xl text-sm text-white/85 md:text-base">
            Every module connects to the next, so your numbers always reconcile.
          </p>
          <Link to="/signup" className="mt-6">
            <span className="inline-flex items-center justify-center rounded-lg bg-background px-5 py-3 text-sm font-semibold text-foreground transition hover:opacity-90">Start free</span>
          </Link>
        </div>
      </section>

      {/* ALTERNATING SPLITS */}
      <section className="mx-auto max-w-6xl px-6 pt-16 md:pt-20">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <SectionHeading>One ledger, always current</SectionHeading>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              Log an expense, a transfer or a debt repayment once. The budget, the account balance and
              your net worth all move together — no reconciliation weekend required.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/how-it-works"><BtnPrimary>How it works</BtnPrimary></Link>
              <a href={DEMO_URL}><BtnSecondary>Book a demo</BtnSecondary></a>
            </div>
          </div>
          <img src={IMG.desk} alt="Planning a budget with notes and a calculator" className="aspect-[4/3] w-full rounded-xl object-cover" loading="lazy" />
        </div>

        <div className="mt-16 grid items-center gap-10 md:mt-20 md:grid-cols-2">
          <img src={IMG.meeting} alt="Reviewing financial reports together" className="aspect-[4/3] w-full rounded-xl object-cover md:order-1" loading="lazy" />
          <div className="md:order-2">
            <SectionHeading>Advice grounded in your numbers</SectionHeading>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              The advisor reads your current month plus recent closed months and returns a health score,
              what changed, and the two or three moves worth making next.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/pricing"><BtnPrimary>See plans</BtnPrimary></Link>
            </div>
          </div>
        </div>
      </section>

      {/* MODULE GRID */}
      <section className="mx-auto max-w-6xl px-6 pt-20 md:pt-24">
        <SectionHeading>The modules</SectionHeading>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {[...MODULES, ...MODULES_2].map((m) => (
            <article key={m.t}>
              <img src={m.img} alt={m.t} className="aspect-[4/3] w-full rounded-xl object-cover" loading="lazy" />
              <h3 className="mt-4 font-semibold">{m.t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{m.d}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CAPABILITY LIST */}
      <section className="mx-auto max-w-6xl px-6 pt-20 md:pt-24">
        <SectionHeading>Capabilities at a glance</SectionHeading>
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          {CAPABILITIES.map((c) => (
            <div key={c.t}>
              <c.i className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <h3 className="mt-3 font-semibold">{c.t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-20 bg-muted md:mt-24">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-14 md:flex-row md:items-center md:justify-between">
          <SectionHeading>Bring it all into one place.</SectionHeading>
          <div className="flex flex-wrap gap-3">
            <Link to="/signup"><BtnPrimary>Create account</BtnPrimary></Link>
            <Link to="/pricing">
              <span className="inline-flex items-center justify-center rounded-lg bg-background px-5 py-3 text-sm font-semibold transition hover:opacity-90">View pricing</span>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
