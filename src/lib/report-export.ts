import { toast } from "sonner";

export type ReportRow = { label: string; value: number; secondary?: number };

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export function toCsv(rows: ReportRow[]): string {
  const header = "Label,Value,Secondary";
  const lines = rows.map((r) => [r.label.replace(/"/g, '""'), r.value, r.secondary ?? ""].map((v) => `"${v}"`).join(","));
  return [header, ...lines].join("\n");
}

export async function exportCsv(rows: ReportRow[], fileBase: string) {
  try {
    if (!rows.length) throw new Error("No data");
    downloadBlob(new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" }), `${fileBase}.csv`);
    toast.success("CSV exported");
  } catch (e) {
    console.error(e);
    toast.error("Failed to export CSV");
  }
}

export async function exportExcel(
  sections: { title: string; rows: ReportRow[] }[],
  fileBase: string,
  metadata?: { entity: string; period: string; currency: string; secondaryLabel?: string }
) {
  try {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    wb.Props = {
      Title: `Fanika financial statements — ${metadata?.period ?? "Financial report"}`,
      Subject: "Personal financial statements",
      Author: "Fanika",
      Company: "Fanika",
    };

    sections.forEach((s) => {
      // Header and metadata rows
      const data: any[][] = [
        ["FANIKA FINANCIAL REPORT"],
        [s.title.toUpperCase()],
      ];

      if (metadata) {
        data.push([metadata.entity]);
        data.push([`Period: ${metadata.period} | Currency: ${metadata.currency}`]);
      }
      
      data.push([]); // Spacer
      data.push(["Item", "Amount", metadata?.secondaryLabel ?? ""]);

      s.rows.forEach((r) => {
        data.push([r.label, r.value, r.secondary ?? ""]);
      });

      const ws = XLSX.utils.aoa_to_sheet(data);
      
      // Basic formatting for Accounting style: Number format and column widths
      ws["!cols"] = [{ wch: 45 }, { wch: 20 }, { wch: 20 }];
      
      // Apply number format to numeric cells in column B (index 1) and C (index 2)
      // Standard accounting format: #,##0.00
      Object.keys(ws).forEach((key) => {
        if (key.startsWith("B") || key.startsWith("C")) {
          const cell = ws[key];
          if (cell && typeof cell.v === "number") {
            cell.z = "#,##0.00;[Red](#,##0.00);-";
          }
        }
      });

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

export async function exportPdf(
  payload: { who: string; currency: string; reportTitle: string; periodLabel: string; sections: { title: string; total?: number; totalLabel?: string; rows: ReportRow[] }[] },
  fileBase: string,
) {
  try {
    const { downloadReportPdf } = await import("@/components/report-pdf-lazy");
    await downloadReportPdf(payload, `${fileBase}.pdf`);
    toast.success("PDF report exported");
  } catch (e) {
    console.error(e);
    toast.error("Failed to export PDF");
  }
}
