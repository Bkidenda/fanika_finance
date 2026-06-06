import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAllExpenses, useProfile, useBudgets, useAccounts } from "@/lib/queries";
import { DEFAULT_BUDGET_CATEGORIES } from "@/lib/finance";
import { formatCurrency, isoLocalDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Trash2, AlertTriangle, Pencil } from "lucide-react";
import { toast } from "sonner";

// Payment-capable account types
const PAYMENT_TYPES = new Set(["bank", "mpesa", "cash", "sacco"]);
// Method options per account type
const METHODS_BY_TYPE: Record<string, string[]> = {
  bank: ["Bank transfer", "Card"],
  sacco: ["Bank transfer", "Card"],
  mpesa: ["M-Pesa"],
  cash: ["Cash"],
};
const DEFAULT_METHOD_BY_TYPE: Record<string, string> = {
  bank: "Bank transfer", sacco: "Bank transfer", mpesa: "M-Pesa", cash: "Cash",
};
const ALL_METHODS = ["Cash", "Card", "M-Pesa", "Bank transfer", "Other"];

export const Route = createFileRoute("/_app/expenses")({ component: Expenses });

type EditState = {
  id: string;
  date: string;
  amount: string;
  category: string;
  description: string;
  account_id: string;
  is_emergency: boolean;
  transaction_fee: string;
} | null;

function Expenses() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const expenses = useAllExpenses();
  const profile = useProfile();
  const budgets = useBudgets();
  const accounts = useAccounts();
  const currency = profile.data?.currency ?? "KES";

  const budgetCats = (budgets.data ?? []).map((b) => b.category);

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(isoLocalDate());
  const [amount, setAmount] = useState("");
  const [fee, setFee] = useState("");
  const [emergency, setEmergency] = useState(false);
  const [category, setCategory] = useState(budgetCats[0] ?? DEFAULT_BUDGET_CATEGORIES[0]);
  const [desc, setDesc] = useState("");
  const [accountId, setAccountId] = useState("");
  const [method, setMethod] = useState("Cash");
  const [skipAutosave, setSkipAutosave] = useState(false);

  const [edit, setEdit] = useState<EditState>(null);

  const availableCats = emergency ? DEFAULT_BUDGET_CATEGORIES : (budgetCats.length ? budgetCats : DEFAULT_BUDGET_CATEGORIES);
  const selectedAccount = (accounts.data ?? []).find((a) => a.id === accountId);
  const isMpesaSource = !!selectedAccount && /m-?pesa/i.test(selectedAccount.name);
  const hasZiidi = (accounts.data ?? []).some((a) => /ziidi/i.test(a.name));
  const autosaveRate = Number(profile.data?.mpesa_autosave_rate ?? 5);
  const autosaveEnabled = !!profile.data?.mpesa_autosave_enabled;
  const willAutosave = isMpesaSource && hasZiidi && autosaveEnabled && autosaveRate > 0 && !skipAutosave;
  const autosaveAmt = willAutosave && Number(amount) > 0 ? Math.round(Number(amount) * autosaveRate) / 100 : 0;
  // Note: rate is %, so amount*rate/100 already preserves cents.

  const paymentAccounts = useMemo(
    () => (accounts.data ?? []).filter((a) => PAYMENT_TYPES.has(a.type)),
    [accounts.data]
  );

  // Auto-select method based on chosen account's type
  useEffect(() => {
    if (!selectedAccount) return;
    const opts = METHODS_BY_TYPE[selectedAccount.type];
    const def = DEFAULT_METHOD_BY_TYPE[selectedAccount.type];
    if (opts && !opts.includes(method)) setMethod(def ?? opts[0]);
  }, [selectedAccount, method]);

  const methodOptions = selectedAccount
    ? METHODS_BY_TYPE[selectedAccount.type] ?? ALL_METHODS
    : ALL_METHODS;
  const methodLocked = selectedAccount?.type === "cash";

  function invalidateAll() {
    qc.invalidateQueries({ queryKey: ["expenses"] });
    qc.invalidateQueries({ queryKey: ["expenses-all"] });
    qc.invalidateQueries({ queryKey: ["accounts"] });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const cat = availableCats.includes(category) ? category : availableCats[0];
    const { error } = await supabase.from("expenses").insert({
      user_id: user!.id, date, amount: Number(amount), category: cat,
      description: desc || null, payment_method: method,
      is_emergency: emergency, account_id: accountId || null,
      transaction_fee: Number(fee) || 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      skip_autosave: skipAutosave,
    } as any);
    if (error) return toast.error(error.message);
    toast.success(willAutosave ? `Expense added — ${formatCurrency(autosaveAmt, currency)} auto-saved to Ziidi.` : "Expense added");
    setOpen(false);
    setAmount(""); setFee(""); setDesc(""); setEmergency(false); setSkipAutosave(false);
    invalidateAll();
  }
  async function remove(id: string) {
    await supabase.from("expenses").delete().eq("id", id);
    invalidateAll();
  }
  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    const { error } = await supabase.from("expenses").update({
      date: edit.date, amount: Number(edit.amount), category: edit.category,
      description: edit.description || null, account_id: edit.account_id || null,
      is_emergency: edit.is_emergency, transaction_fee: Number(edit.transaction_fee) || 0,
    }).eq("id", edit.id);
    if (error) return toast.error(error.message);
    toast.success("Expense updated");
    setEdit(null);
    invalidateAll();
  }

  const filtered = (expenses.data ?? []).filter((e) => {
    const q = search.toLowerCase();
    return !q || e.category.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q) || e.payment_method?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Expenses</h2>
          <p className="text-xs text-muted-foreground">Grouped by transaction date. Record any date — early-paid May salary spent in June stays in May's books.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> Add expense</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log expense</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></div>
                <div className="space-y-1.5"><Label>Amount ({currency})</Label><Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></div>
              </div>
              <div className="space-y-1.5"><Label>Transaction cost / fee ({currency}) <span className="text-xs text-muted-foreground">optional</span></Label>
                <Input type="number" min="0" step="0.01" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="0" />
              </div>
              <div className="flex items-center justify-between rounded-xl border p-3">
                <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /><Label className="cursor-pointer">Emergency / out-of-plan</Label></div>
                <Switch checked={emergency} onCheckedChange={setEmergency} />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{availableCats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Paid from</Label>
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                    <SelectContent>{paymentAccounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                  </Select>
                  {paymentAccounts.length === 0 && (
                    <p className="text-[11px] text-muted-foreground">No payment accounts yet. Add a Bank, M-Pesa, or Cash account.</p>
                  )}
                </div>
                <div className="space-y-1.5"><Label>Method</Label>
                  <Select value={method} onValueChange={setMethod} disabled={methodLocked}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{methodOptions.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5"><Label>Description</Label><Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional" /></div>
              {isMpesaSource && hasZiidi && autosaveEnabled && autosaveRate > 0 && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">M-Pesa → Ziidi auto-save</div>
                      <div className="text-muted-foreground">{autosaveRate}% of this expense ({formatCurrency(autosaveAmt, currency)}) will move to Ziidi.</div>
                    </div>
                    <label className="flex items-center gap-2"><span className="text-[11px]">Skip</span><Switch checked={skipAutosave} onCheckedChange={setSkipAutosave} /></label>
                  </div>
                </div>
              )}
              {isMpesaSource && !hasZiidi && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">Add a "Ziidi" account to enable M-Pesa auto-save.</div>
              )}
              <Button type="submit" className="w-full">Add expense</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-2xl border bg-card shadow-card">
        <div className="flex items-center gap-2 border-b p-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </div>
        {filtered.length ? (
          <WeeklyExpenses
            items={filtered}
            currency={currency}
            onEdit={(e) => setEdit({
              id: e.id, date: e.date, amount: String(e.amount), category: e.category,
              description: e.description ?? "", account_id: e.account_id ?? "",
              is_emergency: e.is_emergency, transaction_fee: String(e.transaction_fee ?? 0),
            })}
            onRemove={remove}
          />
        ) : <p className="py-10 text-center text-sm text-muted-foreground">No expenses yet.</p>}
      </div>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit expense</DialogTitle></DialogHeader>
          {edit && (
            <form onSubmit={saveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={edit.date} onChange={(ev) => setEdit({ ...edit, date: ev.target.value })} /></div>
                <div className="space-y-1.5"><Label>Amount</Label><Input type="number" step="0.01" value={edit.amount} onChange={(ev) => setEdit({ ...edit, amount: ev.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label>Fee</Label><Input type="number" step="0.01" value={edit.transaction_fee} onChange={(ev) => setEdit({ ...edit, transaction_fee: ev.target.value })} /></div>
              <div className="space-y-1.5"><Label>Category</Label>
                <Select value={edit.category} onValueChange={(v) => setEdit({ ...edit, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DEFAULT_BUDGET_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Account</Label>
                <Select value={edit.account_id} onValueChange={(v) => setEdit({ ...edit, account_id: v })}>
                  <SelectTrigger><SelectValue placeholder="(none)" /></SelectTrigger>
                  <SelectContent>{(accounts.data ?? []).map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Description</Label><Input value={edit.description} onChange={(ev) => setEdit({ ...edit, description: ev.target.value })} /></div>
              <Button type="submit" className="w-full">Save changes</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

type ExpenseRow = {
  id: string; date: string; amount: number; category: string;
  description: string | null; payment_method: string | null;
  is_emergency: boolean; account_id: string | null; transaction_fee: number;
  source_debt_payment_id: string | null;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
  occurred_at?: any;
};

function weekKey(dateStr: string): { key: string; label: string; start: Date } {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day); // start week on Mon
  const start = new Date(d); start.setDate(d.getDate() + diff);
  const end = new Date(start); end.setDate(start.getDate() + 6);
  const key = start.toISOString().slice(0, 10);
  const opt: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const label = `${start.toLocaleDateString("en", opt)} – ${end.toLocaleDateString("en", opt)}`;
  return { key, label, start };
}

function WeeklyExpenses({ items, currency, onEdit, onRemove }: {
  items: ExpenseRow[]; currency: string;
  onEdit: (e: ExpenseRow) => void; onRemove: (id: string) => void;
}) {
  const [openWeeks, setOpenWeeks] = useState<Record<string, boolean>>({});
  // Group by week, latest first
  const groups = new Map<string, { label: string; start: Date; rows: ExpenseRow[] }>();
  items.forEach((e) => {
    const w = weekKey(e.date);
    if (!groups.has(w.key)) groups.set(w.key, { label: w.label, start: w.start, rows: [] });
    groups.get(w.key)!.rows.push(e);
  });
  const sorted = [...groups.entries()].sort((a, b) => b[1].start.getTime() - a[1].start.getTime());

  return (
    <div className="divide-y">
      {sorted.map(([key, g], idx) => {
        const isOpen = openWeeks[key] ?? idx < 2;
        const total = g.rows.reduce((s, r) => s + Number(r.amount), 0);
        // group rows by day desc
        const byDay = new Map<string, ExpenseRow[]>();
        g.rows.forEach((r) => {
          if (!byDay.has(r.date)) byDay.set(r.date, []);
          byDay.get(r.date)!.push(r);
        });
        const days = [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0]));
        return (
          <div key={key}>
            <button
              onClick={() => setOpenWeeks((s) => ({ ...s, [key]: !isOpen }))}
              className="flex w-full items-center justify-between bg-secondary/30 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider hover:bg-secondary/60"
            >
              <span>{g.label} · {g.rows.length} entries</span>
              <span className="tabular-nums">{formatCurrency(total, currency)} {isOpen ? "▾" : "▸"}</span>
            </button>
            {isOpen && days.map(([day, rows]) => (
              <div key={day}>
                <div className="bg-background px-4 py-1.5 text-[11px] font-medium text-muted-foreground">
                  {new Date(day + "T00:00:00").toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" })}
                </div>
                {rows.map((e) => {
                  const ts = e.occurred_at ? new Date(e.occurred_at) : null;
                  const time = ts ? ts.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }) : "";
                  return (
                    <div key={e.id} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-secondary/40">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 font-medium">
                          <span className="truncate">{e.description || e.category}</span>
                          {e.is_emergency && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-900">Emergency</span>}
                          {e.source_debt_payment_id && <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-900">Auto · debt</span>}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {time && <>{time} · </>}{e.category} · {e.payment_method}{Number(e.transaction_fee) > 0 ? ` · fee ${formatCurrency(Number(e.transaction_fee), currency)}` : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="tabular-nums font-medium">{formatCurrency(Number(e.amount), currency)}</span>
                        {!e.source_debt_payment_id && (
                          <button onClick={() => onEdit(e)} className="text-muted-foreground hover:text-primary"><Pencil className="h-3.5 w-3.5" /></button>
                        )}
                        <button onClick={() => onRemove(e.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
