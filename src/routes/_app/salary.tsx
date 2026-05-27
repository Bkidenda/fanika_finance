import { createFileRoute } from "@tanstack/react-router";
import { useProfile, useDeductions } from "@/lib/queries";
import { computeSalaryBreakdown } from "@/lib/finance";
import { formatCurrency, formatPercent } from "@/lib/format";
import { ArrowDown, Calculator } from "lucide-react";

export const Route = createFileRoute("/_app/salary")({ component: Salary });

function Salary() {
  const profile = useProfile();
  const deductions = useDeductions();
  const currency = profile.data?.currency ?? "KES";
  const gross = profile.data?.gross_income ?? 0;
  const b = computeSalaryBreakdown(gross, {
    deductions: deductions.data ?? [],
    nssfMode: profile.data?.nssf_mode ?? "tiered",
    isResident: profile.data?.is_resident ?? true,
    titheBase: profile.data?.tithe_base ?? "gross",
  });

  const pct = (v: number) => (gross > 0 ? (v / gross) * 100 : 0);

  const flow: Array<{ label: string; value: number; tone: "gross" | "deduction" | "tax" | "tithe" | "net" }> = [
    { label: "Gross Income", value: b.gross, tone: "gross" },
    { label: "NSSF (Pension)", value: -b.nssf, tone: "deduction" },
    { label: "SHIF (Health 2.75%)", value: -b.shif, tone: "deduction" },
    { label: "Affordable Housing Levy (1.5%)", value: -b.ahl, tone: "deduction" },
    { label: "Taxable Income", value: b.taxableIncome, tone: "gross" },
    { label: "PAYE (Progressive)", value: -b.paye, tone: "tax" },
    { label: "Net (After Statutory)", value: b.netStatutory, tone: "gross" },
    { label: "Custom Deductions (loans, etc.)", value: -b.customDeductions, tone: "deduction" },
    { label: `Tithe (10% of ${b.titheBase})`, value: -b.tithe, tone: "tithe" },
    { label: "Net Disposable Income", value: b.netDisposable, tone: "net" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Where your salary goes</p>
        <h2 className="text-2xl font-semibold tracking-tight">Salary Breakdown</h2>
      </div>

      <div className="rounded-2xl border bg-gradient-hero p-6 text-primary-foreground shadow-elevated">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-80">
          <Calculator className="h-4 w-4" /> Net Disposable Income
        </div>
        <div className="mt-3 text-4xl font-semibold tabular-nums">{formatCurrency(b.netDisposable, currency)}</div>
        <div className="mt-1 text-sm opacity-80">
          {formatPercent(pct(b.netDisposable))} of {formatCurrency(b.gross, currency)} gross
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <h3 className="font-semibold">Salary Flow</h3>
        <p className="text-xs text-muted-foreground">
          Kenya statutory model · NSSF {profile.data?.nssf_mode ?? "tiered"} · {profile.data?.is_resident ? "Resident" : "Non-resident"}
        </p>
        <div className="mt-4 space-y-2">
          {flow.map((f, i) => (
            <div key={i}>
              <div
                className={`flex items-center justify-between rounded-xl border p-4 transition ${
                  f.tone === "net"
                    ? "border-primary/40 bg-primary/5"
                    : f.tone === "tithe"
                    ? "border-warning/30 bg-warning/5"
                    : f.tone === "tax"
                    ? "border-destructive/30 bg-destructive/5"
                    : f.tone === "deduction"
                    ? "bg-muted/40"
                    : ""
                }`}
              >
                <div>
                  <div className="text-sm font-medium">{f.label}</div>
                  {gross > 0 && <div className="text-xs text-muted-foreground">{formatPercent(Math.abs(pct(f.value)))} of gross</div>}
                </div>
                <div className={`text-lg font-semibold tabular-nums ${f.value < 0 ? "text-muted-foreground" : ""}`}>
                  {f.value < 0 ? "−" : ""}
                  {formatCurrency(Math.abs(f.value), currency)}
                </div>
              </div>
              {i < flow.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className="h-4 w-4 text-muted-foreground/60" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {gross === 0 && (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Set your gross monthly income in Settings to see your full breakdown.
        </div>
      )}
    </div>
  );
}
