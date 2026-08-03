import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { toast } from "sonner";
import {
  ChevronLeft, ChevronRight, Download, FileSpreadsheet, FileText, Sheet as SheetIcon,
} from "lucide-react";

import {
  useProfile, useAllExpenses, useAllIncomeEntries, useAllBudgets, useAccounts,
  useInvestments, useDebts, useGoals,
} from "@/lib/queries";
import { chartColorByRank, CHART_AXIS_TICK, CHART_GRID_STROKE, rankByValue, SERIES_COLORS } from "@/lib/chart-colors";
import { formatCurrency, formatPercent } from "@/lib/format";
import { computeNetWorth } from "@/lib/finance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Fanika" },
      { name: "description", content: "A consolidated reports hub: cash flow, income vs expenses, net worth, budgets, debt, savings and investment growth for any monthly, quarterly or annual period." },
      { property: "og:title", content: "Reports — Fanika" },
      { property: "og:description", content: "One place to view and export every Fanika financial report by month, quarter, or year." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportsPage,
});

// ---------------------------------------------------------------------------
// Period helpers
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

// ---------------------------------------------------------------------------
// Report types
// ---------------------------------------------------------------------------

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

type Row = { label: string; value: number; secondary?: number };

// ---------------------------------------------------------------------------
// Export helpers
// ---------------------------------------------------------------------------

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function toCsv(rows: Row[]): string {
  const header = "Label,Value,Secondary";
  const lines = rows.map((r) => [r.label.replace(/"/g, '""'), r.value, r.secondary ?? ""].map((v) => `"${v}"`).join(","));
  return [header, ...lines].join("\n");
}

async function exportCsv(rows: Row[], fileBase: string) {
  try {
    if (!rows.length) throw new Error("No data");
    downloadBlob(new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" }), `${fileBase}.csv`);
    toast.success("CSV exported");
  } catch (e) {
    console.error(e);
    toast.error("Failed to export CSV");
  }
}

async function exportExcel(sections: { title: string; rows: Row[] }[], fileBase: string) {
  try {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    sections.forEach((s) => {
      const data = [["Label", "Value", "Secondary"], ...s.rows.map((r) => [r.label, r.value, r.secondary ?? ""])];
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, s.title.slice(0, 31) || "Sheet");
    });
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    downloadBlob(new Blob([out], { type: "application/octet-stream" }), `${fileBase}.xlsx`);
    toast.success("Excel workbook exported");
  } catch (e) {
    console.error(e);
    toast.error("Failed to export Excel workbook");
  }
}

async function exportPdf(payload: { who: string; currency: string; reportTitle: string; periodLabel: string; sections: { title: string; total?: number; totalLabel?: string; rows: Row[] }[] }, fileBase: string) {
  try {
    const { downloadReportPdf } = await import("@/components/report-pdf-lazy");
    await downloadReportPdf(payload, `${fileBase}.pdf`);
    toast.success("PDF report exported");
  } catch (e) {
    console.error(e);
    toast.error("Failed to export PDF");
  }
}

// ---------------------------------------------------------------------------
// Presentational bits
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

function ExportBar({ onCsv, onExcel, onPdf, disabled }: { onCsv: () => void; onExcel: () => void; onPdf: () => void; disabled: boolean }) {
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

function DataTable({ rows, currency }: { rows: Row[]; currency: string }) {
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
// Page
// ---------------------------------------------------------------------------

function ReportsPage() {
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

  // Trailing 6 periods (oldest → newest, last entry is the selected period).
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

  // Reconstruct an approximate net worth trend by unwinding net cash flow of
  // later periods from the current snapshot (no historical balances exist).
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

  // -------------------------------------------------------------------
  // Per-tab rows/sections used for exports
  // -------------------------------------------------------------------

  const sectionsFor: Record<ReportId, { title: string; rows: Row[]; total?: number; totalLabel?: string }> = {
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
    const rows = sectionsFor[tab].rows;
    exportCsv(rows, `fanika-${tab}-${label.replace(/\s+/g, "-").toLowerCase()}`);
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
    <div className="mx-auto w-full max-w-6xl space-y-6 overflow-x-hidden p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">A consolidated view of your cash flow, budgets, debt, savings and investments — exportable anytime.</p>
      </div>

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
          <ExportBar onCsv={handleCsv} onExcel={handleExcel} onPdf={handlePdf} disabled={isLoading || activeSectionEmpty} />
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
