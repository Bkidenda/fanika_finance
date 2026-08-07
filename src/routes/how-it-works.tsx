import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout, BtnPrimary, BtnSecondary, SectionHeading, DEMO_URL } from "@/components/public-layout";
import { IMG } from "@/lib/site-images";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — the Fanika monthly rhythm" },
      { name: "description", content: "Set up your accounts, plan each month before it starts, log income and spending as it happens, then close the month with a reconciled snapshot." },
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

function HowItWorks() {
  return (
    <PublicLayout>
      <article className="mx-auto max-w-6xl px-6 pt-14 md:pt-20">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">How Fanika works</h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
          One rhythm, repeated every month: plan before it starts, record as it happens, close it when
          it ends. Nothing carries forward that shouldn't.
        </p>

        <img
          src={IMG.planning}
          alt="Writing out a monthly budget plan"
          className="mt-10 aspect-[16/7] w-full rounded-xl object-cover"
          fetchPriority="high"
        />

        <div className="mx-auto mt-14 max-w-2xl space-y-10">
          <section>
            <h2 className="text-xl font-bold tracking-tight">01 — Set up once</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
              Add your name and preferred currency, then your accounts: bank, mobile money, SACCO, cash
              and investments. Enter standing debts and subscriptions. These live outside the monthly
              cycle, so you never re-enter them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold tracking-tight">02 — Plan the month before it starts</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
              When a month opens, budget across essentials, family, lifestyle and financial goals.
              Recurring lines like rent and school fees are pre-filled from your standing setup;
              everything else starts at zero so each decision is deliberate.
            </p>
          </section>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <img src={IMG.receipts} alt="Sorting receipts and logging expenses" className="aspect-[4/3] w-full rounded-xl object-cover" loading="lazy" />
          <img src={IMG.dashboard} alt="Reviewing balances on a dashboard" className="aspect-[4/3] w-full rounded-xl object-cover" loading="lazy" />
        </div>

        <div className="mx-auto mt-14 max-w-2xl space-y-10">
          <section>
            <h2 className="text-xl font-bold tracking-tight">03 — Record as it happens</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
              Income credits the account it lands in. Expenses sit inside a budget category and debit
              the paying account, transaction fees included. A debt repayment reduces the loan, debits
              the account and logs the expense in one step.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold tracking-tight">04 — Close and reconcile</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
              Closing a month stores a snapshot you can print, then opens the next month with only your
              recurring lines. Balances, debts, subscriptions and investments carry over — budgets and
              income don't.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold tracking-tight">05 — Review and adjust</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
              The advisor compares this month against your recent history and gives you a health score,
              what moved, and what to do next. Reports export as PDF, Excel or CSV whenever you need
              them.
            </p>
          </section>
        </div>

        <div className="mx-auto mt-12 flex max-w-2xl flex-wrap gap-3">
          <Link to="/signup"><BtnPrimary>Start free</BtnPrimary></Link>
          <a href={DEMO_URL}><BtnSecondary>Book a demo</BtnSecondary></a>
        </div>
      </article>

      <section className="mx-auto max-w-6xl px-6 pt-20 md:pt-24">
        <SectionHeading>Keep reading</SectionHeading>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {[
            { img: IMG.charts, t: "Features", d: "Every module, explained", to: "/features" as const },
            { img: IMG.savings, t: "Pricing", d: "Free, Pro and Family Suite", to: "/pricing" as const },
            { img: IMG.team, t: "About", d: "Why we built Fanika", to: "/about" as const },
          ].map((c) => (
            <Link key={c.t} to={c.to} className="group">
              <img src={c.img} alt={c.t} className="aspect-[4/3] w-full rounded-xl object-cover" loading="lazy" />
              <h3 className="mt-4 font-semibold group-hover:underline">{c.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
            </Link>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
