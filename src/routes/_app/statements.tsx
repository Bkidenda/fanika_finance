import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, lazy, Suspense } from "react";

import {
  useProfile, useAccounts, useInvestments, useDebts, useSubscriptions,
  useIncomeEntries, useExpenses, useDeductions,
} from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, monthKey, monthLabel } from "@/lib/format";
import {
  computeBreakdown, computeNetWorth,
  computeIncomeStatement, computeBalanceSheet, computeCashFlow,
} from "@/lib/finance";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, Download } from "lucide-react";

export const Route = createFileRoute("/_app/statements")({ component: Statements });

const StatementPdfDownload = lazy(() => import("@/components/statement-pdf-download.client"));


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

function Statements() {
  const { user } = useAuth();
  const profile = useProfile();
  const accounts = useAccounts();
  const investments = useInvestments();
  const debts = useDebts();
  const subs = useSubscriptions();
  const incomeMonth = useIncomeEntries();
  const expensesMonth = useExpenses();
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
  const cashFlow = computeCashFlow({
    period: range.label,
    totalRevenue,
    totalExpenses: incomeStatement.totalExpenses,
    investmentContributions: investingOutflows,
    tithe: breakdown.tithe,
  });

  const nw = computeNetWorth({
    accounts: accounts.data ?? [],
    investments: investments.data ?? [],
    debts: debts.data ?? [],
  });

  const fmt = (n: number) => formatCurrency(n, currency);
  const filenamePdf = `nuru-statement-${scope}-${period}.pdf`;

  function downloadTxt() {
    const lines: string[] = [];
    lines.push(`NURU STEWARD — ${range.label}`);
    lines.push(`Prepared for ${profile.data?.full_name ?? profile.data?.email ?? "Account holder"}`);
    lines.push(`Generated ${new Date().toLocaleString()}`);
    lines.push("");
    lines.push("=== INCOME STATEMENT ===");
    lines.push(`Total revenue: ${fmt(incomeStatement.totalRevenue)}`);
    incomeStatement.revenue.forEach((r) => lines.push(`  ${r.label}: ${fmt(r.amount)}`));
    lines.push(`Total expenses: ${fmt(incomeStatement.totalExpenses)}`);
    incomeStatement.expenses.forEach((r) => lines.push(`  ${r.label}: ${fmt(r.amount)}`));
    lines.push(`Tithe & giving: ${fmt(incomeStatement.tithe)}`);
    lines.push(`Custom deductions: ${fmt(incomeStatement.deductions)}`);
    lines.push(`Net income: ${fmt(incomeStatement.netIncome)}`);
    lines.push(`Savings rate: ${Math.round(incomeStatement.savingsRate * 100)}%`);
    lines.push("");
    lines.push("=== BALANCE SHEET ===");
    lines.push(`Cash & bank: ${fmt(balanceSheet.cashAndBank)}`);
    lines.push(`Investments: ${fmt(balanceSheet.investments)}`);
    lines.push(`Total assets: ${fmt(balanceSheet.totalAssets)}`);
    lines.push(`Total liabilities: ${fmt(balanceSheet.totalLiabilities)}`);
    lines.push(`NET WORTH: ${fmt(balanceSheet.netWorth)}`);
    lines.push("");
    lines.push("=== CASH FLOW ===");
    lines.push(`Operating inflows: ${fmt(cashFlow.operatingInflows)}`);
    lines.push(`Operating outflows: ${fmt(cashFlow.operatingOutflows)}`);
    lines.push(`Investing outflows: ${fmt(cashFlow.investingOutflows)}`);
    lines.push(`Tithe & giving: ${fmt(cashFlow.titheAndGiving)}`);
    lines.push(`Net cash flow: ${fmt(cashFlow.netCashFlow)}`);
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `nuru-steward-${period}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-card">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Statements</h2>
            <p className="text-sm text-muted-foreground">{monthLabel()} · Income statement, balance sheet & cash flow.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTxt}><Download className="mr-1 h-4 w-4" /> Download report (.txt)</Button>
        </div>
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
              <Suspense fallback={<Button className="w-full" disabled><Download className="mr-1 h-4 w-4" />Preparing PDF…</Button>}>
                <StatementPdfDownload
                  fileName={filenamePdf}
                  title={`${scope === "month" ? "Monthly" : "Quarterly"} statement — ${range.label}`}
                  who={profile.data?.full_name || profile.data?.email || "Account holder"}
                  currency={currency}
                  income={incomeStatement}
                  balance={balanceSheet}
                  cashFlow={cashFlow}
                  disabled={data.isLoading}
                />
              </Suspense>
            ) : (
              <Button className="w-full" disabled><Download className="mr-1 h-4 w-4" />Preparing PDF…</Button>
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

        <TabsContent value="income" className="mt-4">
          <div className="rounded-2xl border bg-card p-4 md:p-6 shadow-card">
            <SectionTitle title="Revenue" subtitle={range.label} />
            <StatementList lines={incomeStatement.revenue.length ? incomeStatement.revenue : [{ label: "No income recorded", amount: 0 }]} fmt={fmt} />
            <TotalRow label="Total revenue" value={fmt(incomeStatement.totalRevenue)} />

            <SectionTitle title="Expenses by category" className="mt-6" />
            <StatementList lines={incomeStatement.expenses.length ? incomeStatement.expenses : [{ label: "No expenses recorded", amount: 0 }]} fmt={fmt} />
            <TotalRow label="Total expenses" value={fmt(incomeStatement.totalExpenses)} />

            {titheEnabled && (
              <div className="mt-3 flex justify-between border-b py-2 text-sm"><span>Tithe & giving</span><span className="font-medium tabular-nums">{fmt(incomeStatement.tithe)}</span></div>
            )}
            <div className="flex justify-between border-b py-2 text-sm"><span>Custom deductions</span><span className="font-medium tabular-nums">{fmt(incomeStatement.deductions)}</span></div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-secondary/50 p-4">
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
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <SectionTitle title="Assets" />
                <StatementList lines={balanceSheet.assetLines.length ? balanceSheet.assetLines.map((l) => ({ label: l.name, amount: l.amount })) : [{ label: "No assets", amount: 0 }]} fmt={fmt} />
                <div className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">Cash & bank</span><span className="tabular-nums">{fmt(balanceSheet.cashAndBank)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Investments</span><span className="tabular-nums">{fmt(balanceSheet.investments)}</span></div>
                <TotalRow label="Total assets" value={fmt(balanceSheet.totalAssets)} accent />
              </div>
              <div>
                <SectionTitle title="Liabilities" />
                <StatementList lines={balanceSheet.liabilityLines.length ? balanceSheet.liabilityLines.map((l) => ({ label: l.name, amount: l.amount })) : [{ label: "No liabilities", amount: 0 }]} fmt={fmt} />
                <TotalRow label="Total liabilities" value={fmt(balanceSheet.totalLiabilities)} accent />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between rounded-xl bg-gradient-hero p-4 text-primary-foreground shadow-elevated">
              <div>
                <div className="text-xs uppercase tracking-wider opacity-80">Net worth</div>
                <div className="text-2xl font-bold tabular-nums">{fmt(balanceSheet.netWorth)}</div>
              </div>
              <div className="text-right text-xs opacity-80">
                Assets {fmt(nw.assets)}<br/>Liabilities {fmt(nw.liabilities)}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cash" className="mt-4">
          <div className="rounded-2xl border bg-card p-4 md:p-6 shadow-card">
            <SectionTitle title="Cash flow" subtitle={range.label} />
            <div className="mt-2 space-y-2 text-sm">
              <Row label="Operating inflows (income)" value={fmt(cashFlow.operatingInflows)} positive />
              <Row label="Operating outflows (expenses)" value={fmt(-cashFlow.operatingOutflows)} negative />
              <Row label="Investing outflows" value={fmt(-cashFlow.investingOutflows)} negative />
              <Row label="Tithe & giving" value={fmt(-cashFlow.titheAndGiving)} negative />
            </div>
            <div className={`mt-4 flex items-center justify-between rounded-xl p-4 ${cashFlow.netCashFlow >= 0 ? "bg-emerald-500/10 text-emerald-700" : "bg-rose-500/10 text-rose-700"}`}>
              <span className="text-sm font-medium">Net cash flow</span>
              <span className="text-xl font-bold tabular-nums">{fmt(cashFlow.netCashFlow)}</span>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SectionTitle({ title, subtitle, className }: { title: string; subtitle?: string; className?: string }) {
  return (
    <div className={className}>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
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

function TotalRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`mt-2 flex justify-between rounded-lg px-2 py-2 text-sm font-semibold ${accent ? "bg-secondary/70" : ""}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function Row({ label, value, positive, negative }: { label: string; value: string; positive?: boolean; negative?: boolean }) {
  return (
    <div className="flex justify-between border-b py-2">
      <span>{label}</span>
      <span className={`tabular-nums font-medium ${positive ? "text-emerald-600" : ""} ${negative ? "text-rose-600" : ""}`}>{value}</span>
    </div>
  );
}

