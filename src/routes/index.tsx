import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  ArrowRight,
  Banknote,
  CalendarDays,
  Check,
  Globe,
  HandCoins,
  Landmark,
  Lock,
  PieChart,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { PublicLayout, BtnPrimary, BtnSecondary, SectionHeading, Eyebrow, DEMO_URL } from "@/components/public-layout";
import {
  PhoneFrame,
  ScreenOverview,
  ScreenTransactions,
  ScreenBudgets,
  ScreenGoals,
  ScreenInsights,
  FloatingCard,
  DesktopFrame,
} from "@/components/marketing/device";
import { useAuth } from "@/hooks/use-auth";
import { PLANS } from "@/lib/plans";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fanika — Personal finance that finally makes sense" },
      {
        name: "description",
        content:
          "Plan the month before it starts, track every shilling, clear debt and grow your net worth — one calm personal finance app for African households.",
      },
      { property: "og:title", content: "Fanika — Personal finance that finally makes sense" },
      {
        property: "og:description",
        content: "Budgets, accounts, debt, giving and goals in one reconciled financial picture.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://fanikasteward.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://fanikasteward.lovable.app/" }],
  }),
  component: Home,
});

const STATS = [
  ["3 min", "to close a month"],
  ["8", "money modules in one app"],
  ["100%", "your data, exportable"],
] as const;

const STORY = [
  {
    eyebrow: "Plan",
    title: "Budget the month before it begins",
    body:
      "Set each line while the month is still ahead of you. Rent, school fees and other recurring lines carry forward automatically; everything else starts clean at zero.",
    bullets: ["Budget months ahead", "Recurring lines carry over", "Giving set aside before disposable"],
    to: "/features" as const,
    visual: {
      heading: "August budget",
      rows: [
        { label: "Rent", value: "KES 35,000", pct: 100 },
        { label: "School fees", value: "KES 18,000", pct: 62 },
        { label: "Groceries", value: "KES 12,400", pct: 44 },
        { label: "Giving", value: "KES 6,800", pct: 24 },
      ],
      footNote: "Recurring lines carried over from July. Everything else starts at zero.",
    },
  },
  {
    eyebrow: "Track",
    title: "Every shilling in one ledger",
    body:
      "Income and expenses share a single tracker with timestamps, categories, transaction fees and multi-currency support. Balances and budgets update the moment you record.",
    bullets: ["Bank, mobile money, SACCO and cash", "Bulk entry with edit and undo", "Daily CBK conversion rates"],
    to: "/how-it-works" as const,
    visual: {
      heading: "This week",
      rows: [
        { label: "Salary received", value: "KES 96,000", pct: 100 },
        { label: "Mobile money out", value: "KES 21,350", pct: 42 },
        { label: "Card spending", value: "KES 9,120", pct: 26 },
        { label: "Cash", value: "KES 3,400", pct: 12 },
      ],
      footNote: "Every entry is timestamped and grouped by week.",
    },
  },
  {
    eyebrow: "Grow",
    title: "Goals that actually move",
    body:
      "Savings goals, investments and debt payoff sit in one net-worth view, so progress on one is never a surprise on another.",
    bullets: ["Goal progress at a glance", "Debt payments post themselves", "Settled debts archive automatically"],
    to: "/features" as const,
    visual: {
      heading: "Goals & debt",
      rows: [
        { label: "Emergency fund", value: "68%", pct: 68 },
        { label: "Land deposit", value: "41%", pct: 41 },
        { label: "Car loan cleared", value: "77%", pct: 77 },
        { label: "Unit trust", value: "23%", pct: 23 },
      ],
      footNote: "Debt payments post themselves and settled debts archive automatically.",
    },
  },
];

const FEATURES = [
  { i: PieChart, t: "Budgets that reset properly", d: "Month-by-month navigation. Editing August never rewrites July." },
  { i: Banknote, t: "Money tracker", d: "One ledger for income and expenses, grouped by week with timestamps." },
  { i: Landmark, t: "Accounts & debts", d: "Balances, overdrafts and loans reconcile after every entry." },
  { i: Target, t: "Goals & investments", d: "Track contributions and returns inside one net-worth picture." },
  { i: HandCoins, t: "Charity & giving", d: "Optional tithe and offerings computed before disposable income." },
  { i: CalendarDays, t: "Financial calendar", d: "Mark bill dates, expected income and deadlines that matter." },
  { i: Sparkles, t: "AI advisor", d: "Reads your current month plus history and returns a health score with next steps." },
  { i: Users, t: "Family suite", d: "Shared budgets, allowances, chores with rewards and joint reporting." },
];

const TRUST = [
  { i: Lock, t: "Private by design", d: "Row-level security means only you can read your records." },
  { i: Globe, t: "Multi-currency", d: "Track and convert across currencies with daily rates." },
  { i: Banknote, t: "Reports you can hand over", d: "Monthly, quarterly and annual statements as PDF, Excel or CSV." },
];

const QUOTES = [
  { q: "I finally know what's actually left after commitments.", n: "Achieng' O.", d: "Nairobi" },
  { q: "Closing the month takes five minutes instead of a weekend.", n: "Peter M.", d: "Small business owner" },
  { q: "The debt tracker paid for itself in the first month.", n: "Wanjiru K.", d: "Teacher" },
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
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-sage-field">
        <div className="absolute inset-0 bg-dot-grid opacity-40" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pt-14 pb-20 md:px-6 md:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28">
          <div>
            <Eyebrow><Sparkles className="h-3.5 w-3.5" /> Built for African households</Eyebrow>
            <h1 className="mt-5 text-[2.6rem] font-semibold leading-[1.05] tracking-tight md:text-6xl">
              Know where your money is.
              <span className="block text-primary">Decide where it goes next.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Fanika brings budgets, accounts, debt, giving and goals into one calm financial picture — planned before
              the month starts and reconciled after every entry.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/signup"><BtnPrimary className="pulse-primary">Start free <ArrowRight className="h-4 w-4" /></BtnPrimary></Link>
              <a href={DEMO_URL}><BtnSecondary>Book a demo</BtnSecondary></a>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-4">
              {STATS.map(([v, l]) => (
                <div key={l} className="rounded-2xl border border-border bg-card/70 p-4 backdrop-blur">
                  <dt className="money text-xl font-semibold text-primary md:text-2xl">{v}</dt>
                  <dd className="mt-1 text-xs leading-snug text-muted-foreground">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mx-auto flex justify-center lg:justify-end">
            <PhoneFrame label="Fanika overview screen"><ScreenOverview /></PhoneFrame>
            <FloatingCard
              title="Saved this month"
              value="KES 32,700"
              note="+9% vs July"
              className="absolute -left-2 bottom-8 hidden w-44 sm:block lg:-left-10"
            />
            <FloatingCard
              title="Health score"
              value="78 / 100"
              note="Improving"
              className="absolute -right-2 top-6 hidden w-40 md:block"
            />
          </div>
        </div>
      </section>

      {/* ── STORY SECTIONS ───────────────────────────────────── */}
      {STORY.map((s, i) => (
        <section key={s.title} className={`${i % 2 === 1 ? "bg-surface-soft" : ""} py-20 md:py-24`}>
          <div
            className={`mx-auto grid max-w-6xl items-center gap-12 px-5 md:px-6 lg:grid-cols-2 ${
              i % 2 === 1 ? "lg:[&>div:first-child]:order-2" : ""
            }`}
          >
            <div>
              <Eyebrow>{s.eyebrow}</Eyebrow>
              <SectionHeading className="mt-4">{s.title}</SectionHeading>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">{s.body}</p>
              <ul className="mt-7 space-y-3">
                {s.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="text-muted-foreground">{b}</span>
                  </li>
                ))}
              </ul>
              <Link to={s.to} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                Learn more <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex justify-center">
              <PhoneFrame label={`Fanika ${s.eyebrow.toLowerCase()} screen`}>{s.screen}</PhoneFrame>
            </div>
          </div>
        </section>
      ))}

      {/* ── DESKTOP SHOWCASE ─────────────────────────────────── */}
      <section className="relative overflow-hidden bg-sage-field py-20 md:py-24">
        <div className="relative mx-auto max-w-6xl px-5 text-center md:px-6">
          <Eyebrow>Executive view</Eyebrow>
          <SectionHeading className="mx-auto mt-4 max-w-2xl">Your whole financial life on one screen</SectionHeading>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            Balances, budget performance, debt, giving and net worth — reconciled and ready to export.
          </p>
          <DesktopFrame className="mx-auto mt-12 max-w-4xl" />
        </div>
      </section>

      {/* ── FEATURE GRID ─────────────────────────────────────── */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-5 md:px-6">
          <Eyebrow>Everything included</Eyebrow>
          <SectionHeading className="mt-4 max-w-2xl">Eight modules, one reconciled system</SectionHeading>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <article key={f.t} className="card-hover rounded-2xl border border-border bg-card p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <f.i className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-sm font-semibold">{f.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── INSIGHTS / AI ────────────────────────────────────── */}
      <section className="bg-surface-soft py-20 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 md:px-6 lg:grid-cols-2">
          <div className="flex justify-center lg:order-2">
            <PhoneFrame label="Fanika insights screen"><ScreenInsights /></PhoneFrame>
          </div>
          <div>
            <Eyebrow><Sparkles className="h-3.5 w-3.5" /> Guidance</Eyebrow>
            <SectionHeading className="mt-4">Advice, not just charts</SectionHeading>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
              The advisor reads your current month and recent history, scores your financial health and hands you the
              next two or three moves that matter — in plain language.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {TRUST.map((t) => (
                <div key={t.t} className="rounded-2xl border border-border bg-card p-4">
                  <t.i className="h-4 w-4 text-primary" aria-hidden="true" />
                  <h3 className="mt-3 text-sm font-semibold">{t.t}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING PREVIEW ──────────────────────────────────── */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-5 md:px-6">
          <div className="max-w-2xl">
            <Eyebrow>Pricing</Eyebrow>
            <SectionHeading className="mt-4">Start free. Upgrade when it pays for itself.</SectionHeading>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {PLANS.map((p) => (
              <article
                key={p.id}
                className={`flex flex-col rounded-3xl border p-6 ${
                  p.highlight ? "border-primary bg-card shadow-elevated" : "border-border bg-card"
                }`}
              >
                {p.highlight && (
                  <span className="mb-3 w-fit rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
                <p className="mt-5 flex items-baseline gap-1">
                  <span className="money text-3xl font-semibold">{p.priceLabel}</span>
                  <span className="text-xs text-muted-foreground">{p.per}</span>
                </p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {p.features.slice(0, 5).map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className="mt-7">
                  {p.highlight ? (
                    <BtnPrimary className="w-full">{p.ctaLabel}</BtnPrimary>
                  ) : (
                    <BtnSecondary className="w-full">{p.ctaLabel}</BtnSecondary>
                  )}
                </Link>
              </article>
            ))}
          </div>
          <Link to="/pricing" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            Compare all features <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="bg-surface-soft py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-5 md:px-6">
          <Eyebrow>Loved by planners</Eyebrow>
          <SectionHeading className="mt-4">What people say</SectionHeading>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {QUOTES.map((q) => (
              <figure key={q.n} className="rounded-3xl border border-border bg-card p-6">
                <blockquote className="text-sm leading-relaxed font-medium">“{q.q}”</blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                    {q.n.slice(0, 1)}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{q.n}</span>
                    <span className="block text-xs text-muted-foreground">{q.d}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section className="px-5 pb-4 md:px-6">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-hero px-6 py-14 text-center md:px-12 md:py-20">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-primary-foreground md:text-[2.6rem] md:leading-[1.1]">
            Ready for a clearer financial picture?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-primary-foreground/80 md:text-base">
            Create your account, plan next month and see exactly what's left after commitments.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/signup">
              <span className="inline-flex items-center justify-center gap-2 rounded-full bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:opacity-90">
                Get started free <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <a href={DEMO_URL}>
              <span className="inline-flex items-center justify-center rounded-full border border-primary-foreground/30 px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-foreground/10">
                Book a demo
              </span>
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
