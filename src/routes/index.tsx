import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, ShieldCheck, PiggyBank, TrendingUp, BookOpen, Wallet, Landmark,
  Sparkles, Calendar, Eye, Bot, Target, LockKeyhole, CircleCheck,
} from "lucide-react";
import { PublicLayout } from "@/components/public-layout";
import { useAuth } from "@/hooks/use-auth";
import { Reveal, Stagger, staggerItem, CountUp, ScrollProgress } from "@/components/landing/motion";
import { TiltCard } from "@/components/landing/tilt-card";
import { JourneyTabs } from "@/components/landing/journey-tabs";
import { LedgerMockup } from "@/components/landing/ledger-mockup";
import { AllocationCalculator } from "@/components/landing/allocation-calculator";
import heroDashboard from "@/assets/hero-dashboard.jpg";

const DEMO_MAILTO = "https://calendly.com/bkidenda/30min?back=1&month=2026-06";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fanika — Intelligent Personal Finance" },
      { name: "description", content: "Plan budgets, track cash flow, manage debt and grow your net worth from one intelligent personal finance platform." },
      { property: "og:title", content: "Fanika — Intelligent Personal Finance" },
      { property: "og:description", content: "See every account, budget, debt and goal in one clear financial picture." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://fanikasteward.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://fanikasteward.lovable.app/" }],
  }),
  component: Home,
});

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
      <ScrollProgress />

      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden border-b bg-background">
        <div aria-hidden className="absolute inset-0 -z-10 bg-finance-grid opacity-70" />
        <div className="mx-auto grid min-h-[calc(100svh-6rem)] max-w-7xl items-center gap-10 px-4 pb-16 pt-8 md:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:gap-14 lg:pb-20 lg:pt-12">
          <Stagger className="flex flex-col items-start text-left">
            <motion.span
              variants={staggerItem}
              className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary"
            >
              <Sparkles className="h-3.5 w-3.5" /> Intelligent money management
            </motion.span>

            <motion.h1
              variants={staggerItem}
              className="mt-6 max-w-xl text-balance text-4xl font-bold leading-[1.05] tracking-normal text-foreground md:text-6xl"
            >
              Know where your money is. Decide where it goes next.
            </motion.h1>

            <motion.p variants={staggerItem} className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Fanika brings your accounts, budgets, debts, investments and goals into one clear financial picture — with timely insight that helps you act with confidence.
            </motion.p>

            <motion.div variants={staggerItem} className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="magnetic pulse-primary">
                <Link to="/signup">Start free <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="magnetic bg-card/80">
                <a href={DEMO_MAILTO}><Calendar className="mr-1 h-4 w-4" /> Book a free demo</a>
              </Button>
            </motion.div>

            <motion.div variants={staggerItem} className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><CircleCheck className="h-4 w-4 text-primary" /> Start without a credit card</span>
              <span className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-info" /> Private by design</span>
            </motion.div>
          </Stagger>

          <Reveal x={28} y={0} className="relative">
            <div className="absolute -inset-5 -z-10 rounded-3xl bg-primary/5 blur-2xl" />
            <div className="overflow-hidden rounded-2xl border bg-card p-2 shadow-elevated md:p-3">
              <img src={heroDashboard} alt="Fanika dashboard showing net worth, budgets, savings, spending and accounts" className="aspect-square w-full rounded-xl object-cover" fetchPriority="high" />
            </div>
            <div className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-xl border bg-card/95 px-4 py-3 shadow-card backdrop-blur md:left-[-1.5rem]">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><TrendingUp className="h-4 w-4" /></span>
              <span><strong className="block text-sm">One live financial view</strong><span className="text-xs text-muted-foreground">Accounts to goals, always reconciled</span></span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── WHY FANIKA ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <Reveal className="text-center">
          <p className="text-sm font-semibold text-primary">Why Fanika?</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-normal text-foreground md:text-4xl">A clearer way to run your financial life.</h2>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            { i: Eye, t: "Complete visibility", d: "See income, spending, balances and liabilities together, without stitching together spreadsheets.", c: "var(--primary)" },
            { i: Wallet, t: "Smarter allocation", d: "Plan recurring commitments and flexible spending before money leaves your accounts.", c: "var(--chart-3)" },
            { i: Bot, t: "Timely intelligence", d: "Turn current activity and financial history into practical, trend-aware recommendations.", c: "var(--chart-2)" },
            { i: Target, t: "Measurable progress", d: "Track savings, investments, debt reduction and goals in one net-worth view.", c: "var(--chart-4)" },
          ].map((f, i) => (
            <Reveal key={f.t} delay={i * 0.06}>
               <TiltCard className="h-full rounded-2xl border bg-card p-6 shadow-card transition hover:border-primary/25">
                 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted" style={{ color: f.c }}>
                  <f.i className="h-5 w-5" />
                </div>
                 <h3 className="mt-4 font-semibold text-foreground">{f.t}</h3>
                 <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.d}</p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── SCROLL STORY: the ledger demonstrates itself ─────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Reveal>
              <p className="text-sm font-medium text-gold">The financial journey</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-fg md:text-4xl">
                Watch a month settle itself.
              </h2>
              <p className="mt-4 max-w-lg text-ink-muted">
                Income lands, giving is set aside, debts step down, savings compound. Fanika keeps the whole
                ledger reconciled as it happens — no spreadsheet, no month-end panic.
              </p>
            </Reveal>
            <Stagger className="mt-8 space-y-4" delay={0.1}>
              {[
                ["Giving computed before disposable income", "var(--gold)"],
                ["Debt repayments post to loan, account and expenses at once", "var(--clay)"],
                ["Recurring lines carry forward; one-off lines reset to zero", "var(--leaf)"],
                ["Monthly close snapshots the past and opens the next month", "var(--slate-blue)"],
              ].map(([t, c]) => (
                <motion.div key={t} variants={staggerItem} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: c }} />
                  <p className="text-sm text-ink-fg">{t}</p>
                </motion.div>
              ))}
            </Stagger>
          </div>
          <Reveal x={24} y={0}>
            <LedgerMockup />
          </Reveal>
        </div>
      </section>

      {/* ─── DAY IN THE LIFE ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
        <Reveal className="text-center">
          <p className="text-sm font-medium text-gold">A day with Fanika</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-fg md:text-4xl">Four moves, one ledger.</h2>
        </Reveal>
        <Reveal className="mt-10" delay={0.08}>
          <JourneyTabs />
        </Reveal>
      </section>

      {/* ─── LIVE CALCULATOR ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
        <Reveal className="text-center">
          <p className="text-sm font-medium text-gold">Try it right here</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-fg md:text-4xl">
            See how giving, savings and debt payoff land on your income.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-muted">
            Move the sliders. The donut redistributes live — gold for giving, slate for savings, clay for debt, emerald for living and goals.
          </p>
        </Reveal>
        <Reveal className="mt-10" delay={0.08} scale={0.98}>
          <AllocationCalculator />
        </Reveal>
      </section>

      {/* ─── MODULES ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <Reveal className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-ink-fg md:text-4xl">Built for disciplined households</h2>
          <p className="mx-auto mt-3 max-w-2xl text-ink-muted">Everything you need to see, govern and grow your finances — without spreadsheets.</p>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[
            { i: Wallet, t: "Budgets & money tracker", d: "Plan by category, log income and spending in one ledger, and flag what didn't fit the plan.", c: "var(--leaf)" },
            { i: Landmark, t: "Unified accounts", d: "Bank, mobile money, SACCO and cash in a single net-worth view that updates as you transact.", c: "var(--slate-blue)" },
            { i: PiggyBank, t: "Debt & subscription control", d: "Track formal loans and informal lending, and catch subscriptions before they pile up.", c: "var(--clay)" },
            { i: TrendingUp, t: "Investments & goals", d: "Portfolio ROI, savings goals and diversification scoring across every income stream.", c: "var(--gold)" },
            { i: Sparkles, t: "AI advisor + assistant", d: "Monthly analysis with trend-aware recommendations, plus an always-on chat assistant.", c: "var(--gold-soft)" },
            { i: BookOpen, t: "Reports & statements", d: "Income statement, balance sheet and cash flow — download as PDF, Excel or CSV, or have them emailed.", c: "var(--leaf)" },
          ].map((f, i) => (
            <Reveal key={f.t} delay={(i % 3) * 0.06}>
              <TiltCard className="h-full rounded-2xl border border-ink-line bg-ink-soft/70 p-6 transition hover:border-gold/35">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "color-mix(in oklab, var(--ink-fg) 6%, transparent)", color: f.c }}>
                  <f.i className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-ink-fg">{f.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.d}</p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── ABOUT ───────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-16 md:px-6">
        <Reveal>
          <div className="rounded-3xl border border-ink-line bg-ink-soft/70 p-8 md:p-10">
            <p className="text-sm font-medium text-gold">About</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-fg">Financial discipline, made operational.</h2>
            <div className="mt-6 space-y-4 text-ink-muted">
              <p>Fanika exists for the household that treats money management as a daily operating system, not an annual resolution.</p>
              <p>We asked a simple question: what would personal finance look like if giving wasn't an afterthought, if family obligations were budgeted instead of guessed, and if every shilling was visible across every account?</p>
              <p>The answer is this ledger — budgets shaped around how households actually spend, a monthly close that reconciles the past before the next month opens, and daily insight so numbers carry context.</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 pb-24 md:px-6">
        <Reveal scale={0.98}>
          <div className="relative overflow-hidden rounded-3xl border border-gold/25 bg-gradient-harvest p-10 text-center shadow-elevated">
            <div aria-hidden className="absolute inset-0 bg-ledger-grid opacity-50" />
            <div className="relative">
              <h2 className="text-3xl font-semibold tracking-tight text-ink-fg">Ready to take your finances seriously?</h2>
              <p className="mx-auto mt-3 max-w-xl text-ink-muted">Create your free account and bring every shilling into the light.</p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" className="magnetic pulse-gold bg-gold text-ink hover:bg-gold-soft">
                  <Link to="/signup">Get started — it's free <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="magnetic border-ink-line bg-ink-soft/60 text-ink-fg hover:bg-gold/10 hover:text-gold-soft">
                  <a href={DEMO_MAILTO}><Calendar className="mr-1 h-4 w-4" /> Book a free demo</a>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </PublicLayout>
  );
}
