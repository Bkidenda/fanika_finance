export type Deduction = {
  id: string;
  name: string;
  type: "statutory" | "custom";
  rule: "fixed" | "percentage";
  value: number;
  frequency: "monthly" | "annual" | "one_time";
};

export const TITHE_RATE = 0.1;

export function computeDeductionAmount(d: Deduction, grossMonthly: number): number {
  const base = d.frequency === "annual" ? grossMonthly * 12 : grossMonthly;
  const monthlyBase = d.frequency === "annual" ? base / 12 : base;
  if (d.rule === "percentage") return (monthlyBase * d.value) / 100;
  return d.frequency === "annual" ? d.value / 12 : d.value;
}

export function computeBreakdown(grossMonthly: number, deductions: Deduction[]) {
  const tithe = grossMonthly * TITHE_RATE;
  const statutory = deductions
    .filter((d) => d.type === "statutory")
    .reduce((s, d) => s + computeDeductionAmount(d, grossMonthly), 0);
  const custom = deductions
    .filter((d) => d.type === "custom")
    .reduce((s, d) => s + computeDeductionAmount(d, grossMonthly), 0);
  const net = Math.max(0, grossMonthly - tithe - statutory - custom);
  return { gross: grossMonthly, tithe, statutory, custom, net };
}

export const DEFAULT_BUDGET_CATEGORIES = [
  "Housing & Rent",
  "Food & Groceries",
  "Transport",
  "Utilities",
  "Personal Care",
  "Education",
  "Savings",
  "Investments",
  "Charity & Giving",
  "Miscellaneous",
];

export const DEFAULT_STATUTORY: Array<Omit<Deduction, "id">> = [
  { name: "PAYE (Tax)", type: "statutory", rule: "percentage", value: 17.5, frequency: "monthly" },
  { name: "NSSF (Pension)", type: "statutory", rule: "fixed", value: 2160, frequency: "monthly" },
  { name: "NHIF (Health)", type: "statutory", rule: "fixed", value: 1700, frequency: "monthly" },
];

export function healthScore(opts: {
  savingsRate: number; // 0..1
  givingRate: number; // 0..1
  budgetAdherence: number; // 0..1 (1 = no overspend)
  debtRatio: number; // custom deduction / gross
}) {
  const s = Math.min(1, opts.savingsRate / 0.2) * 30;
  const g = Math.min(1, opts.givingRate / 0.1) * 25;
  const b = opts.budgetAdherence * 30;
  const d = (1 - Math.min(1, opts.debtRatio / 0.4)) * 15;
  return Math.round(s + g + b + d);
}
