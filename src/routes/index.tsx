import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, PiggyBank, TrendingUp, BookOpen, Wallet, Landmark, Sparkles } from "lucide-react";
import { PublicLayout } from "@/components/public-layout";
import heroImg from "@/assets/founder-white.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nuru Steward — Personal Finance, Anchored in Stewardship" },
      { name: "description", content: "Track budgets, expenses, savings, investments, debts and tithing — in any currency, anywhere. A stewardship-first personal finance OS." },
      { property: "og:title", content: "Nuru Steward — Personal Finance, Anchored in Stewardship" },
      { property: "og:description", content: "The personal finance OS for disciplined stewards. Budgets, debts, investments, devotionals." },
      { property: "og:url", content: "https://nurusteward.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://nurusteward.lovable.app/" }],
  }),
  component: Home,
});

function Home() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-6 pb-16 pt-14">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-card">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Stewardship-first finance
            </span>
            <h1 className="mt-5 text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              Your <span className="text-gradient-primary">personal finance</span> operating system.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Start from your net take-home, automate tithes, plan budgets, and track expenses, savings, debts and investments across every account — all anchored in daily devotional wisdom. Works in any currency.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/signup">Start free <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
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
            {/* Decorative floating graphics */}
            <div aria-hidden className="pointer-events-none absolute -left-6 -top-6 h-24 w-24 rounded-3xl bg-gradient-primary opacity-20 blur-2xl animate-pulse" />
            <div aria-hidden className="pointer-events-none absolute -right-8 top-12 h-28 w-28 rounded-full bg-[oklch(0.72_0.14_175)] opacity-25 blur-3xl animate-pulse [animation-delay:600ms]" />
            <div aria-hidden className="pointer-events-none absolute -bottom-6 right-10 h-32 w-32 rounded-3xl bg-[oklch(0.78_0.15_75)] opacity-20 blur-3xl animate-pulse [animation-delay:1200ms]" />

            {/* Floating finance stat chips */}
            <div className="pointer-events-none absolute left-2 top-10 z-10 hidden animate-fade-in rounded-2xl border bg-card/95 px-3 py-2 text-xs shadow-elevated backdrop-blur md:block" style={{ animation: "fade-in 0.6s ease-out both" }}>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Tithe</div>
              <div className="text-sm font-semibold tabular-nums text-primary">10% set aside</div>
            </div>
            <div className="pointer-events-none absolute right-2 top-32 z-10 hidden rounded-2xl border bg-card/95 px-3 py-2 text-xs shadow-elevated backdrop-blur md:block" style={{ animation: "fade-in 0.8s ease-out 0.2s both" }}>
              <div className="flex items-center gap-1.5"><TrendingUp className="h-3 w-3 text-success" /><span className="text-[10px] uppercase tracking-wider text-muted-foreground">Net worth</span></div>
              <div className="text-sm font-semibold tabular-nums">+12.4%</div>
            </div>
            <div className="pointer-events-none absolute -left-2 bottom-14 z-10 hidden rounded-2xl border bg-card/95 px-3 py-2 text-xs shadow-elevated backdrop-blur md:block" style={{ animation: "fade-in 1s ease-out 0.4s both" }}>
              <div className="flex items-center gap-1.5"><PiggyBank className="h-3 w-3 text-primary" /><span className="text-[10px] uppercase tracking-wider text-muted-foreground">Goals</span></div>
              <div className="text-sm font-semibold tabular-nums">3 on track</div>
            </div>

            {/* Photo frame on white */}
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-white shadow-elevated" style={{ animation: "scale-in 0.7s ease-out both" }}>
              <img
                src={heroImg}
                alt="Brian Kidenda, founder of Nuru Steward"
                width={1080}
                height={1440}
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                style={{ animation: "fade-in 0.8s ease-out both" }}
              />
              {/* subtle sweep highlight */}
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-primary/5" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
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

      {/* About / founder section (merged from former /about page) */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="rounded-3xl border bg-card p-10 shadow-card">
          <p className="text-sm font-medium text-primary">About</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Stewardship made operational.</h2>
          <div className="prose prose-neutral mt-6 max-w-none text-muted-foreground">
            <p>Nuru Steward exists for the household that wants to take faithful stewardship seriously — not as a Sunday idea, but as a daily operating system.</p>
            <p>We started by asking: what would personal finance look like if tithing wasn't an afterthought, if family obligations were budgeted instead of guessed, and if every shilling — or dollar, or rupee — was visible across every account?</p>
            <p>The answer is what you see here. Budgets that group around how real households actually spend. A monthly close so the past is reconciled before the next month begins. And devotional context, because numbers without wisdom is just spreadsheets.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="rounded-3xl border bg-gradient-hero p-10 text-center text-primary-foreground shadow-elevated">
          <h2 className="text-3xl font-semibold tracking-tight">Ready to take stewardship seriously?</h2>
          <p className="mx-auto mt-3 max-w-xl opacity-90">Create your free account and bring every shilling into the light.</p>
          <Button size="lg" variant="secondary" asChild className="mt-6">
            <Link to="/signup">Get started — it's free <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
