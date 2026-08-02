// Pure derivation layer for the executive dashboard.
// No React, no data fetching — components stay presentational.

import { computeBreakdown, computeNetWorth, healthScore, healthScoreReadiness } from "@/lib/finance";
import type { Account, Budget, Debt, Deduction, Expense, Goal, IncomeEntry, Investment, Subscription } from "@/lib/queries";

const LIQUID_TYPES = new Set(["bank", "mpesa", "cash", "sacco"]);

export type DashboardInput = {
  incomeEntries: IncomeEntry[];
  expenses: Expense[];
  budgets: Budget[];
  accounts: Account[];
  debts: Debt[];
  investments: Investment[];
  goals: Goal[];
  subscriptions: Subscription[];
  deductions: Deduction[];
  titheEnabled: boolean;
  titheRate: number;
  /** All-time expenses, used for the trend chart. */
  allExpenses: Expense[];
  /** All-time income entries, used for the trend chart. */
  allIncome: IncomeEntry[];
  period: string; // YYYY-MM
};

export type TrendPoint = { month: string; income: number; spending: number; savings: number };

export type DashboardMetrics = {
  currencyBase: number;
  income: number;
  tithe: number;
  spent: number;
  fees: number;
  cashFlow: number;
  savingsRate: number;
  givingRate: number;
  liquid: number;
  liquidityMonths: number;
  budgetTotal: number;
  budgetUsedPct: number;
  adherence: number;
  debtRatio: number;
  netWorth: { assets: number; liabilities: number; net: number };
  score: number | null;
  missing: string[];
  spendByCategory: { name: string; value: number }[];
  allocation: { name: string; value: number }[];
  trend: TrendPoint[];
  upcomingBills: { id: string; name: string; amount: number; due: string }[];
  goals: { id: string; name: string; current: number; target: number; pct: number }[];
  insights: { tone: "success" | "warning" | "info"; text: string }[];
};

function monthOf(dateIso: string) {
  return dateIso.slice(0, 7);
}

export function computeDashboard(i: DashboardInput): DashboardMetrics {
  const income = i.incomeEntries.reduce((s, e) => s + Number(e.amount), 0);
  const breakdown = computeBreakdown(income, i.deductions, {
    titheEnabled: i.titheEnabled,
    titheRate: i.titheRate,
  });

  const byCat = new Map<string, number>();
  i.expenses.forEach((e) => byCat.set(e.category, (byCat.get(e.category) ?? 0) + Number(e.amount)));
  const spent = Array.from(byCat.values()).reduce((s, v) => s + v, 0);
  const fees = i.expenses.reduce((s, e) => s + Number(e.transaction_fee ?? 0), 0);

  const cashFlow = income - breakdown.tithe - breakdown.custom - spent - fees;
  const savingsRate = income > 0 ? Math.max(0, cashFlow) / income : 0;
  const givingRate = income > 0 ? breakdown.tithe / income : 0;

  const liquid = i.accounts
    .filter((a) => LIQUID_TYPES.has(a.type))
    .reduce((s, a) => s + Number(a.balance), 0);
  const monthlyBurn = spent + fees;
  const liquidityMonths = monthlyBurn > 0 ? liquid / monthlyBurn : liquid > 0 ? 3 : 0;

  const budgetTotal = i.budgets.reduce((s, b) => s + Number(b.limit_amount), 0);
  const budgetUsedPct = budgetTotal > 0 ? (spent / budgetTotal) * 100 : 0;
  const adherence = budgetTotal > 0 ? Math.max(0, 1 - Math.max(0, spent - budgetTotal) / budgetTotal) : 0;
  const debtService = i.debts.reduce((s, d) => s + Number(d.monthly_payment ?? 0), 0);
  const debtRatio = income > 0 ? debtService / income : 0;

  const netWorth = computeNetWorth({
    accounts: i.accounts,
    investments: i.investments,
    debts: i.debts,
  });

  const missing = healthScoreReadiness({
    incomeEntries: i.incomeEntries.length,
    accounts: i.accounts.length,
    expenses: i.expenses.length,
  });
  const score = missing.length
    ? null
    : healthScore({ savingsRate, givingRate, budgetAdherence: adherence, debtRatio, liquidityMonths });

  // Last 6 months trend
  const months: string[] = [];
  const [y, m] = i.period.split("-").map(Number);
  for (let k = 5; k >= 0; k--) {
    const d = new Date(Date.UTC(y, m - 1 - k, 1));
    months.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  const trend: TrendPoint[] = months.map((mk) => {
    const inc = i.allIncome.filter((e) => monthOf(e.date) === mk).reduce((s, e) => s + Number(e.amount), 0);
    const sp = i.allExpenses
      .filter((e) => monthOf(e.date) === mk)
      .reduce((s, e) => s + Number(e.amount) + Number(e.transaction_fee ?? 0), 0);
    return { month: mk.slice(5), income: inc, spending: sp, savings: Math.max(0, inc - sp) };
  });

  const today = new Date().toISOString().slice(0, 10);
  const upcomingBills = i.subscriptions
    .filter((s) => s.active && s.next_charge)
    .filter((s) => (s.next_charge as string) >= today)
    .sort((a, b) => (a.next_charge as string).localeCompare(b.next_charge as string))
    .slice(0, 4)
    .map((s) => ({ id: s.id, name: s.name, amount: Number(s.amount), due: s.next_charge as string }));

  const goals = i.goals.slice(0, 3).map((g) => ({
    id: g.id,
    name: g.name,
    current: Number(g.current_amount),
    target: Number(g.target_amount),
    pct: g.target_amount > 0 ? Math.min(100, (g.current_amount / g.target_amount) * 100) : 0,
  }));

  const insights: DashboardMetrics["insights"] = [];
  const prevKey = months[months.length - 2];
  const prevSpend = trend.find((t) => t.month === prevKey?.slice(5))?.spending ?? 0;
  if (prevSpend > 0 && monthlyBurn > 0) {
    const delta = ((monthlyBurn - prevSpend) / prevSpend) * 100;
    if (Math.abs(delta) >= 5) {
      insights.push({
        tone: delta > 0 ? "warning" : "success",
        text: `Spending is ${Math.abs(Math.round(delta))}% ${delta > 0 ? "higher" : "lower"} than last month.`,
      });
    }
  }
  if (budgetTotal > 0 && spent > budgetTotal) {
    insights.push({ tone: "warning", text: `You are over your total budget by ${Math.round(((spent - budgetTotal) / budgetTotal) * 100)}%.` });
  } else if (budgetTotal > 0 && budgetUsedPct > 85) {
    insights.push({ tone: "info", text: `You have used ${Math.round(budgetUsedPct)}% of this month's budget.` });
  }
  if (savingsRate >= 0.2) {
    insights.push({ tone: "success", text: `Strong month — you kept ${Math.round(savingsRate * 100)}% of your income.` });
  } else if (income > 0 && savingsRate < 0.05) {
    insights.push({ tone: "warning", text: "Almost nothing is being retained this month. Review your largest categories." });
  }
  if (liquidityMonths > 0 && liquidityMonths < 1) {
    insights.push({ tone: "warning", text: "Your liquid balances cover under a month of spending. Build a buffer." });
  }
  if (debtRatio > 0.35) {
    insights.push({ tone: "warning", text: `Debt repayments take ${Math.round(debtRatio * 100)}% of your income.` });
  }

  return {
    currencyBase: income,
    income,
    tithe: breakdown.tithe,
    spent,
    fees,
    cashFlow,
    savingsRate,
    givingRate,
    liquid,
    liquidityMonths,
    budgetTotal,
    budgetUsedPct,
    adherence,
    debtRatio,
    netWorth,
    score,
    missing,
    spendByCategory: Array.from(byCat.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8),
    allocation: i.budgets
      .map((b) => ({ name: b.category, value: Number(b.limit_amount) }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value),
    trend,
    upcomingBills,
    goals,
    insights: insights.slice(0, 4),
  };
}
