import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type {
  computeIncomeStatement,
  computeBalanceSheet,
  computeCashFlow,
} from "@/lib/finance";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

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
});

type Props = {
  title: string;
  who: string;
  currency: string;
  income: ReturnType<typeof computeIncomeStatement>;
  balance: ReturnType<typeof computeBalanceSheet>;
  cashFlow: ReturnType<typeof computeCashFlow>;
  fileName: string;
  disabled?: boolean;
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

function StatementDoc(props: Omit<Props, "fileName" | "disabled">) {
  const fmt = (n: number) => `${props.currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const { income, balance, cashFlow } = props;
  const operatingIncome = income.totalRevenue - income.totalExpenses;
  const netOpAfterGiving = cashFlow.netOperating - cashFlow.titheAndGiving;

  return (
    <Document>
      {/* Page 1 — Income Statement */}
      <Page size="A4" style={styles.page}>
        <Header who={props.who} docTitle="Statement of Income & Expenditure" period={`For the period ended ${props.title.replace(/^.*—\s*/, "")}`} currency={props.currency} />

        <Text style={styles.h2}>Revenue</Text>
        {(income.revenue.length ? income.revenue : [{ label: "No income recorded", amount: 0 }]).map((r, i) => (
          <View key={`r-${i}`} style={styles.row}><Text style={styles.label}>{r.label}</Text><Text style={styles.val}>{fmt(r.amount)}</Text></View>
        ))}
        <View style={styles.sub}><Text>Total revenue</Text><Text>{fmt(income.totalRevenue)}</Text></View>

        <Text style={styles.h2}>Operating expenses</Text>
        {(income.expenses.length ? income.expenses : [{ label: "No expenses recorded", amount: 0 }]).map((r, i) => (
          <View key={`e-${i}`} style={styles.row}><Text style={styles.label}>{r.label}</Text><Text style={styles.val}>{fmt(r.amount)}</Text></View>
        ))}
        <View style={styles.sub}><Text>Total operating expenses</Text><Text>{fmt(income.totalExpenses)}</Text></View>

        <View style={styles.sub}><Text>Operating income</Text><Text>{fmt(operatingIncome)}</Text></View>

        <Text style={styles.h2}>Giving & deductions</Text>
        <View style={styles.row}><Text style={styles.label}>Tithe & giving</Text><Text style={styles.val}>{fmt(income.tithe)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Custom deductions</Text><Text style={styles.val}>{fmt(income.deductions)}</Text></View>
        <View style={styles.sub}><Text>Total deductions</Text><Text>{fmt(income.tithe + income.deductions)}</Text></View>

        <View style={styles.totalRow}><Text>NET INCOME</Text><Text>{fmt(income.netIncome)}</Text></View>

        <Text style={styles.footer}>Fanika · Confidential · Prepared for personal financial records</Text>
      </Page>

      {/* Page 2 — Balance Sheet */}
      <Page size="A4" style={styles.page}>
        <Header who={props.who} docTitle="Statement of Financial Position" period={`As at ${props.title.replace(/^.*—\s*/, "")}`} currency={props.currency} />

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.h2}>Assets</Text>
            {balance.assetLines.length ? balance.assetLines.map((l, i) => (
              <View key={`a-${i}`} style={styles.row}><Text style={styles.label}>{l.name}</Text><Text style={styles.val}>{fmt(l.amount)}</Text></View>
            )) : <View style={styles.row}><Text style={styles.label}>No assets</Text><Text style={styles.val}>{fmt(0)}</Text></View>}
            <View style={styles.sub}><Text>Cash & bank</Text><Text>{fmt(balance.cashAndBank)}</Text></View>
            <View style={styles.sub}><Text>Investments</Text><Text>{fmt(balance.investments)}</Text></View>
            <View style={styles.totalRow}><Text>TOTAL ASSETS</Text><Text>{fmt(balance.totalAssets)}</Text></View>
          </View>

          <View style={styles.col}>
            <Text style={styles.h2}>Liabilities</Text>
            {balance.liabilityLines.length ? balance.liabilityLines.map((l, i) => (
              <View key={`l-${i}`} style={styles.row}><Text style={styles.label}>{l.name}</Text><Text style={styles.val}>{fmt(l.amount)}</Text></View>
            )) : <View style={styles.row}><Text style={styles.label}>No liabilities</Text><Text style={styles.val}>{fmt(0)}</Text></View>}
            <View style={styles.sub}><Text>Total liabilities</Text><Text>{fmt(balance.totalLiabilities)}</Text></View>

            <Text style={styles.h2}>Equity</Text>
            {balance.equityLines.map((l, i) => (
              <View key={`eq-${i}`} style={styles.row}><Text style={styles.label}>{l.name}</Text><Text style={styles.val}>{fmt(l.amount)}</Text></View>
            ))}
            <View style={styles.sub}><Text>Total equity</Text><Text>{fmt(balance.totalEquity)}</Text></View>

            <View style={styles.totalRow}><Text>TOTAL LIABILITIES & EQUITY</Text><Text>{fmt(balance.totalLiabilitiesAndEquity)}</Text></View>
          </View>
        </View>

        <Text style={{ marginTop: 14, fontSize: 8, color: "#7a4a1f", textAlign: "center" }}>
          Accounting equation: Assets = Liabilities + Equity → {fmt(balance.totalAssets)} = {fmt(balance.totalLiabilitiesAndEquity)}
        </Text>

        <Text style={styles.footer}>Fanika · Confidential · Prepared for personal financial records</Text>
      </Page>

      {/* Page 3 — Cash Flow */}
      <Page size="A4" style={styles.page}>
        <Header who={props.who} docTitle="Statement of Cash Flows" period={`For the period ended ${props.title.replace(/^.*—\s*/, "")}`} currency={props.currency} />

        <Text style={styles.h2}>Cash flows from operating activities</Text>
        <View style={styles.row}><Text style={styles.label}>Cash received from income</Text><Text style={styles.val}>{fmt(cashFlow.operatingInflows)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Cash paid for expenses</Text><Text style={styles.val}>{fmt(-cashFlow.operatingOutflows)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Tithe & giving</Text><Text style={styles.val}>{fmt(-cashFlow.titheAndGiving)}</Text></View>
        <View style={styles.sub}><Text>Net cash from operating activities</Text><Text>{fmt(netOpAfterGiving)}</Text></View>

        <Text style={styles.h2}>Cash flows from investing activities</Text>
        <View style={styles.row}><Text style={styles.label}>Investment contributions & savings</Text><Text style={styles.val}>{fmt(-cashFlow.investingOutflows)}</Text></View>
        <View style={styles.sub}><Text>Net cash used in investing activities</Text><Text>{fmt(cashFlow.netInvesting)}</Text></View>

        <Text style={styles.h2}>Cash flows from financing activities</Text>
        <View style={styles.row}><Text style={styles.label}>Debt principal repayments</Text><Text style={styles.val}>{fmt(-cashFlow.financingOutflows)}</Text></View>
        <View style={styles.sub}><Text>Net cash used in financing activities</Text><Text>{fmt(cashFlow.netFinancing)}</Text></View>

        <View style={styles.totalRow}><Text>NET CHANGE IN CASH</Text><Text>{fmt(cashFlow.netCashFlow)}</Text></View>

        <Text style={styles.footer}>Fanika · Confidential · Prepared for personal financial records</Text>
      </Page>
    </Document>
  );
}

export default function StatementPdfDownload(props: Props) {
  const { fileName, disabled, ...docProps } = props;
  return (
    <PDFDownloadLink fileName={fileName} document={<StatementDoc {...docProps} />}>
      {({ loading }) => (
        <Button className="w-full" disabled={loading || disabled}>
          <Download className="mr-1 h-4 w-4" />{loading ? "Preparing PDF…" : "Download PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
