import { createFileRoute, Link } from "@tanstack/react-router";
import { Wallet, Landmark, CreditCard, Repeat, Target, FileText, Bot, CalendarDays } from "lucide-react";
import { PublicLayout, BtnPrimary, BtnSecondary, SectionHeading, Eyebrow, DEMO_URL } from "@/components/public-layout";
import {
  PhoneFrame,
  ScreenOverview,
  ScreenTransactions,
  ScreenBudgets,
  ScreenGoals,
  DesktopFrame,
} from "@/components/marketing/device";
import { IMG } from "@/lib/site-images";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Fanika personal finance platform" },
      {
        name: "description",
        content:
          "Monthly budgeting, unified accounts, debt planner, subscriptions, savings goals, AI advisory and printable statements — every Fanika module explained.",
      },
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

const SPLITS = [
  {
    eyebrow: "Money tracker",
    title: "One ledger, always current",
    body:
      "Log an expense, a transfer or a debt repayment once. The budget line, the account balance and your net worth all move together — no reconciliation weekend required.",
    screen: <ScreenTransactions />,
  },
  {
    eyebrow: "Budgets",
    title: "Plan the month before it starts",
    body:
      "Recurring lines like rent and school fees carry forward automatically. Everything else opens at zero, so each month is a deliberate decision rather than a copy of the last one.",
    screen: <ScreenBudgets />,
    flip: true,
  },
  {
    eyebrow: "Goals & savings",
    title: "Targets you actually reach",
    body:
      "Fund a goal straight from a paycheque, watch the progress ring move, and reschedule a target date without breaking the rest of the plan.",
    screen: <ScreenGoals />,
  },
] satisfies { eyebrow: string; title: string; body: string; screen: React.ReactNode; flip?: boolean }[];

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
      {/* HERO */}
      <section className="bg-sage-field">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pt-14 pb-16 md:grid-cols-[1.05fr_0.95fr] md:px-6 md:pt-20 md:pb-20">
          <div className="rise">
            <Eyebrow>Everything in one system</Eyebrow>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-[3.2rem] md:leading-[1.05]">
              Every module talks to the next one
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              Accounts, budgets, debts, subscriptions, goals and reports share one source of truth — so
              your numbers reconcile without you chasing them.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/signup"><BtnPrimary>Start free</BtnPrimary></Link>
              <a href={DEMO_URL}><BtnSecondary>Book a demo</BtnSecondary></a>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <PhoneFrame label="Fanika overview screen"><ScreenOverview /></PhoneFrame>
          </div>
        </div>
      </section>

      {/* ALTERNATING SPLITS */}
      <section className="mx-auto max-w-6xl space-y-20 px-5 pt-16 md:space-y-28 md:px-6 md:pt-24">
        {SPLITS.map((s) => (
          <div key={s.title} className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
            <div className={s.flip ? "md:order-2" : ""}>
              <Eyebrow>{s.eyebrow}</Eyebrow>
              <SectionHeading className="mt-4">{s.title}</SectionHeading>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">{s.body}</p>
            </div>
            <div className={`flex justify-center ${s.flip ? "md:order-1 md:justify-start" : "md:justify-end"}`}>
              <PhoneFrame label={`Fanika ${s.eyebrow.toLowerCase()} screen`}>{s.screen}</PhoneFrame>
            </div>
          </div>
        ))}
      </section>

      {/* DESKTOP SHOWCASE */}
      <section className="mt-20 bg-surface-soft py-16 md:mt-28 md:py-24">
        <div className="mx-auto max-w-6xl px-5 md:px-6">
          <div className="max-w-2xl">
            <Eyebrow>On the big screen</Eyebrow>
            <SectionHeading className="mt-4">Reports your accountant would sign off</SectionHeading>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              Income statement, balance sheet and cash flow — monthly, quarterly or annual, exported as
              branded PDF, multi-sheet Excel or CSV, or emailed to you on close.
            </p>
          </div>
          <DesktopFrame className="mt-10" />
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="mx-auto max-w-6xl px-5 pt-20 md:px-6 md:pt-24">
        <SectionHeading>Capabilities at a glance</SectionHeading>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((c) => (
            <div key={c.t} className="card-hover rounded-2xl border border-border bg-card p-5 shadow-card">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <c.i className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-sm font-semibold">{c.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-20 max-w-6xl px-5 md:mt-28 md:px-6">
        <div className="bg-gradient-hero flex flex-col gap-6 rounded-3xl px-6 py-12 text-center md:px-12 md:py-16">
          <h2 className="text-3xl font-semibold tracking-tight text-primary-foreground md:text-4xl">
            Bring it all into one place
          </h2>
          <p className="mx-auto max-w-xl text-sm text-primary-foreground/80 md:text-base">
            Free to start, no card required. Your first reconciled month takes about fifteen minutes to set up.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/signup"><BtnSecondary>Create account</BtnSecondary></Link>
            <Link to="/pricing"><BtnSecondary>See plans</BtnSecondary></Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
