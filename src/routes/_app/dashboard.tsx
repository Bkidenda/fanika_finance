import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  useProfile, useDeductions, useBudgets, useExpenses, useInvestments, useGoals,
  useDevotional, useAccounts, useDebts, useIsMonthClosed, useIncomeEntries,
  useMonthClosures, previousPeriod,
} from "@/lib/queries";
import { computeBreakdown, healthScore, computeNetWorth } from "@/lib/finance";
import { formatCurrency, monthLabel, monthKey } from "@/lib/format";
import { StatCard } from "@/components/stat-card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wallet, TrendingUp, HandCoins, Target, Sparkles, BookOpen, Scale, Lock, CheckCircle2, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { closeMonth } from "@/lib/close-month.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

function Dashboard() {
  const profile = useProfile();
  const deductions = useDeductions();
  const budgets = useBudgets();
  const expenses = useExpenses();
  const investments = useInvestments();
  const goals = useGoals();
  const devo = useDevotional();
  const accounts = useAccounts();
  const debts = useDebts();
  const incomeEntries = useIncomeEntries();
  const closures = useMonthClosures();
  const period = monthKey().slice(0, 7);
  const prev = previousPeriod(period);
  const isClosed = useIsMonthClosed(period);
  const prevClosed = (closures.data ?? []).some((c) => c.period === prev);
  const qc = useQueryClient();
  const closeFn = useServerFn(closeMonth);
  const [closing, setClosing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [closePrev, setClosePrev] = useState(false);

  const currency = profile.data?.currency ?? "KES";
  const titheEnabled = !!profile.data?.tithe_enabled;
  const titheRate = profile.data?.tithe_rate ?? 0.10;

  const receivedIncome = (incomeEntries.data ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const breakdown = computeBreakdown(receivedIncome, deductions.data ?? [], { titheEnabled, titheRate });

  const spendByCat = new Map<string, number>();
  (expenses.data ?? []).forEach((e) => {
    spendByCat.set(e.category, (spendByCat.get(e.category) ?? 0) + Number(e.amount));
  });
  const totalSpent = Array.from(spendByCat.values()).reduce((s, v) => s + v, 0);
  const totalFees = (expenses.data ?? []).reduce((s, e) => s + Number(e.transaction_fee ?? 0), 0);
  const remaining = breakdown.net - breakdown.tithe - breakdown.custom - totalSpent - totalFees;

  const budgetTotal = (budgets.data ?? []).reduce((s, b) => s + Number(b.limit_amount), 0);
  const savingsRate = breakdown.net > 0 ? Math.max(0, remaining) / breakdown.net : 0;
  const givingRate = breakdown.net > 0 ? breakdown.tithe / breakdown.net : 0;
  const adherence = budgetTotal > 0 ? Math.max(0, 1 - Math.max(0, totalSpent - budgetTotal) / budgetTotal) : 1;
  const debtRatio = breakdown.net > 0 ? breakdown.custom / breakdown.net : 0;
  const score = healthScore({ savingsRate, givingRate, budgetAdherence: adherence, debtRatio });

  const portfolioValue = (investments.data ?? []).reduce((s, i) => s + Number(i.current_value), 0);
  const nw = computeNetWorth({
    accounts: accounts.data ?? [],
    investments: investments.data ?? [],
    debts: debts.data ?? [],
  });

  const allocation = (budgets.data ?? []).map((b) => ({ name: b.category, value: Number(b.limit_amount) }));
  const categorySpend = Array.from(spendByCat.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  const COLORS = ["#0e9488", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ec4899", "#14b8a6", "#64748b"];

  async function handleClose(p: string) {
    setClosing(true);
    try {
      await closeFn({ data: { period: p } });
      toast.success(`${p} closed and reconciled`);
      qc.invalidateQueries({ queryKey: ["month-closures"] });
      qc.invalidateQueries({ queryKey: ["budgets"] });
      setConfirm(false);
      setClosePrev(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setClosing(false);
    }
  }

  // Detect: previous month has activity but isn't closed.
  const prevHasActivity = !prevClosed && (closures.data?.length ?? 0) >= 0; // simple cue; real data check below
  // We surface the banner whenever the previous month closure is missing — user can dismiss by closing.

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{monthLabel()}</p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Welcome{profile.data?.full_name ? `, ${profile.data.full_name.split(" ")[0]}` : ""}.
          </h2>
        </div>
        {isClosed ? (
          <div className="flex items-center gap-2 rounded-full bg-success/15 px-3 py-1.5 text-xs font-medium text-success">
            <CheckCircle2 className="h-3.5 w-3.5" /> {period} closed
          </div>
        ) : (
          <Button variant="outline" onClick={() => setConfirm(true)}>
            <Lock className="mr-1 h-4 w-4" /> Close month
          </Button>
        )}
      </div>

      {/* Close-previous-month nudge */}
      {prevHasActivity && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <div>
              <div className="font-medium">Previous month ({prev}) isn't closed yet.</div>
              <div className="text-xs">Close it to lock its reconciliation snapshot. You can reopen and edit it any time from History.</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/history">Review history</Link></Button>
            <Button size="sm" onClick={() => setClosePrev(true)}>Close {prev}</Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          accent
          label="Income received"
          value={formatCurrency(breakdown.net, currency)}
          hint={`${(incomeEntries.data ?? []).length} entries this month`}
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard
          label="Disposable remaining"
          value={formatCurrency(Math.max(0, remaining), currency)}
          hint={remaining < 0 ? `Over by ${formatCurrency(-remaining, currency)}` : (titheEnabled ? "After tithe + spend" : "After spend")}
          icon={<HandCoins className="h-5 w-5" />}
        />
        <StatCard
          label="Net Worth"
          value={formatCurrency(nw.net, currency)}
          hint={`Assets ${formatCurrency(nw.assets, currency)} · Debts ${formatCurrency(nw.liabilities, currency)}`}
          icon={<Scale className="h-5 w-5" />}
        />
        <StatCard
          label="Portfolio Value"
          value={formatCurrency(portfolioValue, currency)}
          hint={`${(investments.data ?? []).length} assets`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {(accounts.data?.length ?? 0) > 0 && (
        <div className="rounded-2xl border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Where your money is</h3>
            <Link to="/accounts" className="text-xs font-medium text-primary hover:underline">Manage accounts</Link>
          </div>
          <p className="text-xs text-muted-foreground">Live balances — auto-updated by every income, expense and debt payment.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(accounts.data ?? []).map((a) => (
              <div key={a.id} className="rounded-xl border p-3">
                <div className="text-xs text-muted-foreground capitalize">{a.type}{a.institution ? ` · ${a.institution}` : ""}</div>
                <div className="mt-0.5 text-sm font-medium">{a.name}</div>
                <div className="mt-1 text-lg font-semibold tabular-nums">{formatCurrency(Number(a.balance), currency)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Financial Health</div>
              <div className="mt-1 text-3xl font-semibold tabular-nums">{score}<span className="text-base text-muted-foreground"> / 100</span></div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Metric label="Total income" value={formatCurrency(breakdown.net, currency)} />
            {titheEnabled && <Metric label={`Tithe (${Math.round(titheRate * 100)}%)`} value={formatCurrency(breakdown.tithe, currency)} />}
            <Metric label="Spent" value={formatCurrency(totalSpent, currency)} />
            <Metric label="Disposable" value={formatCurrency(Math.max(0, remaining), currency)} />
          </div>
        </div>

        <div className="rounded-2xl border bg-gradient-hero p-6 text-primary-foreground shadow-elevated">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-80">
            <BookOpen className="h-4 w-4" />
            Today's stewardship
          </div>
          {devo.data ? (
            <>
              <p className="mt-3 text-sm leading-relaxed italic">"{devo.data.verse}"</p>
              <p className="mt-1 text-xs opacity-80">— {devo.data.verse_reference}</p>
              <p className="mt-4 text-sm leading-relaxed opacity-90">"{devo.data.egw_quote}"</p>
              {devo.data.egw_source && <p className="mt-1 text-[11px] opacity-70">— {devo.data.egw_source}</p>}
              <Link to="/stewardship" className="mt-4 inline-block text-xs font-medium underline opacity-90">Open devotional →</Link>
            </>
          ) : (
            <p className="mt-3 text-sm opacity-80">Loading today's reflection…</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6 shadow-card">
          <h3 className="font-semibold">Budget allocation</h3>
          <p className="text-xs text-muted-foreground">{monthLabel()}</p>
          <div className="mt-4 h-64">
            {allocation.length ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={allocation} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {allocation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyState label="No budgets yet" to="/budgets" cta="Create budgets" />}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-card">
          <h3 className="font-semibold">Top spending categories</h3>
          <p className="text-xs text-muted-foreground">{monthLabel()}</p>
          <div className="mt-4 h-64">
            {categorySpend.length ? (
              <ResponsiveContainer>
                <BarChart data={categorySpend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0.012 230)" />
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                  <Bar dataKey="amount" fill="oklch(0.52 0.12 175)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState label="No expenses logged" to="/expenses" cta="Add expenses" />}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Budget progress</h3>
          <Link to="/budgets" className="text-xs font-medium text-primary hover:underline">Manage</Link>
        </div>
        {budgets.data?.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {budgets.data.map((b) => {
              const spent = spendByCat.get(b.category) ?? 0;
              const pct = b.limit_amount > 0 ? Math.min(100, (spent / b.limit_amount) * 100) : 0;
              const over = spent > b.limit_amount;
              return (
                <div key={b.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{b.category}</span>
                    <span className={over ? "text-destructive" : "text-muted-foreground"}>
                      {formatCurrency(spent, currency)} / {formatCurrency(b.limit_amount, currency)}
                    </span>
                  </div>
                  <Progress value={pct} />
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState className="mt-4" label="No budgets set up yet" to="/budgets" cta="Set up budgets" />
        )}
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Savings goals</h3>
          <Link to="/goals" className="text-xs font-medium text-primary hover:underline">Manage</Link>
        </div>
        {goals.data?.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {goals.data.slice(0, 3).map((g) => {
              const pct = g.target_amount > 0 ? Math.min(100, (g.current_amount / g.target_amount) * 100) : 0;
              return (
                <div key={g.id} className="rounded-xl border p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Target className="h-4 w-4 text-primary" />
                    {g.name}
                  </div>
                  <div className="mt-2 text-lg font-semibold tabular-nums">
                    {formatCurrency(g.current_amount, currency)}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">/ {formatCurrency(g.target_amount, currency)}</span>
                  </div>
                  <Progress value={pct} className="mt-3" />
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState className="mt-4" label="No goals yet" to="/goals" cta="Create a goal" />
        )}
      </div>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Close {period}?</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <p>This locks the current month and produces a reconciliation snapshot. {period} will be archived and protected from edits. Next month auto-opens with your recurring budget lines pre-filled.</p>
            <div className="rounded-xl border bg-secondary/50 p-3 text-xs">
              <div className="flex justify-between"><span>Net income</span><span className="font-medium tabular-nums">{formatCurrency(breakdown.net, currency)}</span></div>
              <div className="flex justify-between"><span>Total spend</span><span className="font-medium tabular-nums">{formatCurrency(totalSpent, currency)}</span></div>
              {titheEnabled && <div className="flex justify-between"><span>Tithe set aside</span><span className="font-medium tabular-nums">{formatCurrency(breakdown.tithe, currency)}</span></div>}
              <div className="flex justify-between"><span>Net worth</span><span className="font-medium tabular-nums">{formatCurrency(nw.net, currency)}</span></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setConfirm(false)} disabled={closing}>Cancel</Button>
              <Button onClick={() => handleClose(period)} disabled={closing}>{closing ? "Closing…" : "Confirm close"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={closePrev} onOpenChange={setClosePrev}>
        <DialogContent>
          <DialogHeader><DialogTitle>Close {prev}?</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <p>Generate the reconciliation snapshot for {prev} and lock it. You can always reopen and edit it later from the History page — that won't affect this month.</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setClosePrev(false)} disabled={closing}>Cancel</Button>
              <Button onClick={() => handleClose(prev)} disabled={closing}>{closing ? "Closing…" : `Close ${prev}`}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function EmptyState({ label, to, cta, className = "" }: { label: string; to: string; cta: string; className?: string }) {
  return (
    <div className={`flex h-full flex-col items-center justify-center rounded-xl border border-dashed py-8 text-center ${className}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <Link to={to} className="mt-2 text-sm font-medium text-primary hover:underline">{cta} →</Link>
    </div>
  );
}
