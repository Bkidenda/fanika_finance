import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, PiggyBank, TrendingUp, BookOpen, Wallet, Calculator, Landmark } from "lucide-react";
import { PublicLayout } from "@/components/public-layout";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nuru Steward — Personal Finance, Anchored in Stewardship" },
      { name: "description", content: "Track budgets, expenses, savings, investments, statutory deductions, debts and tithing — all from one stewardship-first dashboard." },
      { property: "og:title", content: "Nuru Steward — Personal Finance, Anchored in Stewardship" },
      { property: "og:description", content: "The personal finance OS for disciplined stewards. Budgets, taxes, debts, investments, devotionals." },
    ],
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
              Automate tithes, statutory deductions, and budgets. Track expenses, savings, debts and investments across every account — all anchored in daily devotional wisdom.
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
              <span>✓ Kenya statutory (NSSF · SHIF · AHL · PAYE)</span>
              <span>✓ Multi-account net worth</span>
              <span>✓ Monthly close & reconciliation</span>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl border bg-card shadow-elevated">
            <img src={heroImg} alt="Steward reviewing personal finances on a tablet at sunrise" width={1920} height={1080} className="h-full w-full object-cover" />
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
            { i: Calculator, t: "Salary breakdown intelligence", d: "See your gross flow into NSSF, SHIF, AHL, PAYE, tithe, and disposable income — automatically." },
            { i: Wallet, t: "Budgets & expenses", d: "Plan by category, log against your budget, and emergency-flag what doesn't fit." },
            { i: Landmark, t: "Unified accounts", d: "Bank, M-Pesa, SACCO, cash. One net-worth view that updates when you spend or earn." },
            { i: PiggyBank, t: "Debt & subscription control", d: "Track formal loans and informal lending. Watch subscriptions before they pile up." },
            { i: TrendingUp, t: "Investments & goals", d: "Portfolio ROI, savings goals, and diversification scoring for every income stream." },
            { i: BookOpen, t: "Daily stewardship", d: "Scripture & Ellen G. White wisdom tied to your financial behavior, every day." },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border bg-card p-6 shadow-card transition hover:shadow-elevated">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><f.i className="h-5 w-5" /></div>
              <h3 className="mt-4 font-semibold">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
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
