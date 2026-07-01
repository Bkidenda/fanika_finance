// Nuru Steward — multi-country, net-salary based finance engine.
// Starts from NET take-home in any currency. Tithe is OPTIONAL per user.

export type Deduction = {
  id: string;
  name: string;
  type: "statutory" | "custom";
  rule: "fixed" | "percentage";
  value: number;
  frequency: "monthly" | "annual" | "one_time";
};

export const DEFAULT_TITHE_RATE = 0.10;

export function computeDeductionAmount(d: Deduction, base: number): number {
  if (d.rule === "percentage") return (base * d.value) / 100;
  return d.frequency === "annual" ? d.value / 12 : d.value;
}

export type Breakdown = {
  net: number;
  tithe: number;
  custom: number;
  disposable: number;
};

export function computeBreakdown(
  netMonthly: number,
  deductions: Deduction[] = [],
  opts: { titheEnabled?: boolean; titheRate?: number } = {},
): Breakdown {
  const net = Math.max(0, netMonthly || 0);
  const rate = opts.titheEnabled ? (opts.titheRate ?? DEFAULT_TITHE_RATE) : 0;
  const tithe = net * rate;
  const custom = deductions
    .filter((d) => d.type === "custom")
    .reduce((s, d) => s + computeDeductionAmount(d, net), 0);
  const disposable = Math.max(0, net - tithe - custom);
  return { net, tithe, custom, disposable };
}

export function computeNetWorth(opts: {
  accounts: { balance: number }[];
  investments: { current_value: number }[];
  debts: { balance: number }[];
}): { assets: number; liabilities: number; net: number } {
  const cash = opts.accounts.reduce((s, a) => s + Number(a.balance), 0);
  const inv = opts.investments.reduce((s, i) => s + Number(i.current_value), 0);
  const debt = opts.debts.reduce((s, d) => s + Number(d.balance), 0);
  const assets = cash + inv;
  return { assets, liabilities: debt, net: assets - debt };
}

export const BUDGET_CATEGORY_GROUPS = {
  Essentials: ["Rent", "Food & Groceries", "Transport", "Utilities", "Medical"],
  Family: [
    "Parents support", "Siblings support", "Extended family support",
    "Spouse / partner allowance", "Children allowance",
    "School fees", "Emergency family support",
  ],
  Lifestyle: ["Subscriptions", "Personal care", "Entertainment", "Dining out", "Clothing"],
  Financial: ["Insurance", "Loans / Debt repayment", "Savings", "Investments", "Charity & Giving"],
  Other: ["Miscellaneous"],
} as const;

export const DEFAULT_BUDGET_CATEGORIES: string[] = Object.values(BUDGET_CATEGORY_GROUPS).flatMap((v) => [...v]);

export function groupForCategory(cat: string): string {
  for (const [group, list] of Object.entries(BUDGET_CATEGORY_GROUPS)) {
    if ((list as readonly string[]).includes(cat)) return group;
  }
  return "Other";
}

export function healthScore(opts: { savingsRate: number; givingRate: number; budgetAdherence: number; debtRatio: number }) {
  const s = Math.min(1, opts.savingsRate / 0.2) * 30;
  const g = Math.min(1, opts.givingRate / 0.1) * 25;
  const b = opts.budgetAdherence * 30;
  const d = (1 - Math.min(1, opts.debtRatio / 0.4)) * 15;
  return Math.round(s + g + b + d);
}

export function diversificationScore(streams: { amount: number }[]): number {
  const total = streams.reduce((s, x) => s + Math.max(0, x.amount), 0);
  if (total <= 0 || streams.length === 0) return 0;
  const hhi = streams.reduce((s, x) => s + Math.pow(Math.max(0, x.amount) / total, 2), 0);
  return Math.round((1 - hhi) * 100);
}

// Back-compat for any leftover imports
export const TITHE_RATE = DEFAULT_TITHE_RATE;

// ---------- Financial statement engine ----------

export type IncomeStatementLine = { label: string; amount: number };
export type IncomeStatement = {
  period: string;
  revenue: IncomeStatementLine[];
  totalRevenue: number;
  expenses: IncomeStatementLine[];
  totalExpenses: number;
  tithe: number;
  deductions: number;
  netIncome: number;
  savingsRate: number;
};

export function computeIncomeStatement(opts: {
  period: string;
  incomeEntries: { amount: number; source?: string }[];
  expenses: { amount: number; category: string; transaction_fee?: number }[];
  tithe: number;
  deductions: number;
}): IncomeStatement {
  const revenue = opts.incomeEntries.map((e) => ({ label: e.source ?? "Income", amount: Number(e.amount) }));
  const totalRevenue = revenue.reduce((s, r) => s + r.amount, 0);
  const expenseMap = new Map<string, number>();
  opts.expenses.forEach((e) => {
    expenseMap.set(e.category, (expenseMap.get(e.category) ?? 0) + Number(e.amount) + Number(e.transaction_fee ?? 0));
  });
  const expenses = Array.from(expenseMap.entries()).map(([label, amount]) => ({ label, amount }));
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netIncome = totalRevenue - totalExpenses - opts.tithe - opts.deductions;
  const savingsRate = totalRevenue > 0 ? Math.max(0, netIncome) / totalRevenue : 0;
  return { period: opts.period, revenue, totalRevenue, expenses, totalExpenses, tithe: opts.tithe, deductions: opts.deductions, netIncome, savingsRate };
}

export type BalanceSheet = {
  period: string;
  cashAndBank: number;
  investments: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  assetLines: { name: string; amount: number }[];
  liabilityLines: { name: string; amount: number }[];
};

export function computeBalanceSheet(opts: {
  period: string;
  accounts: { balance: number; name: string }[];
  investments: { current_value: number; name: string }[];
  debts: { balance: number; name: string }[];
}): BalanceSheet {
  const cashAndBank = opts.accounts.reduce((s, a) => s + Number(a.balance), 0);
  const investments = opts.investments.reduce((s, i) => s + Number(i.current_value), 0);
  const totalAssets = cashAndBank + investments;
  const totalLiabilities = opts.debts.reduce((s, d) => s + Number(d.balance), 0);
  return {
    period: opts.period,
    cashAndBank, investments, totalAssets, totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    assetLines: [
      ...opts.accounts.map((a) => ({ name: a.name, amount: Number(a.balance) })),
      ...opts.investments.map((i) => ({ name: i.name, amount: Number(i.current_value) })),
    ],
    liabilityLines: opts.debts.map((d) => ({ name: d.name, amount: Number(d.balance) })),
  };
}

export type CashFlowStatement = {
  period: string;
  operatingInflows: number;
  operatingOutflows: number;
  investingOutflows: number;
  titheAndGiving: number;
  netCashFlow: number;
};

export function computeCashFlow(opts: {
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  investmentContributions: number;
  tithe: number;
}): CashFlowStatement {
  return {
    period: opts.period,
    operatingInflows: opts.totalRevenue,
    operatingOutflows: opts.totalExpenses,
    investingOutflows: opts.investmentContributions,
    titheAndGiving: opts.tithe,
    netCashFlow: opts.totalRevenue - opts.totalExpenses - opts.investmentContributions - opts.tithe,
  };
}

