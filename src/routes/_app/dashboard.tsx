import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  useProfile, useDeductions, useBudgets, useExpenses, useInvestments, useGoals,
  useDevotional, useAccounts, useDebts, useIsMonthClosed, useIncomeEntries,
  useMonthClosures, useSubscriptions, useAllExpenses, useAllIncomeEntries, previousPeriod,
} from "@/lib/queries";
import { computeDashboard } from "@/lib/services/dashboard";
import { healthScoreBand } from "@/lib/finance";
import { formatCurrency, monthLabel, monthKey } from "@/lib/format";
import { chartColorByRank, SERIES_COLORS, CHART_GRID_STROKE, CHART_AXIS_TICK } from "@/lib/chart-colors";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Wallet, HandCoins, Target, Sparkles, BookOpen, Scale, Lock, CheckCircle2,
  AlertTriangle, ArrowRight, CalendarClock, Activity, TrendingUp, Info,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
  AreaChart, Area, Legend, BarChart, Bar,
} from "recharts";
import { closeMonth } from "@/lib/close-month.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

function Dashboard() {
  const profile = useProfile();
  const deductions = useDeductions();
  const budgets = useBudgets();
  const expenses = useExpenses();
  const allExpenses = useAllExpenses();
  const allIncome = useAllIncomeEntries();
  const investments = useInvestments();
  const goals = useGoals();
  const devo = useDevotional();
  const accounts = useAccounts();
  const debts = useDebts();
  const subscriptions = useSubscriptions();
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

  const m = useMemo(
    () => computeDashboard({
      incomeEntries: incomeEntries.data ?? [],
      expenses: expenses.data ?? [],
      budgets: budgets.data ?? [],
      accounts: accounts.data ?? [],
      debts: debts.data ?? [],
      investments: investments.data ?? [],
      goals: goals.data ?? [],
      subscriptions: subscriptions.data ?? [],
      deductions: deductions.data ?? [],
      allExpenses: allExpenses.data ?? [],
      allIncome: allIncome.data ?? [],
      titheEnabled: !!profile.data?.tithe_enabled,
      titheRate: profile.data?.tithe_rate ?? 0.1,
      period,
    }),
    [incomeEntries.data, expenses.data, budgets.data, accounts.data, debts.data,
     investments.data, goals.data, subscriptions.data, deductions.data,
     allExpenses.data, allIncome.data, profile.data, period],
  );

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

  const band = m.score != null ? healthScoreBand(m.score) : null;

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{monthLabel()}</p>
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">
            Welcome{profile.data?.full_name ? `, ${profile.data.full_name.split(" ")[0]}` : ""}.
          </h2>
        </div>
        {isClosed ? (
          <div className="flex items-center gap-2 rounded-full bg-success/15 px-3 py-1.5 text-xs font-semibold text-success">
            <CheckCircle2 className="h-3.5 w-3.5" /> {period} closed
          </div>
        ) : (
          <Button variant="outline" onClick={() => setConfirm(true)}>
            <Lock className="mr-1 h-4 w-4" /> Close month
          </Button>
        )}
      </div>

      {!prevClosed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent bg-accent/60 p-4 text-sm text-accent-foreground">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <div>
              <div className="font-semibold">Previous month ({prev}) isn't closed yet.</div>
              <div className="text-xs opacity-90">Close it to lock its reconciliation snapshot. You can reopen and edit it any time from History.</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/history">Review history</Link></Button>
            <Button size="sm" onClick={() => setClosePrev(true)}>Close {prev}</Button>
          </div>
        </div>
      )}

      {/* Executive summary tiles */}
      <div className="grid grid-cols-2 gap-2.5 md:gap-4 lg:grid-cols-5">
        <Tile
          label="Net worth"
          value={formatCurrency(m.netWorth.net, currency)}
          hint={`Assets ${formatCurrency(m.netWorth.assets, currency)}`}
          icon={<Scale className="h-4 w-4" />}
          emphasis
        />
        <Tile
          label="Monthly cash flow"
          value={formatCurrency(m.cashFlow, currency)}
          hint={m.cashFlow >= 0 ? "Retained this month" : "Spending exceeds income"}
          icon={<HandCoins className="h-4 w-4" />}
          tone={m.cashFlow >= 0 ? "success" : "destructive"}
        />
        <Tile
          label="Savings rate"
          value={`${Math.round(m.savingsRate * 100)}%`}
          hint={`Target 20% · income ${formatCurrency(m.income, currency)}`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <Tile
          label="Financial health"
          value={m.score != null ? `${m.score}/100` : "—"}
          hint={band ? band.label : "Complete your profile"}
          icon={<Activity className="h-4 w-4" />}
          tone={band?.tone === "destructive" ? "destructive" : band?.tone === "warning" ? "warning" : band ? "success" : undefined}
        />
        <Tile
          label="Budget performance"
          value={m.budgetTotal > 0 ? `${Math.round(m.budgetUsedPct)}%` : "—"}
          hint={m.budgetTotal > 0 ? `${formatCurrency(m.spent, currency)} of ${formatCurrency(m.budgetTotal, currency)}` : "No budgets yet"}
          icon={<Wallet className="h-4 w-4" />}
          tone={m.budgetUsedPct > 100 ? "destructive" : m.budgetUsedPct > 85 ? "warning" : undefined}
        />
      </div>

      {/* Health score detail / onboarding */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-card lg:col-span-2 md:p-6">
          {m.score == null ? (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Info className="h-4 w-4" /> Financial health
              </div>
              <h3 className="mt-2 text-lg">Complete your financial profile</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your score appears once there is enough to measure. Still to do: {m.missing.join(", ")}.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm"><Link to="/income-entries">Record income</Link></Button>
                <Button asChild size="sm" variant="outline"><Link to="/accounts">Add accounts</Link></Button>
                <Button asChild size="sm" variant="outline"><Link to="/expenses">Log expenses</Link></Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Financial health</div>
                  <div className="mt-1 text-3xl font-bold tabular-nums">
                    {m.score}<span className="text-base font-medium text-muted-foreground"> / 100</span>
                  </div>
                  <div className={`mt-1 text-xs font-semibold ${
                    band!.tone === "success" ? "text-success"
                    : band!.tone === "info" ? "text-info"
                    : band!.tone === "warning" ? "text-warning" : "text-destructive"}`}>
                    {band!.label}
                  </div>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
              <Progress value={m.score} className="mt-4" />
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                <Metric label="Savings rate" value={`${Math.round(m.savingsRate * 100)}%`} />
                <Metric label="Budget adherence" value={`${Math.round(m.adherence * 100)}%`} />
                <Metric label="Debt service" value={`${Math.round(m.debtRatio * 100)}%`} />
                <Metric label="Liquidity" value={`${m.liquidityMonths.toFixed(1)} mo`} />
              </div>
            </>
          )}

          {m.insights.length > 0 && (
            <div className="mt-5 space-y-2 border-t pt-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI insights</div>
              {m.insights.map((ins, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 rounded-xl border p-2.5 text-xs ${
                    ins.tone === "success" ? "border-success/30 bg-success/10 text-success"
                    : ins.tone === "warning" ? "border-warning/30 bg-warning/10 text-warning"
                    : "border-info/30 bg-info/10 text-info"}`}
                >
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="font-medium leading-relaxed">{ins.text}</span>
                </div>
              ))}
              <Link to="/advisor" className="inline-flex items-center gap-1 pt-1 text-xs font-semibold text-primary hover:underline">
                Ask the AI advisor <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-gradient-hero p-5 text-primary-foreground shadow-elevated md:p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest opacity-80">
            <BookOpen className="h-4 w-4" /> Today's money insight
          </div>
          {devo.data ? (
            <>
              <p className="mt-3 text-sm italic leading-relaxed">"{devo.data.verse}"</p>
              <p className="mt-1 text-xs opacity-80">— {devo.data.verse_reference}</p>
              <p className="mt-4 text-sm leading-relaxed opacity-90">"{devo.data.egw_quote}"</p>
              {devo.data.egw_source && <p className="mt-1 text-[11px] opacity-70">— {devo.data.egw_source}</p>}
              <Link to="/stewardship" className="mt-4 inline-block text-xs font-semibold underline opacity-90">Open daily insights →</Link>
            </>
          ) : (
            <p className="mt-3 text-sm opacity-80">Loading today's reflection…</p>
          )}
        </div>
      </div>

      {/* Balances rail — the only horizontal scroller in the app */}
      {(accounts.data?.length ?? 0) > 0 && (
        <div className="rounded-2xl border bg-card p-3.5 shadow-card md:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold md:text-base">Where your money is</h3>
            <Link to="/accounts" className="text-xs font-semibold text-primary hover:underline">Manage</Link>
          </div>
          <p className="text-[11px] text-muted-foreground md:text-xs">
            Liquid {formatCurrency(m.liquid, currency)} · live balances
          </p>
          <div className="-mx-3.5 mt-3 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-3.5 pb-1 md:mx-0 md:px-0">
            {(accounts.data ?? []).map((a) => (
              <div key={a.id} className="min-w-[58%] shrink-0 snap-start rounded-xl border bg-gradient-surface p-3 md:min-w-[220px]">
                <div className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{a.type}</div>
                <div className="mt-0.5 truncate text-xs font-medium">{a.name}</div>
                <div className="mt-1 truncate text-base font-bold tabular-nums">{formatCurrency(Number(a.balance), currency)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend */}
      <div className="rounded-2xl border bg-card p-4 shadow-card md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold md:text-base">Income, spending & savings</h3>
            <p className="text-[11px] text-muted-foreground md:text-xs">Last 6 months</p>
          </div>
          <Link to="/statements" className="text-xs font-semibold text-primary hover:underline">Reports</Link>
        </div>
        <div className="mt-4 h-60 w-full md:h-72">
          <ResponsiveContainer>
            <AreaChart data={m.trend} margin={{ left: -18, right: 6, top: 6, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID_STROKE} />
              <XAxis dataKey="month" tick={CHART_AXIS_TICK} />
              <YAxis tick={CHART_AXIS_TICK} width={64} tickFormatter={(v: number) => Intl.NumberFormat(undefined, { notation: "compact" }).format(v)} />
              <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="income" stroke={SERIES_COLORS.income} fill={SERIES_COLORS.income} fillOpacity={0.15} strokeWidth={2} />
              <Area type="monotone" dataKey="spending" stroke={SERIES_COLORS.spending} fill={SERIES_COLORS.spending} fillOpacity={0.12} strokeWidth={2} />
              <Area type="monotone" dataKey="savings" stroke={SERIES_COLORS.savings} fill={SERIES_COLORS.savings} fillOpacity={0.12} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-4 shadow-card md:p-6">
          <h3 className="text-sm font-bold md:text-base">Budget allocation</h3>
          <p className="text-[11px] text-muted-foreground md:text-xs">{monthLabel()}</p>
          <div className="mt-4 h-60 w-full">
            {m.allocation.length ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={m.allocation} dataKey="value" nameKey="name" innerRadius={48} outerRadius={86} paddingAngle={2}>
                    {m.allocation.map((_, i) => <Cell key={i} fill={chartColorByRank(i)} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyState label="No budgets yet" to="/budgets" cta="Create budgets" />}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-card md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold md:text-base">Budget vs actual</h3>
              <p className="text-[11px] text-muted-foreground md:text-xs">Largest categories this month</p>
            </div>
            <Link to="/budgets" className="text-xs font-semibold text-primary hover:underline">Manage</Link>
          </div>
          <div className="mt-4 h-60 w-full">
            {m.budgetVsActual.length ? (
              <ResponsiveContainer>
                <BarChart data={m.budgetVsActual} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                  <CartesianGrid horizontal={false} stroke={CHART_GRID_STROKE} />
                  <XAxis type="number" tick={CHART_AXIS_TICK} tickFormatter={(v: number) => Intl.NumberFormat(undefined, { notation: "compact" }).format(v)} />
                  <YAxis type="category" dataKey="name" width={92} tick={CHART_AXIS_TICK} />
                  <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="budget" name="Budgeted" fill={chartColorByRank(1)} radius={[0, 6, 6, 0]} barSize={10} />
                  <Bar dataKey="actual" name="Spent" fill={chartColorByRank(0)} radius={[0, 6, 6, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState label="No budget data yet" to="/budgets" cta="Create budgets" />}
          </div>
        </div>

      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-4 shadow-card md:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold md:text-base">Savings goals</h3>
            <Link to="/goals" className="text-xs font-semibold text-primary hover:underline">Manage</Link>
          </div>
          {m.goals.length ? (
            <div className="mt-4 space-y-4">
              {m.goals.map((g) => (
                <div key={g.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-medium"><Target className="h-3.5 w-3.5 text-primary" />{g.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatCurrency(g.current, currency)} / {formatCurrency(g.target, currency)}
                    </span>
                  </div>
                  <Progress value={g.pct} className="mt-2" />
                </div>
              ))}
            </div>
          ) : <div className="mt-4"><EmptyState label="No goals yet" to="/goals" cta="Create a goal" /></div>}
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-card md:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold md:text-base">Recent transactions</h3>
            <Link to="/transactions" className="text-xs font-semibold text-primary hover:underline">View all</Link>
          </div>
          {(expenses.data?.length ?? 0) + (incomeEntries.data?.length ?? 0) > 0 ? (
            <ul className="mt-3 divide-y">
              {[
                ...(incomeEntries.data ?? []).map((e) => ({ id: e.id, date: e.date, label: e.source, amount: Number(e.amount), kind: "in" as const })),
                ...(expenses.data ?? []).map((e) => ({ id: e.id, date: e.date, label: e.description || e.category, amount: Number(e.amount), kind: "out" as const })),
              ]
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 5)
                .map((t) => (
                  <li key={`${t.kind}-${t.id}`} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{t.label}</div>
                      <div className="text-[11px] text-muted-foreground">{t.date}</div>
                    </div>
                    <div className={`shrink-0 text-sm font-semibold tabular-nums ${t.kind === "in" ? "text-success" : "text-foreground"}`}>
                      {t.kind === "in" ? "+" : "−"}{formatCurrency(t.amount, currency)}
                    </div>
                  </li>
                ))}
            </ul>
          ) : <div className="mt-4"><EmptyState label="Nothing logged yet" to="/transactions" cta="Add a transaction" /></div>}
        </div>
      </div>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Close {period}?</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <p>This locks the current month and produces a reconciliation snapshot. Next month auto-opens with your recurring budget lines pre-filled.</p>
            <div className="rounded-xl border bg-muted/60 p-3 text-xs">
              <Row label="Income" value={formatCurrency(m.income, currency)} />
              <Row label="Total spend" value={formatCurrency(m.spent + m.fees, currency)} />
              <Row label="Cash flow" value={formatCurrency(m.cashFlow, currency)} />
              <Row label="Net worth" value={formatCurrency(m.netWorth.net, currency)} />
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
            <p>Generate the reconciliation snapshot for {prev} and lock it. You can reopen and edit it later from History — that won't affect this month.</p>
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

function Tile({ label, value, hint, icon, emphasis, tone }: {
  label: string; value: string; hint?: string;
  icon: React.ReactNode; emphasis?: boolean;
  tone?: "success" | "warning" | "destructive";
}) {
  const toneClass =
    tone === "success" ? "text-success"
    : tone === "warning" ? "text-warning"
    : tone === "destructive" ? "text-destructive"
    : "";
  return (
    <div className={`card-hover rounded-2xl border p-3 shadow-card md:p-4 ${emphasis ? "bg-gradient-primary text-primary-foreground" : "bg-card"}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[10px] font-semibold uppercase tracking-wide md:text-[11px] ${emphasis ? "opacity-85" : "text-muted-foreground"}`}>{label}</span>
        <span className={emphasis ? "opacity-85" : "text-muted-foreground"}>{icon}</span>
      </div>
      <div className={`mt-1.5 truncate text-lg font-bold tabular-nums md:text-xl ${emphasis ? "" : toneClass}`}>{value}</div>
      {hint && <div className={`mt-0.5 truncate text-[10px] md:text-[11px] ${emphasis ? "opacity-80" : "text-muted-foreground"}`}>{hint}</div>}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-base font-bold tabular-nums md:text-lg">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5">
      <span>{label}</span><span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function EmptyState({ label, to, cta, className = "" }: { label: string; to: string; cta: string; className?: string }) {
  return (
    <div className={`flex h-full flex-col items-center justify-center rounded-xl border border-dashed py-8 text-center ${className}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <Link to={to} className="mt-2 text-sm font-semibold text-primary hover:underline">{cta} →</Link>
    </div>
  );
}
