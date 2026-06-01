import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import {
  useProfile, useAccounts, useInvestments, useDebts, useSubscriptions,
} from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/format";
import { computeBreakdown, computeNetWorth } from "@/lib/finance";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download } from "lucide-react";

export const Route = createFileRoute("/_app/statements")({ component: Statements });

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
  const currency = profile.data?.currency ?? "KES";

  const now = new Date();
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [period, setPeriod] = useState(defaultPeriod);
  const [scope, setScope] = useState<"month" | "quarter">("month");

  const range = useMemo(() => ymdRange(period, scope), [period, scope]);

  const data = useQuery({
    queryKey: ["statement", user?.id, range.start, range.end],
    enabled: !!user,
    queryFn: async () => {
      const [exp, inc, bud, dp] = await Promise.all([
        supabase.from("expenses").select("amount,category,is_emergency,date,description").gte("date", range.start).lt("date", range.end),
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

  const totals = useMemo(() => {
    const incomeTotal = (data.data?.incomes ?? []).reduce((s, x) => s + Number(x.amount), 0);
    const expenseTotal = (data.data?.expenses ?? []).reduce((s, x) => s + Number(x.amount), 0);
    const debtPaid = (data.data?.debtPayments ?? []).reduce((s, x) => s + Number(x.amount), 0);
    const byCat = new Map<string, number>();
    (data.data?.expenses ?? []).forEach((e) => byCat.set(e.category, (byCat.get(e.category) ?? 0) + Number(e.amount)));
    const topCats = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
    const budgetByCat = new Map<string, number>();
    (data.data?.budgets ?? []).forEach((b) => budgetByCat.set(b.category, (budgetByCat.get(b.category) ?? 0) + Number(b.limit_amount)));
    return { incomeTotal, expenseTotal, debtPaid, topCats, budgetByCat };
  }, [data.data]);

  const titheEnabled = !!profile.data?.tithe_enabled;
  const breakdown = computeBreakdown(totals.incomeTotal, [], { titheEnabled, titheRate: profile.data?.tithe_rate ?? 0.10 });
  const nw = computeNetWorth({
    accounts: accounts.data ?? [],
    investments: investments.data ?? [],
    debts: debts.data ?? [],
  });

  const filename = `nuru-statement-${scope}-${period}.pdf`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-card">
          <FileText className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Statements</h2>
          <p className="text-sm text-muted-foreground">Printable monthly or quarterly account statement, ready for your records.</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-card">
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
            <PDFDownloadLink
              fileName={filename}
              document={
                <StatementDoc
                  title={`${scope === "month" ? "Monthly" : "Quarterly"} statement — ${range.label}`}
                  who={profile.data?.full_name || profile.data?.email || "Account holder"}
                  currency={currency}
                  totals={{
                    income: totals.incomeTotal,
                    spend: totals.expenseTotal,
                    tithe: breakdown.tithe,
                    debtPaid: totals.debtPaid,
                    netWorth: nw.net,
                    assets: nw.assets,
                    liabilities: nw.liabilities,
                  }}
                  accounts={(accounts.data ?? []).map((a) => ({ name: a.name, type: a.type, balance: Number(a.balance) }))}
                  topCategories={totals.topCats.map(([c, a]) => ({ c, a, budget: totals.budgetByCat.get(c) }))}
                  subs={(subs.data ?? []).filter((s) => s.active).map((s) => ({ name: s.name, amount: Number(s.amount), cycle: s.cycle }))}
                  debts={(debts.data ?? []).map((d) => ({ name: d.name, balance: Number(d.balance), kind: d.kind }))}
                />
              }
            >
              {({ loading }) => (
                <Button className="w-full" disabled={loading || data.isLoading}>
                  <Download className="mr-1 h-4 w-4" />{loading ? "Preparing PDF…" : `Download ${scope} PDF`}
                </Button>
              )}
            </PDFDownloadLink>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Card label="Income" value={formatCurrency(totals.incomeTotal, currency)} />
          <Card label="Spend" value={formatCurrency(totals.expenseTotal, currency)} />
          {titheEnabled && <Card label="Tithe" value={formatCurrency(breakdown.tithe, currency)} />}
          <Card label="Net worth (today)" value={formatCurrency(nw.net, currency)} />
        </div>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

// ---------- PDF document ----------
const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#0f172a" },
  h1: { fontSize: 18, fontWeight: 700, marginBottom: 2 },
  sub: { fontSize: 10, color: "#64748b", marginBottom: 16 },
  h2: { fontSize: 12, fontWeight: 700, marginTop: 14, marginBottom: 6, color: "#0e9488" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottom: 1, borderColor: "#e2e8f0" },
  label: { color: "#475569" },
  val: { fontWeight: 700 },
  grid: { flexDirection: "row", gap: 8, marginBottom: 6 },
  tile: { flex: 1, border: 1, borderColor: "#e2e8f0", borderRadius: 6, padding: 8 },
  tileLabel: { fontSize: 9, color: "#64748b" },
  tileVal: { fontSize: 12, fontWeight: 700, marginTop: 2 },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, fontSize: 8, color: "#94a3b8", textAlign: "center" },
});

function StatementDoc(props: {
  title: string;
  who: string;
  currency: string;
  totals: { income: number; spend: number; tithe: number; debtPaid: number; netWorth: number; assets: number; liabilities: number };
  accounts: { name: string; type: string; balance: number }[];
  topCategories: { c: string; a: number; budget?: number }[];
  subs: { name: string; amount: number; cycle: string }[];
  debts: { name: string; balance: number; kind: string }[];
}) {
  const fmt = (n: number) => `${props.currency} ${Math.round(n).toLocaleString()}`;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Nuru Steward · {props.title}</Text>
        <Text style={styles.sub}>{props.who} · Generated {new Date().toLocaleDateString()}</Text>

        <View style={styles.grid}>
          <View style={styles.tile}><Text style={styles.tileLabel}>Income</Text><Text style={styles.tileVal}>{fmt(props.totals.income)}</Text></View>
          <View style={styles.tile}><Text style={styles.tileLabel}>Total spend</Text><Text style={styles.tileVal}>{fmt(props.totals.spend)}</Text></View>
          <View style={styles.tile}><Text style={styles.tileLabel}>Tithe / giving</Text><Text style={styles.tileVal}>{fmt(props.totals.tithe)}</Text></View>
          <View style={styles.tile}><Text style={styles.tileLabel}>Debt paid</Text><Text style={styles.tileVal}>{fmt(props.totals.debtPaid)}</Text></View>
        </View>
        <View style={styles.grid}>
          <View style={styles.tile}><Text style={styles.tileLabel}>Assets</Text><Text style={styles.tileVal}>{fmt(props.totals.assets)}</Text></View>
          <View style={styles.tile}><Text style={styles.tileLabel}>Liabilities</Text><Text style={styles.tileVal}>{fmt(props.totals.liabilities)}</Text></View>
          <View style={styles.tile}><Text style={styles.tileLabel}>Net worth</Text><Text style={styles.tileVal}>{fmt(props.totals.netWorth)}</Text></View>
        </View>

        <Text style={styles.h2}>Top spending categories</Text>
        {props.topCategories.length === 0 ? <Text>(none)</Text> : props.topCategories.map((r) => (
          <View key={r.c} style={styles.row}>
            <Text style={styles.label}>{r.c}{r.budget != null ? `  ·  budget ${fmt(r.budget)}` : ""}</Text>
            <Text style={styles.val}>{fmt(r.a)}</Text>
          </View>
        ))}

        <Text style={styles.h2}>Accounts (current balances)</Text>
        {props.accounts.length === 0 ? <Text>(no accounts)</Text> : props.accounts.map((a) => (
          <View key={a.name} style={styles.row}>
            <Text style={styles.label}>{a.name} · {a.type}</Text>
            <Text style={styles.val}>{fmt(a.balance)}</Text>
          </View>
        ))}

        <Text style={styles.h2}>Active subscriptions</Text>
        {props.subs.length === 0 ? <Text>(none)</Text> : props.subs.map((s) => (
          <View key={s.name} style={styles.row}>
            <Text style={styles.label}>{s.name} · {s.cycle}</Text>
            <Text style={styles.val}>{fmt(s.amount)}</Text>
          </View>
        ))}

        <Text style={styles.h2}>Debts</Text>
        {props.debts.length === 0 ? <Text>(none)</Text> : props.debts.map((d) => (
          <View key={d.name} style={styles.row}>
            <Text style={styles.label}>{d.name} · {d.kind}</Text>
            <Text style={styles.val}>{fmt(d.balance)}</Text>
          </View>
        ))}

        <Text style={styles.footer}>Nuru Steward · Confidential · Generated for your personal records</Text>
      </Page>
    </Document>
  );
}
