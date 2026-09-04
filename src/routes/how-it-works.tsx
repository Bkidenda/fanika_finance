import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout, BtnPrimary, BtnSecondary, SectionHeading, Eyebrow, DEMO_URL } from "@/components/public-layout";
import { PhoneFrame, ScreenBudgets, ScreenInsights, DesktopFrame } from "@/components/marketing/device";
import { IMG } from "@/lib/site-images";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — the Fanika monthly rhythm" },
      {
        name: "description",
        content:
          "Set up your accounts, plan each month before it starts, log income and spending as it happens, then close the month with a reconciled snapshot.",
      },
      { property: "og:title", content: "How it works — the Fanika monthly rhythm" },
      { property: "og:description", content: "Set up, plan, log, close, repeat — how Fanika keeps your finances reconciled." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: IMG.planning },
      { name: "twitter:image", content: IMG.planning },
    ],
  }),
  component: HowItWorks,
});

const STEPS = [
  {
    n: "01",
    t: "Set up once",
    d: "Add your currency and your accounts — bank, mobile money, SACCO, cash and investments. Enter standing debts and subscriptions. These live outside the monthly cycle, so you never re-enter them.",
  },
  {
    n: "02",
    t: "Plan before the month starts",
    d: "Budget across essentials, family, lifestyle and financial goals. Recurring lines are pre-filled from your standing setup; everything else opens at zero so each decision is deliberate.",
  },
  {
    n: "03",
    t: "Record as it happens",
    d: "Income credits the account it lands in. An expense sits inside a budget category and debits the paying account, transaction fees included. A debt repayment reduces the loan, debits the account and logs the expense in one step.",
  },
  {
    n: "04",
    t: "Close and reconcile",
    d: "Closing a month stores a snapshot you can print, then opens the next month with only your recurring lines. Balances, debts, subscriptions and investments carry over — budgets and income don't.",
  },
  {
    n: "05",
    t: "Review and adjust",
    d: "The advisor compares this month against your recent history and returns a health score, what changed, and the two or three moves worth making next.",
  },
];

function HowItWorks() {
  return (
    <PublicLayout>
      <section className="bg-sage-field">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pt-14 pb-16 md:grid-cols-[1.05fr_0.95fr] md:px-6 md:pt-20 md:pb-20">
          <div className="rise">
            <Eyebrow>The monthly rhythm</Eyebrow>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-[3.2rem] md:leading-[1.05]">
              Plan it, live it, close it
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              One rhythm repeated every month: plan before it starts, record as it happens, close it when
              it ends. Nothing carries forward that shouldn&apos;t.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/signup"><BtnPrimary>Start free</BtnPrimary></Link>
              <a href={DEMO_URL}><BtnSecondary>Book a demo</BtnSecondary></a>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <PhoneFrame label="Fanika budgets screen"><ScreenBudgets /></PhoneFrame>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 pt-16 md:px-6 md:pt-24">
        <div className="space-y-4">
          {STEPS.map((s) => (
            <div key={s.n} className="card-hover flex gap-5 rounded-3xl border border-border bg-card p-5 shadow-card md:p-7">
              <span className="num flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                {s.n}
              </span>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">{s.t}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-20 bg-surface-soft py-16 md:mt-28 md:py-24">
        <div className="mx-auto max-w-6xl px-5 md:px-6">
          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
            <div>
              <Eyebrow>Insight, not admin</Eyebrow>
              <SectionHeading className="mt-4">The month reads itself back to you</SectionHeading>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                Every entry updates your health score, savings rate and category trends immediately — so
                the review at month end confirms what you already knew, instead of surprising you.
              </p>
            </div>
            <div className="flex justify-center md:justify-end">
              <PhoneFrame label="Fanika insights screen"><ScreenInsights /></PhoneFrame>
            </div>
          </div>
          <DesktopFrame className="mt-14" />
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-5 md:mt-28 md:px-6">
        <div className="bg-gradient-hero flex flex-col gap-6 rounded-3xl px-6 py-12 text-center md:px-12 md:py-16">
          <h2 className="text-3xl font-semibold tracking-tight text-primary-foreground md:text-4xl">
            Start with next month
          </h2>
          <p className="mx-auto max-w-lg text-sm text-primary-foreground/80 md:text-base">
            Set up your accounts today and open your first fully planned month in minutes.
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
