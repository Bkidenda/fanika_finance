import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { runAdvisor } from "@/lib/advisor.functions";
import { useProfile, useDeductions, useBudgets, useExpenses, useInvestments, useIncomeEntries, useSubscriptions, useDebts, useAIInsights } from "@/lib/queries";
import { computeBreakdown } from "@/lib/finance";
import { formatCurrency, monthKey } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles, AlertTriangle, CheckCircle2, Wand2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/advisor")({ component: Advisor });

function Advisor() {
  const profile = useProfile();
  const deductions = useDeductions();
  const budgets = useBudgets();
  const expenses = useExpenses();
  const investments = useInvestments();
  const incomeEntries = useIncomeEntries();
  const subs = useSubscriptions();
  const debts = useDebts();
  const insights = useAIInsights();

  const advisorFn = useServerFn(runAdvisor);
  const m = useMutation({
    mutationFn: advisorFn,
    onSuccess: () => { toast.success("Advisor report ready"); insights.refetch(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const currency = profile.data?.currency ?? "KES";
  const titheEnabled = !!profile.data?.tithe_enabled;
  const titheRate = profile.data?.tithe_rate ?? 0.10;
  const receivedIncome = (incomeEntries.data ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const b = computeBreakdown(receivedIncome, deductions.data ?? [], { titheEnabled, titheRate });

  const spendByCat = new Map<string, number>();
  (expenses.data ?? []).forEach((e) => spendByCat.set(e.category, (spendByCat.get(e.category) ?? 0) + Number(e.amount)));
  const monthlySpend = Array.from(spendByCat.values()).reduce((s, v) => s + v, 0);
  const familyKeys = ["Parents support", "Siblings support", "Extended family support", "Spouse / partner allowance", "Children allowance", "School fees", "Emergency family support"];
  const familyTotal = familyKeys.reduce((s, k) => s + (spendByCat.get(k) ?? 0), 0);
  const subsMonthly = (subs.data ?? []).filter((x) => x.active).reduce((s, x) => {
    const a = Number(x.amount); return s + (x.cycle === "monthly" ? a : x.cycle === "annual" ? a / 12 : x.cycle === "quarterly" ? a / 3 : a * 4);
  }, 0);
  const debtsTotal = (debts.data ?? []).filter((d) => !d.archived_at).reduce((s, d) => s + Number(d.balance), 0);
  const portfolioValue = (investments.data ?? []).reduce((s, i) => s + Number(i.current_value), 0);
  const budgetTotal = (budgets.data ?? []).reduce((s, x) => s + Number(x.limit_amount), 0);
  const savingsRate = b.net > 0 ? Math.max(0, b.disposable - monthlySpend) / b.net : 0;
  const debtRatio = b.net > 0 ? (b.custom + (debts.data ?? []).reduce((s, d) => s + Number(d.monthly_payment), 0)) / b.net : 0;
  const familySupportRatio = b.net > 0 ? familyTotal / b.net : 0;

  function runAnalysis() {
    if (receivedIncome === 0 && monthlySpend === 0 && debtsTotal === 0 && portfolioValue === 0) {
      toast.error("Record some income, expenses or accounts first so the advisor has data to review.");
      return;
    }

    m.mutate({
      data: {
        period: monthKey().slice(0, 7),
        context: {
          currency, titheEnabled, net: b.net, disposable: b.disposable, tithe: b.tithe,
          customDeductions: b.custom, monthlySpend, budgetTotal,
          savingsRate, debtRatio, familySupportRatio, subscriptionsMonthly: subsMonthly,
          debtsTotal, portfolioValue,
          topCategories: Array.from(spendByCat.entries()).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount).slice(0, 10),
          incomeStreams: new Set((incomeEntries.data ?? []).map((e) => e.source)).size,
        },
      },
    });
  }

  const latest = insights.data?.[0];
  const booting = profile.isLoading || insights.isLoading || expenses.isLoading || incomeEntries.isLoading;

  if (booting) {
    return (
      <div className="space-y-6" role="status" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading your financial review…</span>
        <div className="h-16 animate-pulse rounded-2xl bg-muted" />
        <div className="h-36 animate-pulse rounded-2xl bg-muted" />
        <div className="h-48 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div><p className="text-sm text-muted-foreground">Personalized financial review</p><h2 className="text-2xl font-semibold tracking-tight">AI Advisor</h2></div>
        <Button onClick={runAnalysis} disabled={m.isPending} aria-busy={m.isPending} aria-label="Run AI financial analysis"><Wand2 className={`mr-1 h-4 w-4 ${m.isPending ? "animate-spin" : ""}`} />{m.isPending ? "Analyzing..." : "Run analysis"}</Button>
      </div>


      <div className="rounded-2xl border bg-gradient-hero p-6 text-primary-foreground shadow-elevated">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-80"><Bot className="h-4 w-4" /> Snapshot</div>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <Tile l="Disposable" v={formatCurrency(b.disposable, currency)} />
          <Tile l="Monthly spend" v={formatCurrency(monthlySpend, currency)} />
          <Tile l="Family support" v={formatCurrency(familyTotal, currency)} />
          <Tile l="Debt balance" v={formatCurrency(debtsTotal, currency)} />
        </div>
      </div>

      {latest ? (
        <div className="rounded-2xl border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Latest report · {latest.period}</div>
              <div className="mt-1 text-3xl font-semibold tabular-nums">{latest.score}<span className="text-base text-muted-foreground">/100</span></div>
            </div>
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <p className="mt-4 text-sm leading-relaxed">{latest.summary}</p>
          <div className="mt-5 space-y-2">
            {latest.recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border p-3">
                <div className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg ${r.kind === "warn" ? "bg-warning/15 text-warning-foreground" : r.kind === "good" ? "bg-success/15 text-success" : "bg-secondary text-primary"}`}>
                  {r.kind === "warn" ? <AlertTriangle className="h-4 w-4" /> : r.kind === "good" ? <CheckCircle2 className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                </div>
                <p className="text-sm">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No reports yet. Run an analysis to get a personalized financial review.
        </div>
      )}

      {insights.data && insights.data.length > 1 && (
        <div className="rounded-2xl border bg-card p-6 shadow-card">
          <h3 className="font-semibold">History</h3>
          <div className="mt-3 divide-y">
            {insights.data.slice(1).map((r) => (
              <div key={r.id} className="flex items-center justify-between py-3 text-sm">
                <div><div className="font-medium">{r.period}</div><div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div></div>
                <div className="tabular-nums font-medium">{r.score}/100</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Tile({ l, v }: { l: string; v: string }) {
  return <div className="rounded-xl bg-white/10 p-3"><div className="text-xs opacity-80">{l}</div><div className="mt-1 text-lg font-semibold tabular-nums">{v}</div></div>;
}
