import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, ShieldCheck, PiggyBank, TrendingUp, BookOpen, Wallet, Landmark,
  Sparkles, Calendar, Eye, HandHeart, Bot, Target,
} from "lucide-react";
import { PublicLayout } from "@/components/public-layout";
import { useAuth } from "@/hooks/use-auth";
import { HeroCanvas } from "@/components/landing/hero-canvas";
import { Reveal, Stagger, staggerItem, CountUp, ScrollProgress } from "@/components/landing/motion";
import { TiltCard } from "@/components/landing/tilt-card";
import { JourneyTabs } from "@/components/landing/journey-tabs";
import { LedgerMockup } from "@/components/landing/ledger-mockup";
import { AllocationCalculator } from "@/components/landing/allocation-calculator";

const DEMO_MAILTO = "https://calendly.com/bkidenda/30min?back=1&month=2026-06";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fanika — Manage Money with Purpose. Build Wealth with Discipline." },
      { name: "description", content: "A living financial dashboard for budgeting, giving, saving, investing and debt payoff — built on discipline, not guesswork." },
      { property: "og:title", content: "Fanika — Manage Money with Purpose" },
      { property: "og:description", content: "Personal finance OS for serious money managers. Budgets, debts, investments, daily insights." },
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
  const reduced = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const fgY = useTransform(scrollYProgress, [0, 1], ["0%", "-6%"]);
  const bgFade = useTransform(scrollYProgress, [0, 1], [1, 0.35]);

  useEffect(() => {
    if (loading) return;
    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
    if (!isMobile) return;
    navigate({ to: user ? "/dashboard" : "/login", replace: true });
  }, [user, loading, navigate]);

  return (
    <PublicLayout dark>
      <ScrollProgress />

      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative isolate overflow-hidden">
        <motion.div
          aria-hidden
          style={reduced ? undefined : { y: bgY, opacity: bgFade }}
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="absolute inset-0 bg-gradient-harvest" />
          <div className="absolute inset-0 bg-ledger-grid opacity-60" />
          <HeroCanvas className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-ink" />
        </motion.div>

        <motion.div
          style={reduced ? undefined : { y: fgY }}
          className="mx-auto max-w-5xl px-4 pb-24 pt-10 text-center md:px-6 md:pb-36 md:pt-16"
        >
          <Stagger className="flex flex-col items-center">
            <motion.span
              variants={staggerItem}
              className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-gold-soft"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Discipline-first finance
            </motion.span>

            <motion.h1
              variants={staggerItem}
              className="mt-6 text-balance text-4xl font-semibold leading-[1.03] tracking-tight text-ink-fg md:text-6xl lg:text-7xl"
            >
              Manage money with <span className="text-gradient-gold">purpose</span>.
            </motion.h1>
            <motion.h1
              variants={staggerItem}
              className="text-balance text-4xl font-semibold leading-[1.03] tracking-tight text-ink-fg md:text-6xl lg:text-7xl"
            >
              Build wealth with <span className="text-gradient-gold">discipline</span>.
            </motion.h1>

            <motion.p variants={staggerItem} className="mt-6 max-w-2xl text-base leading-relaxed text-ink-muted md:text-lg">
              One living dashboard for income, giving, budgets, debt payoff, savings and investments —
              so every shilling is accounted for before it's spent.
            </motion.p>

            <motion.div variants={staggerItem} className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="magnetic pulse-gold bg-gold text-ink hover:bg-gold-soft">
                <Link to="/signup">Start free <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="magnetic border-ink-line bg-ink-soft/60 text-ink-fg hover:bg-gold/10 hover:text-gold-soft">
                <a href={DEMO_MAILTO}><Calendar className="mr-1 h-4 w-4" /> Book a free demo</a>
              </Button>
              <Button asChild size="lg" variant="ghost" className="magnetic text-ink-muted hover:bg-gold/10 hover:text-ink-fg">
                <Link to="/how-it-works">See how it works</Link>
              </Button>
            </motion.div>

            <motion.div variants={staggerItem} className="mt-10 grid w-full max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { l: "Tracked monthly", v: 4200000, prefix: "KES ", c: "var(--leaf)" },
                { l: "Given with intent", v: 386000, prefix: "KES ", c: "var(--gold)" },
                { l: "Debt paid down", v: 912000, prefix: "KES ", c: "var(--clay)" },
                { l: "Goals on track", v: 214, prefix: "", c: "var(--slate-blue)" },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl border border-ink-line bg-ink-soft/60 p-4 backdrop-blur">
                  <div className="text-lg font-semibold tabular-nums md:text-xl" style={{ color: s.c }}>
                    <CountUp to={s.v} prefix={s.prefix} />
                  </div>
                  <div className="mt-1 text-[11px] uppercase tracking-wider text-ink-muted">{s.l}</div>
                </div>
              ))}
            </motion.div>
          </Stagger>
        </motion.div>
      </section>

      {/* ─── WHY FANIKA ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <Reveal className="text-center">
          <p className="text-sm font-medium text-gold">Why Fanika?</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-fg md:text-4xl">Finance that serves your purpose.</h2>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            { i: Eye, t: "Financial clarity", d: "Know exactly where money comes from, where it goes, and what each decision costs your future.", c: "var(--leaf)" },
            { i: HandHeart, t: "Purposeful allocation", d: "Giving and fixed commitments are settled first — what remains is genuinely disposable.", c: "var(--gold)" },
            { i: Bot, t: "Automated planning", d: "Budgets seed themselves from your income, recurring lines and live commitments each month.", c: "var(--slate-blue)" },
            { i: Target, t: "Wealth building", d: "Savings, investments, emergency fund and goals roll into one net-worth line.", c: "var(--clay)" },
          ].map((f, i) => (
            <Reveal key={f.t} delay={i * 0.06}>
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
