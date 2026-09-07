import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMonthClosures } from "@/lib/queries";
import { useProfile } from "@/lib/queries";
import { formatCurrency } from "@/lib/format";
import { reopenMonth } from "@/lib/close-month.functions";
import { Button } from "@/components/ui/button";
import { History as HistoryIcon, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_app/history")({ head: () => ({ meta: [{ title: "History — Fanika" }] }), component: History });

function History() {
  const closures = useMonthClosures();
  const profile = useProfile();
  const qc = useQueryClient();
  const reopen = useServerFn(reopenMonth);
  const currency = profile.data?.currency ?? "KES";

  const years = Array.from(new Set((closures.data ?? []).map((c) => c.period.slice(0, 4)))).sort().reverse();
  const [year, setYear] = useState<string>("all");

  const filtered = (closures.data ?? []).filter((c) => year === "all" || c.period.startsWith(year));

  async function doReopen(period: string) {
    if (!confirm(`Reopen ${period}? You'll be able to edit entries again.`)) return;
    try {
      await reopen({ data: { period } });
      toast.success("Month reopened");
      qc.invalidateQueries({ queryKey: ["month-closures"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reopen");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div><p className="text-sm text-muted-foreground">Reconciliation snapshots</p><h2 className="text-2xl font-semibold tracking-tight">History</h2></div>
        {years.length > 0 && (
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All years</SelectItem>
              {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {filtered.length ? (
        <div className="space-y-3">
          {filtered.map((c) => {
            const s = c.snapshot as Record<string, number | unknown>;
            const num = (k: string) => Number(s[k] ?? 0);
            return (
              <div key={c.id} className="rounded-2xl border bg-card p-5 shadow-card">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><HistoryIcon className="h-5 w-5" /></div>
                    <div>
                      <div className="font-semibold">{new Date(c.period + "-01").toLocaleString("en-US", { month: "long", year: "numeric" })}</div>
                      <div className="text-xs text-muted-foreground">Closed {new Date(c.closed_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => doReopen(c.period)}><RotateCcw className="mr-1 h-3.5 w-3.5" />Reopen</Button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Stat label="Income" value={formatCurrency(num("totalIncome"), currency)} />
                  <Stat label="Expenses" value={formatCurrency(num("totalExpenses"), currency)} />
                  <Stat label="Net cashflow" value={formatCurrency(num("netCashflow"), currency)} />
                  <Stat label="Debt paid" value={formatCurrency(num("debtPaid"), currency)} />
                  <Stat label="Net worth" value={formatCurrency(num("netWorth"), currency)} />
                  <Stat label="Savings rate" value={`${(num("savingsRate") * 100).toFixed(1)}%`} />
                  <Stat label="Budget variance" value={formatCurrency(num("budgetVariance"), currency)} />
                  <Stat label="Emergency spend" value={formatCurrency(num("emergencyExpenses"), currency)} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">No closed months yet. Close one from the Dashboard to start your history.</p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}
