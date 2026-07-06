import { pdf, Document, Page, Text, View, StyleSheet, type DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import type {
  computeIncomeStatement,
  computeBalanceSheet,
  computeCashFlow,
} from "@/lib/finance";
import { Button } from "@/components/ui/button";
import { Download, FileDown, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#2a1a10" },
  brand: { fontSize: 9, letterSpacing: 2, color: "#7a4a1f", textAlign: "center" },
  entity: { fontSize: 11, marginTop: 4, textAlign: "center", color: "#4a2f1c" },
  docTitle: { fontSize: 15, fontWeight: 700, marginTop: 4, textAlign: "center", color: "#3a2410", textTransform: "uppercase" },
  period: { fontSize: 9, textAlign: "center", color: "#6b5545", marginTop: 2 },
  units: { fontSize: 8, textAlign: "center", color: "#8a7565", marginTop: 2, marginBottom: 10 },
  ruleTop: { borderBottom: 2, borderColor: "#7a4a1f", marginBottom: 10 },
  h2: { fontSize: 10, fontWeight: 700, marginTop: 12, marginBottom: 4, color: "#7a4a1f", textTransform: "uppercase", letterSpacing: 1 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottom: 0.5, borderColor: "#d8c8b8" },
  label: { color: "#4a3828" },
  val: { fontWeight: 500 },
  sub: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderTop: 1, borderColor: "#7a4a1f", marginTop: 2, fontWeight: 700 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderTop: 2, borderBottom: 2, borderColor: "#3a2410", marginTop: 4, fontWeight: 700, color: "#3a2410" },
  twoCol: { flexDirection: "row", gap: 20, marginTop: 6 },
  col: { flex: 1 },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, fontSize: 8, color: "#a08972", textAlign: "center", borderTop: 0.5, borderColor: "#d8c8b8", paddingTop: 6 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  kpi: { width: "48%", padding: 10, backgroundColor: "#f7f0e6", borderRadius: 6, borderLeft: 3, borderColor: "#7a4a1f" },
  kpiLabel: { fontSize: 8, color: "#7a4a1f", textTransform: "uppercase", letterSpacing: 1 },
  kpiValue: { fontSize: 14, fontWeight: 700, color: "#3a2410", marginTop: 2 },
});

function fmtParens(currency: string, n: number) {
  const abs = Math.abs(n);
  const s = `${currency} ${abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return n < 0 ? `(${s})` : s;
}

type StatementProps = {
  title: string;
  who: string;
  currency: string;
  income: ReturnType<typeof computeIncomeStatement>;
  balance: ReturnType<typeof computeBalanceSheet>;
  cashFlow: ReturnType<typeof computeCashFlow>;
};

function Header({ who, docTitle, period, currency }: { who: string; docTitle: string; period: string; currency: string }) {
  return (
    <View>
      <Text style={styles.brand}>FANIKA</Text>
      <Text style={styles.entity}>{who}</Text>
      <Text style={styles.docTitle}>{docTitle}</Text>
      <Text style={styles.period}>{period}</Text>
      <Text style={styles.units}>All amounts expressed in {currency}</Text>
      <View style={styles.ruleTop} />
    </View>
  );
}

function IncomePage(p: StatementProps) {
  const fmt = (n: number) => fmtParens(p.currency, n);
  const operatingIncome = p.income.totalRevenue - p.income.totalExpenses;
  return (
    <Page size="A4" style={styles.page}>
      <Header who={p.who} docTitle="Statement of Income & Expenditure" period={`For the period ended ${p.title.replace(/^.*—\s*/, "")}`} currency={p.currency} />
      <Text style={styles.h2}>Revenue</Text>
      {(p.income.revenue.length ? p.income.revenue : [{ label: "No income recorded", amount: 0 }]).map((r, i) => (
        <View key={`r-${i}`} style={styles.row}><Text style={styles.label}>{r.label}</Text><Text style={styles.val}>{fmt(r.amount)}</Text></View>
      ))}
      <View style={styles.sub}><Text>Total revenue</Text><Text>{fmt(p.income.totalRevenue)}</Text></View>

      <Text style={styles.h2}>Operating expenses</Text>
      {(p.income.expenses.length ? p.income.expenses : [{ label: "No expenses recorded", amount: 0 }]).map((r, i) => (
        <View key={`e-${i}`} style={styles.row}><Text style={styles.label}>{r.label}</Text><Text style={styles.val}>{fmt(r.amount)}</Text></View>
      ))}
      <View style={styles.sub}><Text>Total operating expenses</Text><Text>{fmt(p.income.totalExpenses)}</Text></View>
      <View style={styles.sub}><Text>Operating income</Text><Text>{fmt(operatingIncome)}</Text></View>

      <Text style={styles.h2}>Giving & deductions</Text>
      <View style={styles.row}><Text style={styles.label}>Tithe & giving</Text><Text style={styles.val}>{fmt(p.income.tithe)}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Custom deductions</Text><Text style={styles.val}>{fmt(p.income.deductions)}</Text></View>
      <View style={styles.sub}><Text>Total deductions</Text><Text>{fmt(p.income.tithe + p.income.deductions)}</Text></View>
      <View style={styles.totalRow}><Text>NET INCOME</Text><Text>{fmt(p.income.netIncome)}</Text></View>
      <Text style={styles.footer}>Fanika · Confidential · Prepared for personal financial records</Text>
    </Page>
  );
}

function BalancePage(p: StatementProps) {
  const fmt = (n: number) => fmtParens(p.currency, n);
  return (
    <Page size="A4" style={styles.page}>
      <Header who={p.who} docTitle="Statement of Financial Position" period={`As at ${p.title.replace(/^.*—\s*/, "")}`} currency={p.currency} />
      <View style={styles.twoCol}>
        <View style={styles.col}>
          <Text style={styles.h2}>Assets</Text>
          {p.balance.assetLines.length ? p.balance.assetLines.map((l, i) => (
            <View key={`a-${i}`} style={styles.row}><Text style={styles.label}>{l.name}</Text><Text style={styles.val}>{fmt(l.amount)}</Text></View>
          )) : <View style={styles.row}><Text style={styles.label}>No assets</Text><Text style={styles.val}>{fmt(0)}</Text></View>}
          <View style={styles.sub}><Text>Cash & bank</Text><Text>{fmt(p.balance.cashAndBank)}</Text></View>
          <View style={styles.sub}><Text>Investments</Text><Text>{fmt(p.balance.investments)}</Text></View>
          <View style={styles.totalRow}><Text>TOTAL ASSETS</Text><Text>{fmt(p.balance.totalAssets)}</Text></View>
        </View>
        <View style={styles.col}>
          <Text style={styles.h2}>Liabilities</Text>
          {p.balance.liabilityLines.length ? p.balance.liabilityLines.map((l, i) => (
            <View key={`l-${i}`} style={styles.row}><Text style={styles.label}>{l.name}</Text><Text style={styles.val}>{fmt(l.amount)}</Text></View>
          )) : <View style={styles.row}><Text style={styles.label}>No liabilities</Text><Text style={styles.val}>{fmt(0)}</Text></View>}
          <View style={styles.sub}><Text>Total liabilities</Text><Text>{fmt(p.balance.totalLiabilities)}</Text></View>

          <Text style={styles.h2}>Equity</Text>
          {p.balance.equityLines.map((l, i) => (
            <View key={`eq-${i}`} style={styles.row}><Text style={styles.label}>{l.name}</Text><Text style={styles.val}>{fmt(l.amount)}</Text></View>
          ))}
          <View style={styles.sub}><Text>Total equity</Text><Text>{fmt(p.balance.totalEquity)}</Text></View>
          <View style={styles.totalRow}><Text>TOTAL LIABILITIES & EQUITY</Text><Text>{fmt(p.balance.totalLiabilitiesAndEquity)}</Text></View>
        </View>
      </View>
      <Text style={{ marginTop: 14, fontSize: 8, color: "#7a4a1f", textAlign: "center" }}>
        Accounting equation: Assets = Liabilities + Equity → {fmt(p.balance.totalAssets)} = {fmt(p.balance.totalLiabilitiesAndEquity)}
      </Text>
      <Text style={styles.footer}>Fanika · Confidential · Prepared for personal financial records</Text>
    </Page>
  );
}

function CashPage(p: StatementProps) {
  const fmt = (n: number) => fmtParens(p.currency, n);
  const netOpAfterGiving = p.cashFlow.netOperating - p.cashFlow.titheAndGiving;
  return (
    <Page size="A4" style={styles.page}>
      <Header who={p.who} docTitle="Statement of Cash Flows" period={`For the period ended ${p.title.replace(/^.*—\s*/, "")}`} currency={p.currency} />
      <Text style={styles.h2}>Cash flows from operating activities</Text>
      <View style={styles.row}><Text style={styles.label}>Cash received from income</Text><Text style={styles.val}>{fmt(p.cashFlow.operatingInflows)}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Cash paid for expenses</Text><Text style={styles.val}>{fmt(-p.cashFlow.operatingOutflows)}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Tithe & giving</Text><Text style={styles.val}>{fmt(-p.cashFlow.titheAndGiving)}</Text></View>
      <View style={styles.sub}><Text>Net cash from operating activities</Text><Text>{fmt(netOpAfterGiving)}</Text></View>

      <Text style={styles.h2}>Cash flows from investing activities</Text>
      <View style={styles.row}><Text style={styles.label}>Investment contributions & savings</Text><Text style={styles.val}>{fmt(-p.cashFlow.investingOutflows)}</Text></View>
      <View style={styles.sub}><Text>Net cash used in investing activities</Text><Text>{fmt(p.cashFlow.netInvesting)}</Text></View>

      <Text style={styles.h2}>Cash flows from financing activities</Text>
      <View style={styles.row}><Text style={styles.label}>Debt principal repayments</Text><Text style={styles.val}>{fmt(-p.cashFlow.financingOutflows)}</Text></View>
      <View style={styles.sub}><Text>Net cash used in financing activities</Text><Text>{fmt(p.cashFlow.netFinancing)}</Text></View>
      <View style={styles.totalRow}><Text>NET CHANGE IN CASH</Text><Text>{fmt(p.cashFlow.netCashFlow)}</Text></View>
      <Text style={styles.footer}>Fanika · Confidential · Prepared for personal financial records</Text>
    </Page>
  );
}

export type SummaryData = {
  who: string;
  currency: string;
  asOf: string;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  cashAndBank: number;
  investments: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyNetIncome: number;
  savingsRate: number;
  tithe: number;
  topExpenses: { label: string; amount: number }[];
  accounts: { name: string; balance: number }[];
  debts: { name: string; balance: number }[];
};

function SummaryPage(s: SummaryData) {
  const fmt = (n: number) => fmtParens(s.currency, n);
  return (
    <Page size="A4" style={styles.page}>
      <Header who={s.who} docTitle="Personal Financial Status Report" period={`As at ${s.asOf}`} currency={s.currency} />

      <Text style={styles.h2}>Financial position at a glance</Text>
      <View style={styles.kpiGrid}>
        <View style={styles.kpi}><Text style={styles.kpiLabel}>Net worth</Text><Text style={styles.kpiValue}>{fmt(s.netWorth)}</Text></View>
        <View style={styles.kpi}><Text style={styles.kpiLabel}>Total assets</Text><Text style={styles.kpiValue}>{fmt(s.totalAssets)}</Text></View>
        <View style={styles.kpi}><Text style={styles.kpiLabel}>Total liabilities</Text><Text style={styles.kpiValue}>{fmt(s.totalLiabilities)}</Text></View>
        <View style={styles.kpi}><Text style={styles.kpiLabel}>Cash & bank</Text><Text style={styles.kpiValue}>{fmt(s.cashAndBank)}</Text></View>
        <View style={styles.kpi}><Text style={styles.kpiLabel}>Investments</Text><Text style={styles.kpiValue}>{fmt(s.investments)}</Text></View>
        <View style={styles.kpi}><Text style={styles.kpiLabel}>Savings rate</Text><Text style={styles.kpiValue}>{Math.round(s.savingsRate * 100)}%</Text></View>
      </View>

      <Text style={styles.h2}>This month</Text>
      <View style={styles.row}><Text style={styles.label}>Total revenue</Text><Text style={styles.val}>{fmt(s.monthlyRevenue)}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Total expenses</Text><Text style={styles.val}>{fmt(s.monthlyExpenses)}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Tithe & giving</Text><Text style={styles.val}>{fmt(s.tithe)}</Text></View>
      <View style={styles.sub}><Text>Net income</Text><Text>{fmt(s.monthlyNetIncome)}</Text></View>

      <Text style={styles.h2}>Top expense categories</Text>
      {(s.topExpenses.length ? s.topExpenses : [{ label: "No expenses recorded", amount: 0 }]).map((r, i) => (
        <View key={`t-${i}`} style={styles.row}><Text style={styles.label}>{r.label}</Text><Text style={styles.val}>{fmt(r.amount)}</Text></View>
      ))}

      <Text style={styles.h2}>Accounts</Text>
      {(s.accounts.length ? s.accounts : [{ name: "No accounts", balance: 0 }]).map((a, i) => (
        <View key={`ac-${i}`} style={styles.row}><Text style={styles.label}>{a.name}</Text><Text style={styles.val}>{fmt(a.balance)}</Text></View>
      ))}

      <Text style={styles.h2}>Outstanding debts</Text>
      {(s.debts.length ? s.debts : [{ name: "No debts", balance: 0 }]).map((d, i) => (
        <View key={`db-${i}`} style={styles.row}><Text style={styles.label}>{d.name}</Text><Text style={styles.val}>{fmt(d.balance)}</Text></View>
      ))}

      <Text style={styles.footer}>Fanika · Confidential financial summary · Generated {new Date().toLocaleDateString()}</Text>
    </Page>
  );
}

async function downloadPdf(doc: ReactElement<DocumentProps>, fileName: string) {
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

type Props = StatementProps & {
  fileBase: string;
  currentTab: "income" | "balance" | "cash";
  disabled?: boolean;
};

export default function StatementPdfButtons(props: Props) {
  const { fileBase, currentTab, disabled, ...doc } = props;
  const [busy, setBusy] = useState<"one" | "all" | null>(null);

  async function handleOne() {
    setBusy("one");
    try {
      const page = currentTab === "income" ? IncomePage(doc) : currentTab === "balance" ? BalancePage(doc) : CashPage(doc);
      const which = currentTab === "income" ? "income-statement" : currentTab === "balance" ? "balance-sheet" : "cash-flow";
      await downloadPdf(<Document>{page}</Document>, `${fileBase}-${which}.pdf`);
    } catch (e) {
      toast.error("Failed to generate PDF");
      console.error(e);
    } finally { setBusy(null); }
  }

  async function handleAll() {
    setBusy("all");
    try {
      await downloadPdf(
        <Document>{IncomePage(doc)}{BalancePage(doc)}{CashPage(doc)}</Document>,
        `${fileBase}-full.pdf`,
      );
    } catch (e) {
      toast.error("Failed to generate PDF");
      console.error(e);
    } finally { setBusy(null); }
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row">
      <Button className="flex-1" onClick={handleOne} disabled={disabled || busy !== null}>
        <Download className="mr-1 h-4 w-4" />{busy === "one" ? "Preparing…" : "Download PDF"}
      </Button>
      <Button variant="outline" className="flex-1" onClick={handleAll} disabled={disabled || busy !== null}>
        <FileDown className="mr-1 h-4 w-4" />{busy === "all" ? "Preparing…" : "Download All"}
      </Button>
    </div>
  );
}

export async function downloadSummaryPdf(summary: SummaryData, fileName: string) {
  await downloadPdf(<Document><SummaryPage {...summary} /></Document>, fileName);
}

export const _summaryIcon = FileText;
