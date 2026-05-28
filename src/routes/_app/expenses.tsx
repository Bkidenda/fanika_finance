import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAllExpenses, useProfile, useBudgets, useAccounts, useIsMonthClosed } from "@/lib/queries";
import { DEFAULT_BUDGET_CATEGORIES } from "@/lib/finance";
import { formatCurrency, monthKey } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/expenses")({ component: Expenses });

function Expenses() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const expenses = useAllExpenses();
  const profile = useProfile();
  const budgets = useBudgets();
  const accounts = useAccounts();
  const currency = profile.data?.currency ?? "KES";
  const period = monthKey().slice(0, 7);
  const isClosed = useIsMonthClosed(period);

  const budgetCats = (budgets.data ?? []).map((b) => b.category);

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [emergency, setEmergency] = useState(false);
  const [category, setCategory] = useState(budgetCats[0] ?? DEFAULT_BUDGET_CATEGORIES[0]);
  const [desc, setDesc] = useState("");
  const [accountId, setAccountId] = useState("");
  const [method, setMethod] = useState("Cash");

  const availableCats = emergency ? DEFAULT_BUDGET_CATEGORIES : (budgetCats.length ? budgetCats : DEFAULT_BUDGET_CATEGORIES);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (isClosed) return toast.error("This month is closed. Reopen it from Dashboard to add entries.");
    const cat = availableCats.includes(category) ? category : availableCats[0];
    const { error } = await supabase.from("expenses").insert({
      user_id: user!.id, date, amount: Number(amount), category: cat,
      description: desc || null, payment_method: method,
      is_emergency: emergency, account_id: accountId || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Expense added"); setOpen(false);
    setAmount(""); setDesc(""); setEmergency(false);
    qc.invalidateQueries({ queryKey: ["expenses"] });
    qc.invalidateQueries({ queryKey: ["expenses-all"] });
    qc.invalidateQueries({ queryKey: ["accounts"] });
  }
  async function remove(id: string) {
    await supabase.from("expenses").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["expenses"] });
    qc.invalidateQueries({ queryKey: ["expenses-all"] });
    qc.invalidateQueries({ queryKey: ["accounts"] });
  }

  const filtered = (expenses.data ?? []).filter((e) => {
    const q = search.toLowerCase();
    return !q || e.category.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q) || e.payment_method?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Expenses</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button disabled={isClosed}><Plus className="mr-1 h-4 w-4" /> Add expense</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log expense</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></div>
                <div className="space-y-1.5"><Label>Amount ({currency})</Label><Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></div>
              </div>
              <div className="flex items-center justify-between rounded-xl border p-3">
                <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /><Label className="cursor-pointer">Emergency / out-of-plan</Label></div>
                <Switch checked={emergency} onCheckedChange={setEmergency} />
              </div>
              <div className="space-y-1.5">
                <Label>Category {!emergency && budgetCats.length === 0 && <span className="text-xs text-muted-foreground">(no budgets yet — add one in Budgets)</span>}</Label>
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
              <Button type="submit" className="w-full">Add expense</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isClosed && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">This month is closed. Reopen from Dashboard to add new entries.</div>}

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
                  <div className="font-medium flex items-center gap-2">{e.description || e.category}{e.is_emergency && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-900">Emergency</span>}</div>
                  <div className="text-xs text-muted-foreground">{e.date} · {e.category} · {e.payment_method}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums font-medium">{formatCurrency(Number(e.amount), currency)}</span>
                  <button onClick={() => remove(e.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="py-10 text-center text-sm text-muted-foreground">No expenses yet.</p>}
      </div>
    </div>
  );
}
