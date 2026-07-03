import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type {
  computeIncomeStatement,
  computeBalanceSheet,
  computeCashFlow,
} from "@/lib/finance";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#1a120b" },
  h1: { fontSize: 18, fontWeight: 700, marginBottom: 2 },
  sub: { fontSize: 10, color: "#6b5545", marginBottom: 16 },
  h2: { fontSize: 12, fontWeight: 700, marginTop: 14, marginBottom: 6, color: "#7a4a1f" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottom: 1, borderColor: "#e2d6c8" },
  label: { color: "#6b5545" },
  val: { fontWeight: 700 },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, fontSize: 8, color: "#a08972", textAlign: "center" },
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

function StatementDoc(props: Omit<Props, "fileName" | "disabled">) {
  const fmt = (n: number) => `${props.currency} ${Math.round(n).toLocaleString()}`;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Fanika · {props.title}</Text>
        <Text style={styles.sub}>{props.who} · Generated {new Date().toLocaleDateString()}</Text>

        <Text style={styles.h2}>Income statement</Text>
        {props.income.revenue.map((r, i) => (
          <View key={`r-${i}`} style={styles.row}><Text style={styles.label}>{r.label}</Text><Text style={styles.val}>{fmt(r.amount)}</Text></View>
        ))}
        <View style={styles.row}><Text style={styles.label}>Total revenue</Text><Text style={styles.val}>{fmt(props.income.totalRevenue)}</Text></View>
        {props.income.expenses.map((r, i) => (
          <View key={`e-${i}`} style={styles.row}><Text style={styles.label}>{r.label}</Text><Text style={styles.val}>{fmt(r.amount)}</Text></View>
        ))}
        <View style={styles.row}><Text style={styles.label}>Total expenses</Text><Text style={styles.val}>{fmt(props.income.totalExpenses)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Tithe & giving</Text><Text style={styles.val}>{fmt(props.income.tithe)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Custom deductions</Text><Text style={styles.val}>{fmt(props.income.deductions)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>NET INCOME</Text><Text style={styles.val}>{fmt(props.income.netIncome)}</Text></View>

        <Text style={styles.h2}>Balance sheet</Text>
        <View style={styles.row}><Text style={styles.label}>Cash & bank</Text><Text style={styles.val}>{fmt(props.balance.cashAndBank)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Investments</Text><Text style={styles.val}>{fmt(props.balance.investments)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Total assets</Text><Text style={styles.val}>{fmt(props.balance.totalAssets)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Total liabilities</Text><Text style={styles.val}>{fmt(props.balance.totalLiabilities)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>NET WORTH</Text><Text style={styles.val}>{fmt(props.balance.netWorth)}</Text></View>

        <Text style={styles.h2}>Cash flow</Text>
        <View style={styles.row}><Text style={styles.label}>Operating inflows</Text><Text style={styles.val}>{fmt(props.cashFlow.operatingInflows)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Operating outflows</Text><Text style={styles.val}>{fmt(-props.cashFlow.operatingOutflows)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Investing outflows</Text><Text style={styles.val}>{fmt(-props.cashFlow.investingOutflows)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Tithe & giving</Text><Text style={styles.val}>{fmt(-props.cashFlow.titheAndGiving)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>NET CASH FLOW</Text><Text style={styles.val}>{fmt(props.cashFlow.netCashFlow)}</Text></View>

        <Text style={styles.footer}>Fanika · Confidential · Generated for your personal records</Text>
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
