import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Globe, UserCircle, Lock, CalendarDays } from "lucide-react";
import { PublicLayout, BtnPrimary, BtnSecondary, SectionHeading, DEMO_URL } from "@/components/public-layout";
import { useAuth } from "@/hooks/use-auth";
import { IMG } from "@/lib/site-images";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fanika — Personal finance, all in one clear view" },
      { name: "description", content: "Plan budgets before the month starts, track income and spending, manage debt and watch your net worth grow — from one personal finance platform." },
      { property: "og:title", content: "Fanika — Personal finance, all in one clear view" },
      { property: "og:description", content: "Every account, budget, debt and goal in one reconciled financial picture." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://fanikasteward.lovable.app/" },
      { property: "og:image", content: IMG.heroLedger },
      { name: "twitter:image", content: IMG.heroLedger },
    ],
    links: [{ rel: "canonical", href: "https://fanikasteward.lovable.app/" }],
  }),
  component: Home,
});

const CARDS = [
  { img: IMG.planning, t: "Plan the month ahead", d: "Build next month's budget before it starts. Recurring lines like rent carry forward automatically." },
  { img: IMG.receipts, t: "Track every shilling", d: "Log income and expenses in one ledger. Balances, budgets and net worth update as you go." },
  { img: IMG.growth, t: "Grow what's left", d: "Savings goals, investments and debt payoff tracked together in a single net-worth view." },
];

const SPLIT = [
  ["A live financial picture", "Bank, mobile money, SACCO and cash in one balance sheet that reconciles itself after every entry."],
  ["Debt that actually goes down", "Record a repayment once — the loan, the account and the expense ledger all update together."],
  ["Reports you can hand over", "Monthly, quarterly and annual statements exported as PDF, Excel or CSV, or emailed to you."],
];

const SECONDARY = [
  { img: IMG.family, t: "Built for households", d: "Share budgets, assign allowances and plan family obligations together on the Family Suite." },
  { img: IMG.laptop, t: "Guidance, not guesswork", d: "The AI advisor reads your current month and recent history, then returns a health score and clear next steps." },
];

const QUOTES = [
  { q: "I finally know what's actually left after commitments.", n: "Achieng' O.", d: "Nairobi" },
  { q: "Closing the month takes five minutes instead of a weekend.", n: "Peter M.", d: "Small business owner" },
  { q: "The debt tracker paid for itself in the first month.", n: "Wanjiru K.", d: "Teacher" },
];

const PROOF = [
  { i: Globe, t: "Multi-currency", d: "Track and convert across currencies with daily rates." },
  { i: UserCircle, t: "Yours to control", d: "Export, deactivate or permanently delete your data any time." },
  { i: Lock, t: "Private by design", d: "Row-level security so only you can read your records." },
  { i: CalendarDays, t: "Financial calendar", d: "Mark bill dates, expected income and deadlines that matter." },
];

function Home() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
    if (!isMobile) return;
    navigate({ to: user ? "/dashboard" : "/login", replace: true });
  }, [user, loading, navigate]);

  return (
    <PublicLayout>
      {/* HERO */}
      <section className="mx-auto max-w-6xl px-6 pt-14 md:pt-20">
        <h1 className="text-5xl font-bold tracking-tight md:text-6xl">Fanika</h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
          Know where your money is and decide where it goes next. Budgets, accounts, debt and goals
          in one clear financial picture.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link to="/signup"><BtnPrimary>Start free</BtnPrimary></Link>
          <a href={DEMO_URL}><BtnSecondary>Book a demo</BtnSecondary></a>
        </div>

        <img
          src={IMG.heroLedger}
          alt="Reviewing a monthly household budget on paper beside a laptop"
          className="mt-12 aspect-[16/7] w-full rounded-xl object-cover"
          fetchPriority="high"
        />
      </section>

      {/* THREE CARDS */}
      <section className="mx-auto max-w-6xl px-6 pt-20 md:pt-24">
        <SectionHeading>How Fanika works</SectionHeading>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {CARDS.map((c) => (
            <article key={c.t}>
              <img src={c.img} alt={c.t} className="aspect-[4/3] w-full rounded-xl object-cover" loading="lazy" />
              <h3 className="mt-4 font-semibold">{c.t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
            </article>
          ))}
        </div>
      </section>

      {/* SPLIT SECTION */}
      <section className="mx-auto max-w-6xl px-6 pt-20 md:pt-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <SectionHeading>Everything reconciles</SectionHeading>
            <div className="mt-8 space-y-7">
              {SPLIT.map(([t, d]) => (
                <div key={t}>
                  <h3 className="font-semibold">{t}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{d}</p>
                </div>
              ))}
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/features"><BtnPrimary>See features</BtnPrimary></Link>
              <Link to="/pricing"><BtnSecondary>View pricing</BtnSecondary></Link>
            </div>
          </div>
          <img src={IMG.dashboard} alt="Financial dashboard with charts on a laptop screen" className="aspect-[4/3] w-full rounded-xl object-cover" loading="lazy" />
        </div>
      </section>

      {/* TWO CARDS */}
      <section className="mx-auto max-w-6xl px-6 pt-20 md:pt-24">
        <SectionHeading>Made for real life</SectionHeading>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {SECONDARY.map((c) => (
            <article key={c.t}>
              <img src={c.img} alt={c.t} className="aspect-[16/10] w-full rounded-xl object-cover" loading="lazy" />
              <h3 className="mt-4 font-semibold">{c.t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
            </article>
          ))}
        </div>
      </section>

      {/* PROOF POINTS */}
      <section className="mx-auto max-w-6xl px-6 pt-20 md:pt-24">
        <SectionHeading>Why people stay</SectionHeading>
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          {PROOF.map((p) => (
            <div key={p.t}>
              <p.i className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <h3 className="mt-3 font-semibold">{p.t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-6xl px-6 pt-20 md:pt-24">
        <SectionHeading>What people say</SectionHeading>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {QUOTES.map((q) => (
            <figure key={q.n} className="rounded-xl border border-border p-6">
              <blockquote className="text-sm font-medium">“{q.q}”</blockquote>
              <figcaption className="mt-6">
                <div className="text-sm font-semibold">{q.n}</div>
                <div className="text-xs text-muted-foreground">{q.d}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA BAND */}
      <section className="mt-20 bg-muted md:mt-24">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-14 md:flex-row md:items-center md:justify-between">
          <SectionHeading>Ready for a clearer financial picture?</SectionHeading>
          <div className="flex flex-wrap gap-3">
            <Link to="/signup"><BtnPrimary>Get started</BtnPrimary></Link>
            <a href={DEMO_URL}>
              <span className="inline-flex items-center justify-center rounded-lg bg-background px-5 py-3 text-sm font-semibold text-foreground transition hover:opacity-90">Book a demo</span>
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
