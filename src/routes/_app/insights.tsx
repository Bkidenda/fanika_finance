import { createFileRoute } from "@tanstack/react-router";
import { useProfile, useDeductions, useBudgets, useAllExpenses, useGoals, useInvestments } from "@/lib/queries";
import { computeBreakdown, healthScore } from "@/lib/finance";
import { formatCurrency, formatPercent, monthKey } from "@/lib/format";
import { Sparkles, AlertTriangle, CheckCircle2, TrendingUp, HandCoins } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { SERIES_COLORS, CHART_GRID_STROKE, CHART_AXIS_TICK } from "@/lib/chart-colors";

export const Route = createFileRoute("/_app/insights")({ component: Insights });

function Insights() {
  const profile = useProfile();
  const deductions = useDeductions();
  const budgets = useBudgets();
  const expenses = useAllExpenses();
  const goals = useGoals();
  const investments = useInvestments();

  const currency = profile.data?.currency ?? "KES";
  const net = profile.data?.net_income ?? 0;
  const breakdown = computeBreakdown(net, deductions.data ?? []);

  const currentMonth = monthKey();
  const thisMonth = (expenses.data ?? []).filter((e) => e.date >= currentMonth);
  const spendByCat = new Map<string, number>();
  thisMonth.forEach((e) => spendByCat.set(e.category, (spendByCat.get(e.category) ?? 0) + Number(e.amount)));
  const totalSpent = Array.from(spendByCat.values()).reduce((s, v) => s + v, 0);
  const budgetTotal = (budgets.data ?? []).reduce((s, b) => s + Number(b.limit_amount), 0);

  const savingsRate = breakdown.net > 0 ? Math.max(0, breakdown.disposable - totalSpent) / breakdown.net : 0;
  const givingRate = breakdown.net > 0 ? breakdown.tithe / breakdown.net : 0;
  const adherence = budgetTotal > 0 ? Math.max(0, 1 - Math.max(0, totalSpent - budgetTotal) / budgetTotal) : 1;
  const debtRatio = breakdown.net > 0 ? breakdown.custom / breakdown.net : 0;
  const score = healthScore({ savingsRate, givingRate, budgetAdherence: adherence, debtRatio });

  const trend: { month: string; spent: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const total = (expenses.data ?? [])
      .filter((e) => e.date.startsWith(m))
      .reduce((s, e) => s + Number(e.amount), 0);
    trend.push({ month: d.toLocaleString("en", { month: "short" }), spent: total });
  }

  const insights: { kind: "warn" | "good" | "info"; text: string }[] = [];
  (budgets.data ?? []).forEach((b) => {
    const s = spendByCat.get(b.category) ?? 0;
    if (b.limit_amount > 0 && s > b.limit_amount * 1.1) {
      insights.push({
        kind: "warn",
        text: `You exceeded ${b.category} budget by ${formatPercent(((s - b.limit_amount) / b.limit_amount) * 100)} this month.`,
      });
    }
  });
  if (savingsRate < 0.1 && net > 0) {
    insights.push({ kind: "warn", text: `Your savings rate is ${formatPercent(savingsRate * 100)} — below the 15% threshold.` });
  } else if (savingsRate > 0.2) {
    insights.push({ kind: "good", text: `Strong savings rate of ${formatPercent(savingsRate * 100)} — great discipline.` });
  }
  if (givingRate >= 0.1) {
    insights.push({ kind: "good", text: "Consistent tithing pattern detected. Faithful stewardship." });
  }
  if (debtRatio > 0.3) {
    insights.push({ kind: "warn", text: `Custom deductions are ${formatPercent(debtRatio * 100)} of net income — review obligations.` });
  }
  const topCat = Array.from(spendByCat.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topCat) {
    insights.push({ kind: "info", text: `${topCat[0]} is your highest spending category this month.` });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Smart insights</p>
        <h2 className="text-2xl font-semibold tracking-tight">How you're stewarding your finances</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Score label="Health" value={score} suffix="/100" />
        <Score label="Savings rate" value={Math.round(savingsRate * 100)} suffix="%" />
        <Score label="Giving ratio" value={Math.round(givingRate * 100)} suffix="%" />
        <Score label="Discipline" value={Math.round(adherence * 100)} suffix="%" />
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <h3 className="font-semibold">Spending trend (6 months)</h3>
        <div className="mt-4 h-72">
          <ResponsiveContainer>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID_STROKE} />
              <XAxis dataKey="month" tick={CHART_AXIS_TICK} />
              <YAxis tick={CHART_AXIS_TICK} />
              <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
              <Line type="monotone" dataKey="spent" stroke={SERIES_COLORS.spending} strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <h3 className="font-semibold">Recommendations</h3>
        <div className="mt-4 space-y-3">
          {insights.length ? insights.map((i, idx) => (
            <div key={idx} className="flex items-start gap-3 rounded-xl border p-4">
              <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg ${
                i.kind === "warn" ? "bg-warning/15 text-warning-foreground" :
                i.kind === "good" ? "bg-success/15 text-success" : "bg-secondary text-primary"
              }`}>
                {i.kind === "warn" ? <AlertTriangle className="h-4 w-4" /> :
                 i.kind === "good" ? <CheckCircle2 className="h-4 w-4" /> :
                 <Sparkles className="h-4 w-4" />}
              </div>
              <p className="text-sm">{i.text}</p>
            </div>
          )) : <p className="text-sm text-muted-foreground">Add more data to receive insights.</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <HandCoins className="h-4 w-4" /> Tithes (month)
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{formatCurrency(breakdown.tithe, currency)}</div>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="h-4 w-4" /> Portfolio
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">
            {formatCurrency((investments.data ?? []).reduce((s, i) => s + Number(i.current_value), 0), currency)}
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Active goals</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{goals.data?.length ?? 0}</div>
        </div>
      </div>
    </div>
  );
}

function Score({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-semibold tabular-nums">
        {value}
        <span className="text-base font-normal text-muted-foreground">{suffix}</span>
      </div>
    </div>
  );
}
