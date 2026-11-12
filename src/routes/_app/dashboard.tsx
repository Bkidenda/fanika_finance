import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  useProfile, useBudgets, useExpenses, useGoals, useDevotional, useAccounts,
  useAllExpenses, useAllIncomeEntries, useMonthClosures, useIsMonthClosed,
} from "@/lib/queries";
import { computeDashboard } from "@/lib/services/dashboard";
import { formatCurrency, monthKey, monthLabel } from "@/lib/format";
import { SectionLabel } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Lock, Sparkles, Plus, Landmark, Target, ArrowRight } from "lucide-react";
import { closeMonth } from "@/lib/close-month.functions";
import { toast } from "sonner";
import { usePendingCount } from "@/lib/pending";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Home — Fanika" },
      { name: "description", content: "Your money at a glance: balance, suggestions from your messages, streaks and today's reflection." },
      { property: "og:title", content: "Home — Fanika" },
      { property: "og:description", content: "See every shilling in one calm place — balance, budgets and suggestions in one glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const TIERS = [
  { name: "Seed", days: 3 },
  { name: "Sprout", days: 7 },
  { name: "Seedling", days: 14 },
  { name: "Sapling", days: 21 },
  { name: "Tree", days: 30 },
];

function Dashboard() {
  const profile = useProfile();
  const budgets = useBudgets();
  const expenses = useExpenses();
  const accounts = useAccounts();
  const goals = useGoals();
  const devo = useDevotional();
  const allExpenses = useAllExpenses();
  const allIncome = useAllIncomeEntries();
  const closures = useMonthClosures();
  const pendingCount = usePendingCount();
  const isClosed = useIsMonthClosed(monthKey().slice(0, 7));

  const currency = profile.data?.currency ?? "KES";
  const firstName = profile.data?.full_name?.split(" ")[0] || profile.data?.username || "there";
  const initial = (profile.data?.full_name || profile.data?.username || firstName).charAt(0).toUpperCase();

  const m = useMemo(
    () =>
      computeDashboard({
        incomeEntries: allIncome.data ?? [],
        expenses: expenses.data ?? [],
        budgets: budgets.data ?? [],
        accounts: accounts.data ?? [],
        debts: [],
        investments: [],
        goals: goals.data ?? [],
        subscriptions: [],
        deductions: [],
        allExpenses: allExpenses.data ?? [],
        allIncome: allIncome.data ?? [],
        titheEnabled: false,
        titheRate: 0,
        period: monthKey().slice(0, 7),
      }),
    [allIncome.data, expenses.data, budgets.data, accounts.data, goals.data, allExpenses.data],
  );

  const streak = useMemo(() => loggingStreak(allExpenses.data ?? [], allIncome.data ?? []), [allExpenses.data, allIncome.data]);

  const today = new Date();
  const dateLine = today.toLocaleDateString("en", { weekday: "long", day: "numeric", month: "long" });

  const [confirmClose, setConfirmClose] = useState(false);
  const [closing, setClosing] = useState(false);
  const closeFn = useServerFn(closeMonth);
  const qc = useQueryClient();

  async function handleClose() {
    setClosing(true);
    try {
      await closeFn({ data: { period: monthKey().slice(0, 7) } });
      toast.success("Month closed and reconciled");
      qc.invalidateQueries({ queryKey: ["month-closures"] });
      qc.invalidateQueries({ queryKey: ["budgets"] });
      setConfirmClose(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setClosing(false);
    }
  }

  let tierIdx = -1;
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (streak >= TIERS[i].days) { tierIdx = i; break; }
  }
  const tier = tierIdx >= 0 ? TIERS[tierIdx] : TIERS[0];
  const next = TIERS[tierIdx + 1];
  const tierPct = next ? Math.min(100, Math.round((streak / next.days) * 100)) : 100;

  return (
    <div className="space-y-4">
      {/* Greeting */}
      <header className="flex items-start justify-between gap-3 pt-1">
        <div>
          <p className="text-[13px] text-muted-foreground">{dateLine}</p>
          <h1 className="font-display text-[30px] leading-tight">Habari, {firstName}</h1>
        </div>
        <Link to="/settings" aria-label="My profile" className="shrink-0">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-warning text-lg font-bold text-warning-foreground">
            {initial}
          </span>
        </Link>
      </header>

      {/* Balance hero */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-hero p-5 text-white shadow-elevated">
        <div className="pointer-events-none absolute inset-0 opacity-[0.14]" style={{ backgroundImage: "radial-gradient(circle at center, white 1.5px, transparent 1.5px)", backgroundSize: "26px 26px" }} aria-hidden />
        <svg className="pointer-events-none absolute bottom-6 left-0 right-0 h-8 w-full opacity-80" viewBox="0 0 320 32" fill="none" preserveAspectRatio="none" aria-hidden>
          <path d="M2 22 C 40 10, 70 26, 110 18 S 190 8, 230 16 S 300 6, 318 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <SectionLabel>
          <span className="text-white/70">Total cash balance</span>
        </SectionLabel>
        <div className="mt-1 font-display text-[38px] leading-none">{formatCurrency(m.liquid, currency)}</div>
        <p className="mt-3 text-sm text-white/85">
          {m.cashFlow >= 0 ? "Up" : "Down"} {formatCurrency(Math.abs(m.cashFlow), currency)} this month
        </p>
        <p className="mt-0.5 text-sm text-white/85">
          Net worth {formatCurrency(m.netWorth.net, currency)} · Spent {formatCurrency(m.spent + m.fees, currency)}
        </p>
      </section>

      {/* Review suggestions */}
      <Link to="/review" className="block rounded-3xl border border-primary/15 bg-card p-4 shadow-card transition active:scale-[0.99]">
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="rounded-full bg-warning/25 px-3 py-1 text-xs font-bold text-warning-foreground">
              {pendingCount} to review
            </span>
          )}
          <span className="text-xs font-semibold text-primary">Review →</span>
        </div>
        <h2 className="mt-2 text-[17px] font-bold leading-snug">Suggested from your messages</h2>
        <p className="text-[13px] text-muted-foreground">
          {pendingCount > 0 ? "Confirm to update your budgets" : "Paste an M-PESA, Airtel or bank alert to create a draft."}
        </p>
      </Link>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2.5">
        <QuickPill to="/transactions" icon={<Plus className="h-4 w-4" />} label="Add" />
        <QuickPill to="/accounts" icon={<Landmark className="h-4 w-4" />} label="Accounts" />
        <QuickPill to="/goals" icon={<Target className="h-4 w-4" />} label="Goals" />
      </div>

      {/* Streak */}
      <section className="rounded-3xl bg-card p-4 shadow-card">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-xl leading-tight">Your {tier.name.toLowerCase()} is growing</h2>
            <p className="text-[13px] text-muted-foreground">
              {streak}-day logging streak
              {next ? `. ${next.days - streak} more ${next.days - streak === 1 ? "day" : "days"} to reach ${next.name}.` : "."}
            </p>
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(6, tierPct)}%` }} />
        </div>
      </section>

      {/* Reflection */}
      <section className="rounded-3xl bg-primary-subtle/70 p-4">
        <SectionLabel>Today's reflection</SectionLabel>
        {devo.data ? (
          <>
            <h2 className="mt-1.5 font-display text-xl leading-snug">{devo.data.verse_reference}</h2>
            <p className="mt-1 text-[14px] leading-relaxed text-foreground/85">"{devo.data.verse}"</p>
            <Button asChild variant="secondary" className="mt-3 rounded-full bg-accent text-accent-foreground hover:bg-accent/80">
              <Link to="/stewardship">Write a line</Link>
            </Button>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Loading today's reflection…</p>
        )}
      </section>

      {/* Month status */}
      <section className="rounded-3xl bg-card p-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <SectionLabel>{monthLabel()}</SectionLabel>
            <p className="mt-1 text-[14px] font-semibold">
              {isClosed ? "Month closed and reconciled" : `Budget used ${m.budgetTotal > 0 ? Math.round(m.budgetUsedPct) : 0}%`}
            </p>
            {m.budgetTotal > 0 && !isClosed && (
              <p className="text-[13px] text-muted-foreground">
                {formatCurrency(m.spent + m.fees, currency)} of {formatCurrency(m.budgetTotal, currency)}
              </p>
            )}
          </div>
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => setConfirmClose(true)} disabled={isClosed}>
            <Lock className="mr-1 h-3.5 w-3.5" /> {isClosed ? "Closed" : "Close month"}
          </Button>
        </div>
        <Link to="/budgets" className="mt-3 flex items-center justify-between rounded-2xl bg-muted/60 px-3.5 py-2.5 text-[13px] font-semibold text-primary">
          See budgets <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <Dialog open={confirmClose} onOpenChange={setConfirmClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close {monthLabel()}?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p>This locks the month and produces a reconciliation snapshot. Next month auto-opens with your recurring budget lines pre-filled.</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmClose(false)} disabled={closing}>Cancel</Button>
              <Button onClick={() => handleClose()} disabled={closing}>{closing ? "Closing…" : "Confirm close"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuickPill({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-center gap-1.5 rounded-2xl bg-secondary py-3 text-[15px] font-semibold text-secondary-foreground transition active:scale-[0.97]"
    >
      {icon}
      {label}
    </Link>
  );
}

/** Consecutive days (ending today or yesterday) with at least one logged entry. */
function loggingStreak(expenses: { date: string }[], income: { date: string }[]): number {
  const days = new Set<string>();
  for (const e of [...expenses, ...income]) {
    if (e.date) days.add(e.date.slice(0, 10));
  }
  if (days.size === 0) return 0;
  const d = new Date();
  const key = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  let streak = 0;
  if (!days.has(key(d))) {
    d.setDate(d.getDate() - 1);
    if (!days.has(key(d))) return 0;
  }
  while (days.has(key(d))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
