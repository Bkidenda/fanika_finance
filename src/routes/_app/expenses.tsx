import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
                <div className="space-y-1.5"><Label>Account</Label>
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger><SelectValue placeholder="(none)" /></SelectTrigger>
                    <SelectContent>{(accounts.data ?? []).map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Method</Label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Cash", "Card", "M-Pesa", "Bank transfer", "Other"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
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
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-2xl border bg-card shadow-card">
        <div className="flex items-center gap-2 border-b p-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </div>
        {filtered.length ? (
          <div className="divide-y">
            {filtered.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-secondary/50">
                <div>
                  <div className="font-medium flex items-center gap-2">{e.description || e.category}{e.is_emergency && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-900">Emergency</span>}{e.source_debt_payment_id && <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-900">Auto · debt</span>}</div>
                  <div className="text-xs text-muted-foreground">{e.date} · {e.category} · {e.payment_method}{Number(e.transaction_fee) > 0 ? ` · fee ${formatCurrency(Number(e.transaction_fee), currency)}` : ""}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums font-medium">{formatCurrency(Number(e.amount), currency)}</span>
                  {!e.source_debt_payment_id && (
                    <button onClick={() => setEdit({
                      id: e.id, date: e.date, amount: String(e.amount), category: e.category,
                      description: e.description ?? "", account_id: e.account_id ?? "",
                      is_emergency: e.is_emergency, transaction_fee: String(e.transaction_fee ?? 0),
                    })} className="text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
                  )}
                  <button onClick={() => remove(e.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
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
