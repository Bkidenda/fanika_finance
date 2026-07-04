import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, PiggyBank, TrendingUp, BookOpen, Wallet, Landmark, Sparkles, Calendar, Eye, HandHeart, Bot, Target } from "lucide-react";
import { PublicLayout } from "@/components/public-layout";
import heroImg from "@/assets/founder-portrait.jpg";

const DEMO_MAILTO = "https://calendly.com/bkidenda/30min?back=1&month=2026-06";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fanika — Manage Money with Purpose. Build Wealth with Discipline." },
      { name: "description", content: "Your complete personal finance operating system for budgeting, giving, saving, investing, debt management, and financial planning — rooted in stewardship." },
      { property: "og:title", content: "Fanika — Manage Money with Purpose" },
      { property: "og:description", content: "Personal finance OS for disciplined stewards. Budgets, debts, investments, devotionals." },
      { property: "og:url", content: "https://nurusteward.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://nurusteward.lovable.app/" }],
  }),
  component: Home,
});

function Home() {
  return (
    <PublicLayout>
      {/* HERO */}
      <section className="relative mx-auto max-w-7xl px-4 pb-10 pt-4 md:px-6 md:pb-16 md:pt-8">
        <div className="grid items-center gap-6 md:gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div className="duration-700 animate-in fade-in slide-in-from-left-4">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-card">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Stewardship-first finance
            </span>
            <h1 className="mt-4 text-balance text-3xl font-semibold leading-[1.05] tracking-tight md:mt-5 md:text-5xl lg:text-6xl">
              Manage Money with <span className="text-gradient-primary">Purpose</span>.<br />
              Build Wealth with <span className="text-gradient-primary">Discipline</span>.
            </h1>
            <p className="mt-4 max-w-xl text-sm text-muted-foreground md:mt-5 md:text-lg">
              Your complete personal finance operating system for budgeting, giving, saving, investing, debt management, and financial planning. Fanika helps you make intentional financial decisions rooted in stewardship, accountability, and long-term prosperity.
            </p>
            <p className="mt-3 hidden max-w-xl text-sm text-muted-foreground md:mt-4 md:block">
              Start from your net take-home pay, automate tithes and giving, plan monthly budgets, track spending, manage debts, monitor investments, and stay aligned with your financial goals — all in one place.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/signup">Start free <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={DEMO_MAILTO}><Calendar className="mr-1 h-4 w-4" /> Book a free demo</a>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link to="/how-it-works">See how it works</Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span>✓ Multi-currency</span>
              <span>✓ Multi-account net worth</span>
              <span>✓ Monthly close & reconciliation</span>
              <span>✓ AI advisor & chatbot</span>
            </div>
          </div>

          <div className="relative">
            <div aria-hidden className="pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-3xl bg-gradient-primary opacity-25 blur-2xl animate-pulse" />
            <div aria-hidden className="pointer-events-none absolute -right-6 top-16 h-28 w-28 rounded-full bg-[oklch(0.68_0.12_60)] opacity-30 blur-3xl animate-pulse [animation-delay:600ms]" />
            <div aria-hidden className="pointer-events-none absolute -bottom-6 right-12 h-32 w-32 rounded-3xl bg-[oklch(0.78_0.10_65)] opacity-25 blur-3xl animate-pulse [animation-delay:1200ms]" />

            {/* Floating chips */}
            <div className="pointer-events-none absolute -right-3 top-20 z-10 hidden rounded-2xl border bg-card/95 px-3 py-2 text-xs shadow-elevated backdrop-blur delay-200 duration-700 animate-in fade-in slide-in-from-right-4 md:block">
              <div className="flex items-center gap-1.5"><TrendingUp className="h-3 w-3 text-primary" /><span className="text-[10px] uppercase tracking-wider text-muted-foreground">Net worth</span></div>

              <div className="text-sm font-semibold tabular-nums">+12.4%</div>
            </div>
            <div className="pointer-events-none absolute -left-2 bottom-12 z-10 hidden rounded-2xl border bg-card/95 px-3 py-2 text-xs shadow-elevated backdrop-blur delay-500 duration-700 animate-in fade-in slide-in-from-bottom-4 md:block">
              <div className="flex items-center gap-1.5"><PiggyBank className="h-3 w-3 text-primary" /><span className="text-[10px] uppercase tracking-wider text-muted-foreground">Goals</span></div>
              <div className="text-sm font-semibold tabular-nums">3 on track</div>
            </div>

            <div className="relative w-full overflow-hidden rounded-3xl border border-primary/20 bg-background shadow-elevated duration-700 animate-in fade-in zoom-in-95">
              <img
                src={heroImg}
                alt="Fanika founder"
                loading="eager"
                decoding="async"
                className="block h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
              />
              {/* Hero image already shows the founder holding a dashboard tablet — no overlay needed. */}
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-primary/5" />
            </div>
          </div>
        </div>
      </section>

      {/* WHY NURU */}
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-16">
        <div className="text-center">
          <p className="text-sm font-medium text-primary">Why Fanika?</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-4xl">Finance that serves your purpose.</h2>
        </div>
        <div className="mt-8 grid gap-4 md:mt-12 md:gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            { i: Eye, t: "Financial Clarity", d: "Know exactly where your money comes from, where it goes, and how every decision impacts your future." },
            { i: HandHeart, t: "Faithful Stewardship", d: "Prioritize tithes, offerings, generosity, and purpose-driven financial planning before allocating the rest of your income." },
            { i: Bot, t: "Automated Planning", d: "Create realistic budgets automatically based on your income, commitments, and financial priorities." },
            { i: Target, t: "Wealth Building", d: "Track savings, investments, emergency funds, and long-term financial goals from a single dashboard." },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border bg-card p-6 shadow-card transition hover:shadow-elevated">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><f.i className="h-5 w-5" /></div>
              <h3 className="mt-4 font-semibold">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MODULES */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Built for disciplined stewards</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Everything you need to see, govern, and grow your finances — without spreadsheets.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[
            { i: Wallet, t: "Budgets & expenses", d: "Plan by category, log against your budget, and emergency-flag what doesn't fit." },
            { i: Landmark, t: "Unified accounts", d: "Bank, mobile money, SACCO, cash. One net-worth view that updates when you spend or earn." },
            { i: PiggyBank, t: "Debt & subscription control", d: "Track formal loans and informal lending. Watch subscriptions before they pile up." },
            { i: TrendingUp, t: "Investments & goals", d: "Portfolio ROI, savings goals, and diversification scoring for every income stream." },
            { i: Sparkles, t: "AI advisor + chatbot", d: "Monthly analysis with actionable recommendations, plus an always-on assistant." },
            { i: BookOpen, t: "Daily stewardship", d: "Scripture and short, verified quotations to ground every financial decision." },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border bg-card p-6 shadow-card transition hover:shadow-elevated">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><f.i className="h-5 w-5" /></div>
              <h3 className="mt-4 font-semibold">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="rounded-3xl border bg-card p-10 shadow-card">
          <p className="text-sm font-medium text-primary">About</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Stewardship made operational.</h2>
          <div className="prose prose-neutral mt-6 max-w-none text-muted-foreground">
            <p>Fanika exists for the household that wants to take faithful stewardship seriously — not as a Sunday idea, but as a daily operating system.</p>
            <p>We started by asking: what would personal finance look like if tithing wasn't an afterthought, if family obligations were budgeted instead of guessed, and if every shilling — or dollar, or rupee — was visible across every account?</p>
            <p>The answer is what you see here. Budgets that group around how real households actually spend. A monthly close so the past is reconciled before the next month begins. And devotional context, because numbers without wisdom is just spreadsheets.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="rounded-3xl border bg-gradient-hero p-10 text-center text-primary-foreground shadow-elevated">
          <h2 className="text-3xl font-semibold tracking-tight">Ready to take stewardship seriously?</h2>
          <p className="mx-auto mt-3 max-w-xl opacity-90">Create your free account and bring every shilling into the light.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/signup">Get started — it's free <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white/40 bg-transparent text-primary-foreground hover:bg-white/15">
              <a href={DEMO_MAILTO}><Calendar className="mr-1 h-4 w-4" /> Book a free demo</a>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
