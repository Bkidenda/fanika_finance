import { createFileRoute } from "@tanstack/react-router";
import { Component, useEffect, useMemo, useState, lazy, Suspense, type ReactNode } from "react";

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

const StatementPdfButtons = lazy(() => import("@/components/statement-pdf-download-lazy"));

async function loadSummaryDownloader() {
  const mod = await import("@/components/statement-pdf-download-lazy");
  return mod.downloadSummaryPdf;
}




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
  const [pdfRequested, setPdfRequested] = useState(false);
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
  const filenamePdf = `fanika-statement-${scope}-${period}.pdf`;

  function downloadTxt() {
    const lines: string[] = [];
    lines.push(`FANIKA — ${range.label}`);
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
    a.download = `fanika-statement-${period}.txt`;
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
            {mounted && pdfRequested ? (
              <PdfLoadBoundary
                fallback={
                  <Button className="w-full" variant="outline" onClick={() => setPdfRequested(false)}>
                    <Download className="mr-1 h-4 w-4" />Retry PDF
                  </Button>
                }
              >
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
              </PdfLoadBoundary>
            ) : mounted ? (
              <Button className="w-full" onClick={() => setPdfRequested(true)} disabled={data.isLoading}>
                <Download className="mr-1 h-4 w-4" />Prepare PDF
              </Button>
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
            <StatementHeader
              entity={profile.data?.full_name || profile.data?.email || "Account holder"}
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
              entity={profile.data?.full_name || profile.data?.email || "Account holder"}
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
              entity={profile.data?.full_name || profile.data?.email || "Account holder"}
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

function Row({ label, value }: { label: string; value: string; positive?: boolean; negative?: boolean }) {
  return (
    <div className="flex justify-between border-b py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums font-medium">{value}</span>
    </div>
  );
}


