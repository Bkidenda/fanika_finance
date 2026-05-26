import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sprout, ArrowRight, ShieldCheck, BookOpen, TrendingUp, PiggyBank } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen bg-gradient-surface">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-card">
            <Sprout className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight">Nuru Steward</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link to="/signup">
              Get started <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-14">
        <section className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-card">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Stewardship-first finance
            </span>
            <h1 className="mt-5 text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              Your <span className="text-gradient-primary">personal finance</span> operating system.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Automate tithes, statutory deductions, and budgets. Track expenses, savings,
              and investments. Stay anchored with daily devotional insight.
            </p>
            <div className="mt-7 flex gap-3">
              <Button size="lg" asChild>
                <Link to="/signup">
                  Start free <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">I have an account</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border bg-gradient-hero p-8 text-primary-foreground shadow-elevated">
            <div className="text-sm uppercase tracking-widest opacity-80">This month</div>
            <div className="mt-2 text-4xl font-semibold tabular-nums">KES 87,540</div>
            <div className="mt-1 text-sm opacity-80">Net income after stewardship</div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
              {[
                { l: "Tithe", v: "10%" },
                { l: "Savings", v: "18%" },
                { l: "Health", v: "82" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl bg-white/10 p-3 backdrop-blur">
                  <div className="text-xs opacity-80">{s.l}</div>
                  <div className="mt-1 text-lg font-semibold">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-24 grid gap-5 md:grid-cols-3">
          {[
            { i: PiggyBank, t: "Automated stewardship", d: "10% tithe + statutory deductions calculated for you, every month." },
            { i: TrendingUp, t: "Smart insights", d: "Health scores, savings trends, and overspend alerts you can act on." },
            { i: BookOpen, t: "Daily devotion", d: "Scripture & Ellen G. White wisdom tied to your financial behavior." },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border bg-card p-6 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <f.i className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
