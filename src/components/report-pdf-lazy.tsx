// Lazy-loaded PDF renderer for the Reports hub. Must only ever be imported
// dynamically on the client (see statement-pdf-download-lazy.tsx for the
// pattern this follows) — a static/SSR import breaks with
// "Cannot read properties of undefined (reading 'call')".
import { pdf, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#2a1a10" },
  brand: { fontSize: 9, letterSpacing: 2, color: "#7a4a1f", textAlign: "center" },
  entity: { fontSize: 11, marginTop: 4, textAlign: "center", color: "#4a2f1c" },
  docTitle: { fontSize: 15, fontWeight: 700, marginTop: 4, textAlign: "center", color: "#3a2410", textTransform: "uppercase" },
  period: { fontSize: 9, textAlign: "center", color: "#6b5545", marginTop: 2 },
  units: { fontSize: 8, textAlign: "center", color: "#8a7565", marginTop: 2, marginBottom: 10 },
  ruleTop: { borderBottom: 2, borderColor: "#7a4a1f", marginBottom: 10 },
  h2: { fontSize: 10, fontWeight: 700, marginTop: 14, marginBottom: 4, color: "#7a4a1f", textTransform: "uppercase", letterSpacing: 1 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottom: 0.5, borderColor: "#d8c8b8" },
  label: { color: "#4a3828" },
  val: { fontWeight: 500 },
  sub: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderTop: 1, borderColor: "#7a4a1f", marginTop: 2, fontWeight: 700 },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, fontSize: 8, color: "#a08972", textAlign: "center", borderTop: 0.5, borderColor: "#d8c8b8", paddingTop: 6 },
});

export type ReportRow = { label: string; value: number; secondary?: number };
export type ReportSectionData = { title: string; total?: number; totalLabel?: string; rows: ReportRow[] };

export type ReportPdfPayload = {
  who: string;
  currency: string;
  reportTitle: string;
  periodLabel: string;
  sections: ReportSectionData[];
};

function fmt(currency: string, n: number) {
  const abs = Math.abs(n || 0);
  const s = `${currency} ${abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return (n || 0) < 0 ? `(${s})` : s;
}

function ReportDocument({ who, currency, reportTitle, periodLabel, sections }: ReportPdfPayload) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.brand}>FANIKA</Text>
          <Text style={styles.entity}>{who}</Text>
          <Text style={styles.docTitle}>{reportTitle}</Text>
          <Text style={styles.period}>{periodLabel}</Text>
          <Text style={styles.units}>All amounts expressed in {currency}</Text>
          <View style={styles.ruleTop} />
        </View>

        {sections.map((section, si) => (
          <View key={`sec-${si}`}>
            <Text style={styles.h2}>{section.title}</Text>
            {(section.rows.length ? section.rows : [{ label: "No data for this period", value: 0 }]).map((r, i) => (
              <View key={`r-${si}-${i}`} style={styles.row}>
                <Text style={styles.label}>{r.label}</Text>
                <Text style={styles.val}>
                  {fmt(currency, r.value)}
                  {typeof r.secondary === "number" ? ` / ${fmt(currency, r.secondary)}` : ""}
                </Text>
              </View>
            ))}
            {typeof section.total === "number" && (
              <View style={styles.sub}>
                <Text>{section.totalLabel ?? "Total"}</Text>
                <Text>{fmt(currency, section.total)}</Text>
              </View>
            )}
          </View>
        ))}

        <Text style={styles.footer}>Fanika · Confidential · Generated {new Date().toLocaleDateString()}</Text>
      </Page>
    </Document>
  );
}

export async function downloadReportPdf(payload: ReportPdfPayload, fileName: string) {
  const blob = await pdf(<ReportDocument {...payload} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export default downloadReportPdf;
