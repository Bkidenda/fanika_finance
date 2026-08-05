import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  ChevronLeft, ChevronRight, Download, FileSpreadsheet, FileText, Mail, Sheet as SheetIcon,
} from "lucide-react";

import {
  useProfile, useAccounts, useInvestments, useDebts, useSubscriptions,
  useIncomeEntries, useExpenses, useDeductions,
  useAllExpenses, useAllIncomeEntries, useAllBudgets, useGoals,
} from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { chartColorByRank, CHART_AXIS_TICK, CHART_GRID_STROKE, rankByValue, SERIES_COLORS } from "@/lib/chart-colors";
import { formatCurrency, monthLabel } from "@/lib/format";
import {
  computeBreakdown, computeNetWorth,
  computeIncomeStatement, computeBalanceSheet, computeCashFlow,
} from "@/lib/finance";
import { exportCsv, exportExcel, exportPdf, type ReportRow } from "@/lib/report-export";
import { emailReport } from "@/lib/email-report";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Statements — Fanika" },
      { name: "description", content: "Financial statements plus a consolidated reports hub: cash flow, income vs expenses, net worth, budgets, debt, savings and investment growth for any monthly, quarterly or annual period." },
      { property: "og:title", content: "Reports & Statements — Fanika" },
      { property: "og:description", content: "One place to view and export every Fanika financial statement and report by month, quarter, or year." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportsAndStatementsPage,
});

const StatementPdfButtons = lazy(() => import("@/components/statement-pdf-download-lazy"));

async function loadSummaryDownloader() {
  const mod = await import("@/components/statement-pdf-download-lazy");
  return mod.downloadSummaryPdf;
}

// ---------------------------------------------------------------------------
// Statements tab — period helpers
// ---------------------------------------------------------------------------

function ymdRange(period: string, scope: "month" | "quarter") {
  const [y, m] = period.split("-").map(Number);
  if (scope === "month") {
    const start = `${y}-${String(m).padStart(2, "0")}-01`;
    const nd = new Date(Date.UTC(y, m, 1));
    const end = `${nd.getUTCFullYear()}-${String(nd.getUTCMonth() + 1).padStart(2, "0")}-01`;
    return { start, end, label: new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-US", { month: "long", year: "numeric" }) };
  }
  const qStart = Math.floor((m - 1) / 3) * 3 + 1;
  const start = `${y}-${String(qStart).padStart(2, "0")}-01`;
  const nd = new Date(Date.UTC(y, qStart - 1 + 3, 1));
  const end = `${nd.getUTCFullYear()}-${String(nd.getUTCMonth() + 1).padStart(2, "0")}-01`;
  return { start, end, label: `Q${Math.floor((m - 1) / 3) + 1} ${y}` };
}

// ---------------------------------------------------------------------------
// Reports tab — period helpers
// ---------------------------------------------------------------------------

type PeriodType = "month" | "quarter" | "year";

function periodAnchor(type: PeriodType, offset: number, base = new Date()): Date {
  const d = new Date(base.getFullYear(), base.getMonth(), 1);
  if (type === "month") d.setMonth(d.getMonth() + offset);
  else if (type === "quarter") d.setMonth(d.getMonth() + offset * 3);
  else d.setFullYear(d.getFullYear() + offset);
  return d;
}

function periodRange(type: PeriodType, anchor: Date): { start: Date; end: Date; label: string } {
  if (type === "month") {
    const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
    return { start, end, label: start.toLocaleString("en-US", { month: "long", year: "numeric" }) };
  }
  if (type === "quarter") {
    const qStartMonth = Math.floor(anchor.getMonth() / 3) * 3;
    const start = new Date(anchor.getFullYear(), qStartMonth, 1);
    const end = new Date(anchor.getFullYear(), qStartMonth + 3, 1);
    return { start, end, label: `Q${Math.floor(qStartMonth / 3) + 1} ${anchor.getFullYear()}` };
  }
  const start = new Date(anchor.getFullYear(), 0, 1);
  const end = new Date(anchor.getFullYear() + 1, 0, 1);
  return { start, end, label: `${anchor.getFullYear()}` };
}

function shortPeriodLabel(type: PeriodType, anchor: Date): string {
  if (type === "month") return anchor.toLocaleString("en-US", { month: "short", year: "2-digit" });
  if (type === "quarter") return `Q${Math.floor(anchor.getMonth() / 3) + 1} '${String(anchor.getFullYear()).slice(2)}`;
  return `${anchor.getFullYear()}`;
}

function inRange(dateIso: string, start: Date, end: Date): boolean {
  const t = new Date(dateIso).getTime();
  return t >= start.getTime() && t < end.getTime();
}

function sum(rows: { amount: number }[]): number {
  return rows.reduce((s, r) => s + Number(r.amount), 0);
}

const REPORT_TABS = [
  { id: "cashflow", label: "Cash Flow" },
  { id: "income-expense", label: "Income vs Expenses" },
  { id: "networth", label: "Net Worth Growth" },
  { id: "budget", label: "Budget Performance" },
  { id: "debt", label: "Debt Reduction" },
  { id: "savings", label: "Savings Growth" },
  { id: "investment", label: "Investment Growth" },
] as const;

type ReportId = (typeof REPORT_TABS)[number]["id"];

// ---------------------------------------------------------------------------
// Shared presentational bits
// ---------------------------------------------------------------------------

function EmptyState({ message, cta }: { message: string; cta?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {cta}
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

function ExportBar({ onCsv, onExcel, onPdf, onEmail, disabled }: { onCsv: () => void; onExcel: () => void; onPdf: () => void; onEmail: () => void; disabled: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={onCsv} disabled={disabled} aria-label="Export this report section as CSV">
        <SheetIcon className="mr-1.5 h-4 w-4" /> CSV
      </Button>
      <Button variant="outline" size="sm" onClick={onExcel} disabled={disabled} aria-label="Export full report as an Excel workbook">
        <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Excel
      </Button>
      <Button variant="outline" size="sm" onClick={onPdf} disabled={disabled} aria-label="Export full report as a PDF document">
        <FileText className="mr-1.5 h-4 w-4" /> PDF
      </Button>
      <Button variant="outline" size="sm" onClick={onEmail} aria-label="Email this report to me">
        <Mail className="mr-1.5 h-4 w-4" /> Email to me
      </Button>
    </div>
  );
}

function BarRow({ data, valueKey = "value", height = 260, colorMode = "rank" }: { data: { name: string; value: number }[]; valueKey?: string; height?: number; colorMode?: "rank" | "income-expense" }) {
  const sorted = colorMode === "rank" ? rankByValue(data) : data;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={sorted} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
        <XAxis dataKey="name" tick={CHART_AXIS_TICK} interval={0} angle={-20} textAnchor="end" height={50} />
        <YAxis tick={CHART_AXIS_TICK} tickFormatter={(v) => formatCurrency(v).replace(/\.00$/, "")} width={80} />
        <Tooltip formatter={(v: number) => formatCurrency(v)} />
        <Bar dataKey={valueKey} radius={[4, 4, 0, 0]}>
          {sorted.map((_, i) => (
            <Cell key={i} fill={chartColorByRank(i)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function TrendLine({ data, series, height = 260 }: { data: Record<string, number | string>[]; series: { key: string; color: string; label: string }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
        <XAxis dataKey="period" tick={CHART_AXIS_TICK} />
        <YAxis tick={CHART_AXIS_TICK} tickFormatter={(v) => formatCurrency(v).replace(/\.00$/, "")} width={80} />
        <Tooltip formatter={(v: number) => formatCurrency(v)} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function DataTable({ rows, currency }: { rows: ReportRow[]; currency: string }) {
  if (!rows.length) return null;
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[320px] text-sm">
        <thead className="bg-muted/50 text-left text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Item</th>
            <th className="px-3 py-2 font-medium text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.label}-${i}`} className="border-t border-border">
              <td className="px-3 py-2">{r.label}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(r.value, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Statements tab
// ---------------------------------------------------------------------------

function SectionTitle({ title, className }: { title: string; className?: string }) {
  return (
    <div className={className}>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">{title}</h3>
    </div>
  );
}

function StatementList({ lines, fmt }: { lines: { label: string; amount: number }[]; fmt: (n: number) => string }) {
  return (
    <div className="mt-2 divide-y">
      {lines.map((l, i) => (
        <div key={`${l.label}-${i}`} className="flex justify-between py-2 text-sm">
          <span className="text-muted-foreground">{l.label}</span>
          <span className="font-medium tabular-nums">{fmt(l.amount)}</span>
        </div>
      ))}
    </div>
  );
}

function SubtotalRow({ label, value, accent, className = "" }: { label: string; value: string; accent?: boolean; className?: string }) {
  return (
    <div className={`mt-1 flex justify-between border-t-2 px-2 py-2 text-sm font-semibold ${accent ? "border-primary/40 bg-secondary/60 text-primary" : "border-border/60"} ${className}`}>
      <span className="uppercase tracking-wide">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function StatementHeader({ entity, title, period, currency }: { entity: string; title: string; period: string; currency: string }) {
  return (
    <div className="border-b-2 border-primary/30 pb-3 text-center">
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{entity}</div>
      <div className="mt-1 text-lg font-bold uppercase tracking-wide text-primary md:text-xl">{title}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{period}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">All amounts in {currency}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums font-medium">{value}</span>
    </div>
  );
}

function StatementsTab() {
  const { user } = useAuth();
  const profile = useProfile();
  const accounts = useAccounts();
  const investments = useInvestments();
  const debts = useDebts();
  useSubscriptions();
  useIncomeEntries();
  useExpenses();
  const deductions = useDeductions();
  const currency = profile.data?.currency ?? "KES";

  const now = new Date();
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [period, setPeriod] = useState(defaultPeriod);
  const [scope, setScope] = useState<"month" | "quarter">("month");
  const [tab, setTab] = useState<"income" | "balance" | "cash">("income");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const range = useMemo(() => ymdRange(period, scope), [period, scope]);

  const data = useQuery({
    queryKey: ["statement", user?.id, range.start, range.end],
    enabled: !!user,
    queryFn: async () => {
      const [exp, inc, bud, dp] = await Promise.all([
        supabase.from("expenses").select("amount,category,transaction_fee,is_emergency,date,description").gte("date", range.start).lt("date", range.end),
        supabase.from("income_entries").select("amount,source,date,notes").gte("date", range.start).lt("date", range.end),
        supabase.from("budgets").select("category,limit_amount,month").gte("month", range.start).lt("month", range.end),
        supabase.from("debt_payments").select("amount,date,note").gte("date", range.start).lt("date", range.end),
      ]);
      return {
        expenses: exp.data ?? [],
        incomes: inc.data ?? [],
        budgets: bud.data ?? [],
        debtPayments: dp.data ?? [],
      };
    },
  });

  const rawIncomes = data.data?.incomes ?? [];
  const rawExpenses = data.data?.expenses ?? [];

  const titheEnabled = !!profile.data?.tithe_enabled;
  const titheRate = profile.data?.tithe_rate ?? 0.10;
  const totalRevenue = rawIncomes.reduce((s, x) => s + Number(x.amount), 0);
  const breakdown = computeBreakdown(totalRevenue, deductions.data ?? [], { titheEnabled, titheRate });
  const customDed = breakdown.custom;

  const incomeStatement = computeIncomeStatement({
    period: range.label,
    incomeEntries: rawIncomes,
    expenses: rawExpenses,
    tithe: breakdown.tithe,
    deductions: customDed,
  });

  const balanceSheet = computeBalanceSheet({
    period: range.label,
    accounts: accounts.data ?? [],
    investments: investments.data ?? [],
    debts: debts.data ?? [],
  });

  const investingOutflows = (rawExpenses.filter((e) => e.category === "Investments" || e.category === "Savings"))
    .reduce((s, e) => s + Number(e.amount), 0);
  const debtPrincipalPayments = (data.data?.debtPayments ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const cashFlow = computeCashFlow({
    period: range.label,
    totalRevenue,
    totalExpenses: incomeStatement.totalExpenses,
    investmentContributions: investingOutflows,
    tithe: breakdown.tithe,
    debtPrincipalPayments,
  });

  const nw = computeNetWorth({
    accounts: accounts.data ?? [],
    investments: investments.data ?? [],
    debts: debts.data ?? [],
  });

  const fmt = (n: number) => formatCurrency(n, currency);
  const fileBase = `fanika-statement-${scope}-${period}`;

  const topExpenses = [...incomeStatement.expenses].sort((a, b) => b.amount - a.amount).slice(0, 6);

  const who = profile.data?.full_name || profile.data?.email || "Account holder";

  async function downloadSummary() {
    try {
      const download = await loadSummaryDownloader();
      await download({
        who,
        currency,
        asOf: new Date().toLocaleDateString(),
        netWorth: nw.net,
        totalAssets: balanceSheet.totalAssets,
        totalLiabilities: balanceSheet.totalLiabilities,
        cashAndBank: balanceSheet.cashAndBank,
        investments: balanceSheet.investments,
        monthlyRevenue: incomeStatement.totalRevenue,
        monthlyExpenses: incomeStatement.totalExpenses,
        monthlyNetIncome: incomeStatement.netIncome,
        savingsRate: incomeStatement.savingsRate,
        tithe: incomeStatement.tithe,
        topExpenses,
        accounts: (accounts.data ?? []).map((a) => ({ name: a.name, balance: Number(a.balance) })),
        debts: (debts.data ?? []).map((d) => ({ name: d.name, balance: Number(d.balance) })),
      }, `fanika-financial-summary-${period}.pdf`);
    } catch (e) {
      console.error(e);
    }
  }

  // ---- export rows shared with reports.tsx-style CSV/Excel helpers ----

  const incomeRows: ReportRow[] = [
    ...incomeStatement.revenue.map((r) => ({ label: r.label, value: r.amount })),
    { label: "Total revenue", value: incomeStatement.totalRevenue },
    ...incomeStatement.expenses.map((r) => ({ label: r.label, value: -r.amount })),
    { label: "Total operating expenses", value: -incomeStatement.totalExpenses },
    { label: "Tithe & giving", value: -incomeStatement.tithe },
    { label: "Custom deductions", value: -incomeStatement.deductions },
    { label: "Net income", value: incomeStatement.netIncome },
  ];

  const balanceRows: ReportRow[] = [
    ...(accounts.data ?? []).map((a) => ({ label: a.name, value: Number(a.balance) })),
    { label: "Cash & bank", value: balanceSheet.cashAndBank },
    ...(investments.data ?? []).map((i) => ({ label: i.name, value: Number(i.current_value) })),
    { label: "Total investments", value: balanceSheet.investments },
    { label: "TOTAL ASSETS", value: balanceSheet.totalAssets },
    ...balanceSheet.liabilityLines.map((l) => ({ label: l.name, value: l.amount })),
    { label: "Total liabilities", value: balanceSheet.totalLiabilities },
    ...balanceSheet.equityLines.map((l) => ({ label: l.name, value: l.amount })),
    { label: "Total equity", value: balanceSheet.totalEquity },
    { label: "TOTAL LIABILITIES & EQUITY", value: balanceSheet.totalLiabilitiesAndEquity },
  ];

  const cashRows: ReportRow[] = [
    { label: "Cash received from income", value: cashFlow.operatingInflows },
    { label: "Cash paid for expenses", value: -cashFlow.operatingOutflows },
    { label: "Tithe & giving", value: -cashFlow.titheAndGiving },
    { label: "Net cash from operating activities", value: cashFlow.netOperating - cashFlow.titheAndGiving },
    { label: "Investment contributions & savings", value: -cashFlow.investingOutflows },
    { label: "Net cash used in investing activities", value: cashFlow.netInvesting },
    { label: "Debt principal repayments", value: -cashFlow.financingOutflows },
    { label: "Net cash used in financing activities", value: cashFlow.netFinancing },
    { label: "Net change in cash", value: cashFlow.netCashFlow },
  ];

  const statementMeta: Record<typeof tab, { title: string; rows: ReportRow[] }> = {
    income: { title: "Income Statement", rows: incomeRows },
    balance: { title: "Balance Sheet", rows: balanceRows },
    cash: { title: "Cash Flow", rows: cashRows },
  };

  function handleCsv() {
    const meta = statementMeta[tab];
    exportCsv(meta.rows, `${fileBase}-${tab}`);
  }
  function handleExcel() {
  function handleExcel() {
    exportExcel(
      [
        { title: "Income Statement", rows: incomeRows },
        { title: "Balance Sheet", rows: balanceRows },
        { title: "Cash Flow", rows: cashRows },
      ],
      fileBase,
      { entity: who, period: range.label, currency }
    );
  }
  }
  async function handleEmail() {
    const meta = statementMeta[tab];
    await emailReport({
      type: `statement-${tab}`,
      period: range.label,
      title: `${meta.title} — ${range.label}`,
      summaryRows: meta.rows.map((r) => ({ label: r.label, value: fmt(r.value) })),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" onClick={downloadSummary}><Download className="mr-1 h-4 w-4" /> Download report (PDF)</Button>
      </div>

      <div className="rounded-2xl border bg-card p-4 md:p-6 shadow-card">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Scope</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as "month" | "quarter")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="quarter">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Period (YYYY-MM)</Label>
            <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
          </div>
          <div className="flex items-end">
            {mounted ? (
              <Suspense fallback={<Button className="w-full" disabled><Download className="mr-1 h-4 w-4" />Loading…</Button>}>
                <StatementPdfButtons
                  fileBase={fileBase}
                  currentTab={tab}
                  title={`${scope === "month" ? "Monthly" : "Quarterly"} statement — ${range.label}`}
                  who={who}
                  currency={currency}
                  income={incomeStatement}
                  balance={balanceSheet}
                  cashFlow={cashFlow}
                  disabled={data.isLoading}
                />
              </Suspense>
            ) : (
              <Button className="w-full" disabled><Download className="mr-1 h-4 w-4" />Loading…</Button>
            )}
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="income">Income Statement</TabsTrigger>
          <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
          <TabsTrigger value="cash">Cash Flow</TabsTrigger>
        </TabsList>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCsv} disabled={data.isLoading} aria-label="Export this statement as CSV">
            <SheetIcon className="mr-1.5 h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExcel} disabled={data.isLoading} aria-label="Export all statements as an Excel workbook">
            <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleEmail} aria-label="Email this statement to me">
            <Mail className="mr-1.5 h-4 w-4" /> Email to me
          </Button>
        </div>

        <TabsContent value="income" className="mt-4">
          <div className="rounded-2xl border bg-card p-4 md:p-6 shadow-card">
            <StatementHeader
              entity={who}
              title="Statement of Income & Expenditure"
              period={`For the ${scope === "month" ? "month" : "quarter"} ended ${range.label}`}
              currency={currency}
            />

            <SectionTitle title="Revenue" className="mt-4" />
            <StatementList lines={incomeStatement.revenue.length ? incomeStatement.revenue : [{ label: "No income recorded", amount: 0 }]} fmt={fmt} />
            <SubtotalRow label="Total revenue" value={fmt(incomeStatement.totalRevenue)} />

            <SectionTitle title="Operating expenses" className="mt-6" />
            <StatementList lines={incomeStatement.expenses.length ? incomeStatement.expenses : [{ label: "No expenses recorded", amount: 0 }]} fmt={fmt} />
            <SubtotalRow label="Total operating expenses" value={fmt(incomeStatement.totalExpenses)} />

            <SubtotalRow
              label="Operating income"
              value={fmt(incomeStatement.totalRevenue - incomeStatement.totalExpenses)}
              accent
              className="mt-4"
            />

            <SectionTitle title="Giving & statutory deductions" className="mt-6" />
            {titheEnabled && (
              <div className="flex justify-between border-b py-2 text-sm"><span className="text-muted-foreground">Tithe & giving</span><span className="font-medium tabular-nums">{fmt(incomeStatement.tithe)}</span></div>
            )}
            <div className="flex justify-between border-b py-2 text-sm"><span className="text-muted-foreground">Custom deductions</span><span className="font-medium tabular-nums">{fmt(incomeStatement.deductions)}</span></div>
            <SubtotalRow label="Total deductions" value={fmt(incomeStatement.tithe + incomeStatement.deductions)} />

            <div className="mt-4 flex items-center justify-between rounded-xl border-2 border-primary/30 bg-secondary/60 p-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Net income</div>
                <div className={`text-2xl font-bold tabular-nums ${incomeStatement.netIncome >= 0 ? "text-primary" : "text-destructive"}`}>{fmt(incomeStatement.netIncome)}</div>
              </div>
              <span className="rounded-full bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary">
                Savings rate {Math.round(incomeStatement.savingsRate * 100)}%
              </span>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="balance" className="mt-4">
          <div className="rounded-2xl border bg-card p-4 md:p-6 shadow-card">
            <StatementHeader
              entity={who}
              title="Statement of Financial Position"
              period={`As at ${range.label}`}
              currency={currency}
            />

            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <div>
                <SectionTitle title="Assets" />
                <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">Current assets</p>
                <StatementList
                  lines={
                    (accounts.data ?? []).length
                      ? (accounts.data ?? []).map((a) => ({ label: a.name, amount: Number(a.balance) }))
                      : [{ label: "No cash accounts", amount: 0 }]
                  }
                  fmt={fmt}
                />
                <SubtotalRow label="Cash & bank" value={fmt(balanceSheet.cashAndBank)} />

                <p className="mb-2 mt-4 text-[11px] uppercase tracking-wider text-muted-foreground">Non-current assets</p>
                <StatementList
                  lines={
                    (investments.data ?? []).length
                      ? (investments.data ?? []).map((i) => ({ label: i.name, amount: Number(i.current_value) }))
                      : [{ label: "No investments", amount: 0 }]
                  }
                  fmt={fmt}
                />
                <SubtotalRow label="Total investments" value={fmt(balanceSheet.investments)} />

                <SubtotalRow label="TOTAL ASSETS" value={fmt(balanceSheet.totalAssets)} accent className="mt-4" />
              </div>

              <div>
                <SectionTitle title="Liabilities & Equity" />
                <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">Liabilities</p>
                <StatementList
                  lines={balanceSheet.liabilityLines.length ? balanceSheet.liabilityLines.map((l) => ({ label: l.name, amount: l.amount })) : [{ label: "No liabilities", amount: 0 }]}
                  fmt={fmt}
                />
                <SubtotalRow label="Total liabilities" value={fmt(balanceSheet.totalLiabilities)} />

                <p className="mb-2 mt-4 text-[11px] uppercase tracking-wider text-muted-foreground">Equity</p>
                <StatementList
                  lines={balanceSheet.equityLines.map((l) => ({ label: l.name, amount: l.amount }))}
                  fmt={fmt}
                />
                <SubtotalRow label="Total equity" value={fmt(balanceSheet.totalEquity)} />

                <SubtotalRow
                  label="TOTAL LIABILITIES & EQUITY"
                  value={fmt(balanceSheet.totalLiabilitiesAndEquity)}
                  accent
                  className="mt-4"
                />
              </div>
            </div>

            <div className="mt-6 rounded-xl border bg-secondary/40 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
                <span>Accounting equation</span>
                <span>{balanceSheet.totalAssets === balanceSheet.totalLiabilitiesAndEquity ? "Balanced ✓" : "Reconciling…"}</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
                <div><div className="text-[11px] text-muted-foreground">Assets</div><div className="font-semibold tabular-nums">{fmt(balanceSheet.totalAssets)}</div></div>
                <div className="text-center text-lg font-semibold text-muted-foreground">=</div>
                <div className="text-right"><div className="text-[11px] text-muted-foreground">Liabilities + Equity</div><div className="font-semibold tabular-nums">{fmt(balanceSheet.totalLiabilitiesAndEquity)}</div></div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cash" className="mt-4">
          <div className="rounded-2xl border bg-card p-4 md:p-6 shadow-card">
            <StatementHeader
              entity={who}
              title="Statement of Cash Flows"
              period={`For the ${scope === "month" ? "month" : "quarter"} ended ${range.label}`}
              currency={currency}
            />

            <SectionTitle title="Cash flows from operating activities" className="mt-4" />
            <Row label="Cash received from income" value={fmt(cashFlow.operatingInflows)} />
            <Row label="Cash paid for expenses" value={fmt(-cashFlow.operatingOutflows)} />
            <Row label="Tithe & giving" value={fmt(-cashFlow.titheAndGiving)} />
            <SubtotalRow label="Net cash from operating activities" value={fmt(cashFlow.netOperating - cashFlow.titheAndGiving)} />

            <SectionTitle title="Cash flows from investing activities" className="mt-6" />
            <Row label="Investment contributions & savings" value={fmt(-cashFlow.investingOutflows)} />
            <SubtotalRow label="Net cash used in investing activities" value={fmt(cashFlow.netInvesting)} />

            <SectionTitle title="Cash flows from financing activities" className="mt-6" />
            <Row label="Debt principal repayments" value={fmt(-cashFlow.financingOutflows)} />
            <SubtotalRow label="Net cash used in financing activities" value={fmt(cashFlow.netFinancing)} />

            <div className="mt-4 flex items-center justify-between rounded-xl border-2 border-primary/30 bg-secondary/60 p-4">
              <span className="text-sm font-semibold uppercase tracking-wider">Net change in cash</span>
              <span className={`text-xl font-bold tabular-nums ${cashFlow.netCashFlow >= 0 ? "text-primary" : "text-destructive"}`}>{fmt(cashFlow.netCashFlow)}</span>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reports tab
// ---------------------------------------------------------------------------

function ReportsTab() {
  const profile = useProfile();
  const allExpenses = useAllExpenses();
  const allIncome = useAllIncomeEntries();
  const allBudgets = useAllBudgets();
  const accounts = useAccounts();
  const investments = useInvestments();
  const debts = useDebts();
  const goals = useGoals();

  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [offset, setOffset] = useState(0);
  const [tab, setTab] = useState<ReportId>("cashflow");

  const currency = profile.data?.currency ?? "KES";
  const who = profile.data?.full_name || profile.data?.email || "My Household";

  const isLoading = allExpenses.isLoading || allIncome.isLoading || allBudgets.isLoading || accounts.isLoading || investments.isLoading || debts.isLoading || goals.isLoading;

  const anchor = useMemo(() => periodAnchor(periodType, offset), [periodType, offset]);
  const { start, end, label } = useMemo(() => periodRange(periodType, anchor), [periodType, anchor]);

  const trail = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const a = periodAnchor(periodType, offset - (5 - i), new Date());
      return { anchor: a, ...periodRange(periodType, a), key: shortPeriodLabel(periodType, a) };
    });
  }, [periodType, offset]);

  const expenses = allExpenses.data ?? [];
  const incomeEntries = allIncome.data ?? [];
  const budgets = allBudgets.data ?? [];
  const accountRows = accounts.data ?? [];
  const investmentRows = investments.data ?? [];
  const debtRows = debts.data ?? [];
  const goalRows = goals.data ?? [];

  const periodExpenses = useMemo(() => expenses.filter((e) => inRange(e.date, start, end)), [expenses, start, end]);
  const periodIncome = useMemo(() => incomeEntries.filter((e) => inRange(e.date, start, end)), [incomeEntries, start, end]);

  const trailTotals = useMemo(() => trail.map((p) => {
    const inc = sum(incomeEntries.filter((e) => inRange(e.date, p.start, p.end)));
    const exp = sum(expenses.filter((e) => inRange(e.date, p.start, p.end)));
    return { period: p.key, income: inc, spending: exp, net: inc - exp };
  }), [trail, incomeEntries, expenses]);

  const totalIncome = sum(periodIncome);
  const totalExpenses = sum(periodExpenses);
  const netCashFlow = totalIncome - totalExpenses;
  const hasPeriodData = periodIncome.length > 0 || periodExpenses.length > 0;

  const netWorthNow = computeNetWorth({ accounts: accountRows, investments: investmentRows, debts: debtRows });

  const netWorthTrend = useMemo(() => {
    let running = netWorthNow.net;
    const reversed = [...trailTotals].reverse().map((t) => {
      const point = { period: t.period, netWorth: running };
      running -= t.net;
      return point;
    });
    return reversed.reverse();
  }, [trailTotals, netWorthNow.net]);

  const periodBudgets = useMemo(() => budgets.filter((b) => {
    const bd = new Date(b.month);
    return bd.getTime() >= start.getTime() && bd.getTime() < end.getTime();
  }), [budgets, start, end]);

  const budgetVsActual = useMemo(() => {
    const spendByCat = new Map<string, number>();
    periodExpenses.forEach((e) => spendByCat.set(e.category, (spendByCat.get(e.category) ?? 0) + Number(e.amount)));
    const limitByCat = new Map<string, number>();
    periodBudgets.forEach((b) => limitByCat.set(b.category, (limitByCat.get(b.category) ?? 0) + Number(b.limit_amount)));
    const cats = new Set([...spendByCat.keys(), ...limitByCat.keys()]);
    return Array.from(cats).map((cat) => ({
      name: cat,
      value: spendByCat.get(cat) ?? 0,
      secondary: limitByCat.get(cat) ?? 0,
    })).sort((a, b) => b.value - a.value);
  }, [periodExpenses, periodBudgets]);

  const debtChart = useMemo(() => [...debtRows]
    .sort((a, b) => Number(b.balance) - Number(a.balance))
    .map((d) => ({ name: d.name, value: Number(d.balance), secondary: Number(d.principal) })), [debtRows]);
  const totalDebtReduced = debtRows.reduce((s, d) => s + Math.max(0, Number(d.principal) - Number(d.balance)), 0);

  const savingsChart = useMemo(() => [...goalRows]
    .sort((a, b) => Number(b.current_amount) - Number(a.current_amount))
    .map((g) => ({ name: g.name, value: Number(g.current_amount), secondary: Number(g.target_amount) })), [goalRows]);

  const investmentChart = useMemo(() => [...investmentRows]
    .sort((a, b) => Number(b.current_value) - Number(a.current_value))
    .map((i) => ({ name: i.name, value: Number(i.current_value), secondary: Number(i.amount_invested) })), [investmentRows]);
  const totalInvested = investmentRows.reduce((s, i) => s + Number(i.amount_invested), 0);
  const totalCurrentValue = investmentRows.reduce((s, i) => s + Number(i.current_value), 0);

  function shiftOffset(delta: number) {
    setOffset((o) => o + delta);
  }

  const sectionsFor: Record<ReportId, { title: string; rows: ReportRow[]; total?: number; totalLabel?: string }> = {
    cashflow: {
      title: "Cash Flow",
      rows: [
        { label: "Total income", value: totalIncome },
        { label: "Total expenses", value: -totalExpenses },
        { label: "Net cash flow", value: netCashFlow },
      ],
      total: netCashFlow,
      totalLabel: "Net cash flow",
    },
    "income-expense": {
      title: "Income vs Expenses",
      rows: trailTotals.map((t) => ({ label: t.period, value: t.income, secondary: t.spending })),
    },
    networth: {
      title: "Net Worth Growth",
      rows: netWorthTrend.map((n) => ({ label: n.period, value: n.netWorth })),
      total: netWorthNow.net,
      totalLabel: "Current net worth",
    },
    budget: {
      title: "Budget Performance",
      rows: budgetVsActual.map((b) => ({ label: b.name, value: b.value, secondary: b.secondary })),
    },
    debt: {
      title: "Debt Reduction",
      rows: debtChart.map((d) => ({ label: d.name, value: d.value, secondary: d.secondary })),
      total: totalDebtReduced,
      totalLabel: "Total principal reduced",
    },
    savings: {
      title: "Savings Growth",
      rows: savingsChart.map((g) => ({ label: g.name, value: g.value, secondary: g.secondary })),
    },
    investment: {
      title: "Investment Growth",
      rows: investmentChart.map((i) => ({ label: i.name, value: i.value, secondary: i.secondary })),
      total: totalCurrentValue - totalInvested,
      totalLabel: "Total gain / loss",
    },
  };

  const allSections = REPORT_TABS.map((t) => sectionsFor[t.id]);

  function handleCsv() {
  function handleExcel() {
    exportExcel(allSections, `fanika-reports-${label.replace(/\s+/g, "-").toLowerCase()}`, { entity: who, period: label, currency });
  }
  function handleExcel() {
    exportExcel(allSections, `fanika-reports-${label.replace(/\s+/g, "-").toLowerCase()}`);
  }
  function handlePdf() {
    exportPdf({
      who,
      currency,
      reportTitle: "Consolidated Financial Report",
      periodLabel: label,
      sections: allSections,
    }, `fanika-reports-${label.replace(/\s+/g, "-").toLowerCase()}`);
  }
  async function handleEmail() {
    const meta = sectionsFor[tab];
    await emailReport({
      type: `report-${tab}`,
      period: label,
      title: `${meta.title} — ${label}`,
      summaryRows: meta.rows.map((r) => ({ label: r.label, value: formatCurrency(r.value, currency) })),
    });
  }

  const activeSectionEmpty = (() => {
    switch (tab) {
      case "cashflow":
      case "income-expense":
        return !hasPeriodData;
      case "networth":
        return accountRows.length === 0 && investmentRows.length === 0 && debtRows.length === 0;
      case "budget":
        return budgetVsActual.length === 0;
      case "debt":
        return debtRows.length === 0;
      case "savings":
        return goalRows.length === 0;
      case "investment":
        return investmentRows.length === 0;
      default:
        return true;
    }
  })();

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Select value={periodType} onValueChange={(v) => { setPeriodType(v as PeriodType); setOffset(0); }}>
              <SelectTrigger className="w-36" aria-label="Choose report period type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="quarter">Quarterly</SelectItem>
                <SelectItem value="year">Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="icon" onClick={() => shiftOffset(-1)} aria-label="Previous period">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-32 text-center text-sm font-medium">{label}</span>
            <Button variant="outline" size="icon" onClick={() => shiftOffset(1)} disabled={offset >= 0} aria-label="Next period">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as ReportId)}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
          {REPORT_TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="rounded-md border border-border data-[state=active]:border-primary">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{REPORT_TABS.find((t) => t.id === tab)?.label}</CardTitle>
            <CardDescription>{label}</CardDescription>
          </div>
          <ExportBar onCsv={handleCsv} onExcel={handleExcel} onPdf={handlePdf} onEmail={handleEmail} disabled={isLoading || activeSectionEmpty} />
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <SectionSkeleton />
          ) : activeSectionEmpty ? (
            <EmptyState
              message="There isn't enough data for this period yet. Add income, expenses, budgets, debts, goals or investments to see this report come to life."
              cta={<Button variant="outline" size="sm" onClick={() => shiftOffset(-1)} aria-label="Go to previous period">Check previous period</Button>}
            />
          ) : (
            <>
              {tab === "cashflow" && (
                <>
                  <BarRow data={[
                    { name: "Income", value: totalIncome },
                    { name: "Expenses", value: totalExpenses },
                    { name: "Net", value: netCashFlow },
                  ]} />
                  <TrendLine
                    data={trailTotals.map((t) => ({ period: t.period, net: t.net }))}
                    series={[{ key: "net", color: SERIES_COLORS.savings, label: "Net cash flow" }]}
                  />
                  <DataTable rows={sectionsFor.cashflow.rows} currency={currency} />
                </>
              )}

              {tab === "income-expense" && (
                <>
                  <TrendLine
                    data={trailTotals.map((t) => ({ period: t.period, income: t.income, spending: t.spending }))}
                    series={[
                      { key: "income", color: SERIES_COLORS.income, label: "Income" },
                      { key: "spending", color: SERIES_COLORS.spending, label: "Expenses" },
                    ]}
                  />
                  <DataTable rows={sectionsFor["income-expense"].rows} currency={currency} />
                </>
              )}

              {tab === "networth" && (
                <>
                  <TrendLine
                    data={netWorthTrend.map((n) => ({ period: n.period, netWorth: n.netWorth }))}
                    series={[{ key: "netWorth", color: SERIES_COLORS.netWorth, label: "Net worth" }]}
                  />
                  <DataTable rows={sectionsFor.networth.rows} currency={currency} />
                </>
              )}

              {tab === "budget" && (
                <>
                  <BarRow data={budgetVsActual.slice(0, 8)} />
                  <DataTable
                    rows={budgetVsActual.map((b) => ({ label: `${b.name} (spent / budgeted)`, value: b.value, secondary: b.secondary }))}
                    currency={currency}
                  />
                </>
              )}

              {tab === "debt" && (
                <>
                  <BarRow data={debtChart.slice(0, 8)} />
                  <DataTable rows={debtChart.map((d) => ({ label: `${d.name} (balance / principal)`, value: d.value, secondary: d.secondary }))} currency={currency} />
                </>
              )}

              {tab === "savings" && (
                <>
                  <BarRow data={savingsChart.slice(0, 8)} />
                  <DataTable rows={savingsChart.map((g) => ({ label: `${g.name} (saved / target)`, value: g.value, secondary: g.secondary }))} currency={currency} />
                </>
              )}

              {tab === "investment" && (
                <>
                  <BarRow data={investmentChart.slice(0, 8)} />
                  <DataTable rows={investmentChart.map((i) => ({ label: `${i.name} (value / invested)`, value: i.value, secondary: i.secondary }))} currency={currency} />
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page shell
// ---------------------------------------------------------------------------

function ReportsAndStatementsPage() {
  const [mainTab, setMainTab] = useState<"statements" | "reports">("statements");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 overflow-x-hidden p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-card">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Reports & Statements</h1>
            <p className="text-sm text-muted-foreground">{monthLabel()} · Financial statements and a consolidated reports hub — exportable anytime.</p>
          </div>
        </div>
      </div>

      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as typeof mainTab)}>
        <TabsList>
          <TabsTrigger value="statements">Financial statements</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="statements" className="mt-4">
          <StatementsTab />
        </TabsContent>
        <TabsContent value="reports" className="mt-4">
          <ReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
