import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useExpenses, useIncomeEntries, useAccounts, useProfile } from "@/lib/queries";
import { DEFAULT_BUDGET_CATEGORIES } from "@/lib/finance";
import { formatCurrency, isoLocalDate, monthKey } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/transactions")({
  head: () => ({
    meta: [
      { title: "Money Tracker — Fanika" },
      { name: "description", content: "Track every shilling in and out: unified income and expense records with full editing." },
      { property: "og:title", content: "Money Tracker — Fanika" },
      { property: "og:description", content: "Track every shilling in and out with Fanika's unified money tracker." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TransactionsPage,
});

type Kind = "income" | "expense";
type Row = {
  id: string; kind: Kind; date: string; label: string; category: string;
  amount: number; fee: number; account_id: string | null;
};

function shiftMonth(m: string, delta: number) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function TransactionsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const profile = useProfile();
  const currency = profile.data?.currency ?? "KES";

  const [month, setMonth] = useState(monthKey());
  const [filter, setFilter] = useState<"all" | Kind>("all");

  const expenses = useExpenses(month);
  const income = useIncomeEntries(month);
  const accounts = useAccounts();

  const rows = useMemo<Row[]>(() => {
    const inc: Row[] = (income.data ?? []).map((e) => ({
      id: e.id, kind: "income", date: e.date, label: e.source, category: "Income",
      amount: Number(e.amount), fee: 0, account_id: e.account_id,
    }));
    const exp: Row[] = (expenses.data ?? []).map((e) => ({
      id: e.id, kind: "expense", date: e.date, label: e.description || e.category,
      category: e.category, amount: Number(e.amount), fee: Number(e.transaction_fee ?? 0),
      account_id: e.account_id,
    }));
    return [...inc, ...exp]
      .filter((r) => filter === "all" || r.kind === filter)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [income.data, expenses.data, filter]);

  const totalIn = rows.filter((r) => r.kind === "income").reduce((s, r) => s + r.amount, 0);
  const totalOut = rows.filter((r) => r.kind === "expense").reduce((s, r) => s + r.amount + r.fee, 0);

  const label = new Date(month).toLocaleString("en-US", { month: "long", year: "numeric" });

  function refresh() {
    qc.invalidateQueries({ queryKey: ["expenses"] });
    qc.invalidateQueries({ queryKey: ["expenses-all"] });
    qc.invalidateQueries({ queryKey: ["income-entries"] });
    qc.invalidateQueries({ queryKey: ["income-entries-all"] });
    qc.invalidateQueries({ queryKey: ["accounts"] });
  }

  async function remove(row: Row) {
    const table = row.kind === "income" ? "income_entries" : "expenses";
    const { error } = await supabase.from(table).delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Transaction deleted");
    refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">Money tracker</h2>
          <p className="text-sm text-muted-foreground">Every shilling in and out, in one ledger.</p>
        </div>
        <TxDialog
          userId={user?.id}
          accounts={accounts.data ?? []}
          month={month}
          onSaved={refresh}
          trigger={<Button><Plus className="mr-1 h-4 w-4" /> Add transaction</Button>}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-3 shadow-card">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[9rem] text-center text-sm font-semibold">{label}</span>
          <Button variant="ghost" size="icon" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expense">Expenses</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-3 gap-2.5 md:gap-4">
        <Kpi label="Money in" value={formatCurrency(totalIn, currency)} tone="success" />
        <Kpi label="Money out" value={formatCurrency(totalOut, currency)} />
        <Kpi label="Net" value={formatCurrency(totalIn - totalOut, currency)} tone={totalIn - totalOut >= 0 ? "success" : "destructive"} />
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No transactions recorded for {label}.</div>
        ) : (
          <ul className="divide-y">
            {rows.map((r) => (
              <li key={`${r.kind}-${r.id}`} className="flex items-center gap-3 p-3 md:p-4">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${r.kind === "income" ? "bg-success/15 text-success" : "bg-secondary text-secondary-foreground"}`}>
                  {r.kind === "income" ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{r.label}</div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {r.date} · {r.category}
                    {r.fee > 0 && ` · fee ${formatCurrency(r.fee, currency)}`}
                  </div>
                </div>
                <div className={`shrink-0 text-sm font-semibold tabular-nums ${r.kind === "income" ? "text-success" : ""}`}>
                  {r.kind === "income" ? "+" : "−"}{formatCurrency(r.amount, currency)}
                </div>
                <div className="flex shrink-0 items-center">
                  <TxDialog
                    userId={user?.id}
                    accounts={accounts.data ?? []}
                    month={month}
                    existing={r}
                    onSaved={refresh}
                    trigger={<Button variant="ghost" size="icon" aria-label="Edit"><Pencil className="h-4 w-4" /></Button>}
                  />
                  <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => remove(r)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "success" | "destructive" }) {
  return (
    <div className="rounded-2xl border bg-card p-3 shadow-card md:p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground md:text-[11px]">{label}</div>
      <div className={`mt-1 truncate text-base font-bold tabular-nums md:text-xl ${tone === "success" ? "text-success" : tone === "destructive" ? "text-destructive" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function TxDialog({ userId, accounts, month, existing, onSaved, trigger }: {
  userId?: string;
  accounts: { id: string; name: string }[];
  month: string;
  existing?: Row;
  onSaved: () => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>(existing?.kind ?? "expense");
  const [date, setDate] = useState(existing?.date ?? isoLocalDate(new Date(month)));
  const [label, setLabel] = useState(existing?.label ?? "");
  const [category, setCategory] = useState(existing?.category ?? DEFAULT_BUDGET_CATEGORIES[0]);
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [fee, setFee] = useState(existing ? String(existing.fee) : "0");
  const [accountId, setAccountId] = useState(existing?.account_id ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    const amt = Number(amount);
    if (!userId) return toast.error("Not signed in");
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    setSaving(true);
    try {
      if (kind === "income") {
        const payload = {
          user_id: userId, date, source: label || "Income", amount: amt,
          account_id: accountId || null,
        };
        const { error } = existing
          ? await supabase.from("income_entries").update(payload).eq("id", existing.id)
          : await supabase.from("income_entries").insert(payload);
        if (error) throw error;
      } else {
        const payload = {
          user_id: userId, date, category, description: label || null, amount: amt,
          transaction_fee: Number(fee) || 0, account_id: accountId || null,
        };
        const { error } = existing
          ? await supabase.from("expenses").update(payload).eq("id", existing.id)
          : await supabase.from("expenses").insert(payload);
        if (error) throw error;
      }
      toast.success(existing ? "Transaction updated" : "Transaction recorded");
      setOpen(false);
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit transaction" : "Add transaction"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {!existing && (
            <Tabs value={kind} onValueChange={(v) => setKind(v as Kind)}>
              <TabsList className="w-full">
                <TabsTrigger className="flex-1" value="expense">Expense</TabsTrigger>
                <TabsTrigger className="flex-1" value="income">Income</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Amount</Label>
              <Input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div>
            <Label>{kind === "income" ? "Source" : "Description"}</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={kind === "income" ? "Salary, business…" : "What was it for?"} />
          </div>
          {kind === "expense" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEFAULT_BUDGET_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Transaction fee</Label>
                <Input type="number" inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} />
              </div>
            </div>
          )}
          <div>
            <Label>Account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger><SelectValue placeholder="Select account (optional)" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
