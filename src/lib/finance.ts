// Nuru Steward — Kenya-aware salary & finance engine

export type Deduction = {
  id: string;
  name: string;
  type: "statutory" | "custom";
  rule: "fixed" | "percentage";
  value: number;
  frequency: "monthly" | "annual" | "one_time";
};

export const TITHE_RATE = 0.1;

// ---------- Kenya statutory deductions ----------

export function nssfContribution(gross: number, mode: "simple" | "tiered" = "tiered"): number {
  if (gross <= 0) return 0;
  if (mode === "simple") return +(gross * 0.06).toFixed(2);
  // Tiered (current statutory model)
  const tier1 = Math.min(gross, 8000) * 0.06;
  const tier2 = Math.max(0, Math.min(gross, 72000) - 8000) * 0.06;
  return +(tier1 + tier2).toFixed(2);
}

export function shifContribution(gross: number): number {
  return +(Math.max(0, gross) * 0.0275).toFixed(2);
}

export function ahlContribution(gross: number): number {
  return +(Math.max(0, gross) * 0.015).toFixed(2);
}

// Progressive PAYE (Kenya, current bands). Personal relief KES 2,400/m for residents.
export function payeKenya(taxableIncome: number, isResident = true): number {
  if (taxableIncome <= 0) return 0;
  const bands = [
    { upTo: 24000, rate: 0.1 },
    { upTo: 32333, rate: 0.25 },
    { upTo: 500000, rate: 0.3 },
    { upTo: 800000, rate: 0.325 },
    { upTo: Infinity, rate: 0.35 },
  ];
  let remaining = taxableIncome;
  let prev = 0;
  let tax = 0;
  for (const b of bands) {
    const slice = Math.max(0, Math.min(remaining, b.upTo - prev));
    tax += slice * b.rate;
    remaining -= slice;
    prev = b.upTo;
    if (remaining <= 0) break;
  }
  const relief = isResident ? 2400 : 0;
  return +Math.max(0, tax - relief).toFixed(2);
}

export type SalaryBreakdown = {
  gross: number;
  nssf: number;
  shif: number;
  ahl: number;
  allowableDeductions: number;
  taxableIncome: number;
  paye: number;
  netStatutory: number; // after NSSF/SHIF/AHL/PAYE
  customDeductions: number; // user-defined recurring obligations (loans, etc.)
  tithe: number;
  netDisposable: number; // final amount available to allocate
  titheBase: "gross" | "net";
};

export function computeSalaryBreakdown(
  gross: number,
  opts: {
    deductions?: Deduction[];
    nssfMode?: "simple" | "tiered";
    isResident?: boolean;
    titheBase?: "gross" | "net";
  } = {}
): SalaryBreakdown {
  const g = Math.max(0, gross || 0);
  const nssf = nssfContribution(g, opts.nssfMode ?? "tiered");
  const shif = shifContribution(g);
  const ahl = ahlContribution(g);
  const allowable = nssf + shif + ahl;
  const taxable = Math.max(0, g - allowable);
  const paye = payeKenya(taxable, opts.isResident ?? true);
  const netStatutory = Math.max(0, g - allowable - paye);

  const custom = (opts.deductions ?? [])
    .filter((d) => d.type === "custom")
    .reduce((s, d) => s + computeDeductionAmount(d, g), 0);

  const titheBase = opts.titheBase ?? "gross";
  const tithe = titheBase === "gross" ? g * TITHE_RATE : netStatutory * TITHE_RATE;
  const netDisposable = Math.max(0, netStatutory - custom - tithe);

  return {
    gross: g,
    nssf,
    shif,
    ahl,
    allowableDeductions: allowable,
    taxableIncome: taxable,
    paye,
    netStatutory,
    customDeductions: custom,
    tithe,
    netDisposable,
    titheBase,
  };
}

// Backwards-compatible breakdown for existing UI (dashboard/insights/settings).
export function computeBreakdown(grossMonthly: number, deductions: Deduction[]) {
  const b = computeSalaryBreakdown(grossMonthly, { deductions });
  return {
    gross: b.gross,
    tithe: b.tithe,
    statutory: b.nssf + b.shif + b.ahl + b.paye,
    custom: b.customDeductions,
    net: b.netDisposable,
  };
}

export function computeDeductionAmount(d: Deduction, grossMonthly: number): number {
  if (d.rule === "percentage") {
    const base = d.frequency === "annual" ? grossMonthly : grossMonthly;
    return (base * d.value) / 100;
  }
  return d.frequency === "annual" ? d.value / 12 : d.value;
}

// ---------- Categories (expanded for African household model) ----------

export const BUDGET_CATEGORY_GROUPS = {
  Essentials: ["Rent", "Food & Groceries", "Transport", "Utilities", "Medical"],
  Family: [
    "Parents support",
    "Siblings support",
    "Extended family support",
    "Girlfriend allowance",
    "Wife allowance",
    "Children allowance",
    "School fees",
    "Emergency family support",
  ],
  Lifestyle: ["Subscriptions", "Personal care", "Entertainment", "Dining out", "Clothing"],
  Financial: ["Insurance", "Loans / Debt repayment", "Savings", "Investments", "Charity & Giving"],
  Other: ["Miscellaneous"],
} as const;

export const DEFAULT_BUDGET_CATEGORIES: string[] = Object.values(BUDGET_CATEGORY_GROUPS).flatMap((v) => [...v]);

export const DEFAULT_STATUTORY: Array<Omit<Deduction, "id">> = [
  // The new statutory engine handles NSSF/SHIF/AHL/PAYE automatically;
  // these seeds remain for legacy compatibility but are optional.
];

export function healthScore(opts: {
  savingsRate: number;
  givingRate: number;
  budgetAdherence: number;
  debtRatio: number;
}) {
  const s = Math.min(1, opts.savingsRate / 0.2) * 30;
  const g = Math.min(1, opts.givingRate / 0.1) * 25;
  const b = opts.budgetAdherence * 30;
  const d = (1 - Math.min(1, opts.debtRatio / 0.4)) * 15;
  return Math.round(s + g + b + d);
}

export function diversificationScore(streams: { amount: number }[]): number {
  // Higher = more diversified (Herfindahl-Hirschman inverse)
  const total = streams.reduce((s, x) => s + Math.max(0, x.amount), 0);
  if (total <= 0 || streams.length === 0) return 0;
  const hhi = streams.reduce((s, x) => s + Math.pow(Math.max(0, x.amount) / total, 2), 0);
  return Math.round((1 - hhi) * 100);
}
