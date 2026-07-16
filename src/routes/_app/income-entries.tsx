import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIncomeEntries, useProfile, useAccounts } from "@/lib/queries";
import { formatCurrency, isoLocalDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, ArrowDownToLine, HandHeart } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/income-entries")({ component: IncomeEntries });

const SOURCES = ["Salary", "Freelance", "Consultancy", "Business", "Rental", "Side hustle", "Dividends", "Gift", "Other"];

function IncomeEntries() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const profile = useProfile();
  const entries = useIncomeEntries();
  const accounts = useAccounts();
  const currency = profile.data?.currency ?? "KES";
  const titheDefault = !!profile.data?.tithe_enabled;

  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    date: isoLocalDate(), source: "Salary", amount: "",
    account_id: "", notes: "", tithe_on: titheDefault,
  });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const incomeAmount = Number(f.amount);
    const { error } = await supabase.from("income_entries").insert({
      user_id: user!.id, date: f.date, source: f.source, amount: incomeAmount,
      account_id: f.account_id || null, notes: f.notes || null,
      tithe_on: f.tithe_on,
    });
    if (error) return toast.error(error.message);

    const month = `${f.date.slice(0, 7)}-01`;
    const titheRate = Number(profile.data?.tithe_rate ?? 0.10);
    const titheAmount = f.tithe_on && !!profile.data?.tithe_enabled ? incomeAmount * titheRate : 0;
    const disposableBase = Math.max(0, incomeAmount - titheAmount);

    const { error: seedError } = await supabase.rpc("seed_budget_split_rules_for_month", {
      p_user_id: user!.id,
      p_target_month: month,
    });
    if (seedError) {
      toast.error(seedError.message);
      return;
    }

    const { data: splitRules, error: splitRulesError } = await supabase.from("budget_split_rules" as never)
      .select("*")
      .eq("month", month)
      .eq("active", true);

    if (splitRulesError) {
      toast.error(splitRulesError.message);
      return;
    }

    for (const rule of splitRules ?? []) {
      const pct = Number(rule.percentage ?? 0);
      if (!Number.isFinite(pct) || pct <= 0) continue;
      const baseAmount = rule.base_type === "disposable" ? disposableBase : incomeAmount;
      const amount = baseAmount * (pct / 100);
      if (amount <= 0) continue;
      const { error: budgetError } = await supabase.from("budgets").upsert({
        user_id: user!.id,
        category: rule.category,
        month,
        limit_amount: amount,
        is_recurring: false,
        notes: rule.notes ?? "Auto-filled from income split",
      }, { onConflict: "user_id,category,month" });
      if (budgetError) {
        toast.error(budgetError.message);
      }
    }

    toast.success("Income received"); setOpen(false);
    setF({ date: isoLocalDate(), source: "Salary", amount: "", account_id: "", notes: "", tithe_on: titheDefault });
    qc.invalidateQueries({ queryKey: ["income-entries"] });
    qc.invalidateQueries({ queryKey: ["budgets"] });
    qc.invalidateQueries({ queryKey: ["budgets-all"] });
    qc.invalidateQueries({ queryKey: ["accounts"] });
  }
  async function remove(id: string) {
    await supabase.from("income_entries").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["income-entries"] });
    qc.invalidateQueries({ queryKey: ["accounts"] });
  }
  async function toggleTithe(id: string, next: boolean) {
    await supabase.from("income_entries").update({ tithe_on: next }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["income-entries"] });
  }

  const total = (entries.data ?? []).reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Income</h2>
          <p className="text-sm text-muted-foreground">Money actually received. Entries are grouped by transaction date — record May salary in May even if you log it in June.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> Record income</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record income received</DialogTitle></DialogHeader>
            <form onSubmit={add} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Date</Label><Input type="date" required value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Amount ({currency})</Label><Input type="number" step="0.01" required value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label>Source</Label>
                <Select value={f.source} onValueChange={(v) => setF({ ...f, source: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Deposited to account</Label>
                <Select value={f.account_id} onValueChange={(v) => setF({ ...f, account_id: v })}>
                  <SelectTrigger><SelectValue placeholder="(none — won't update balances)" /></SelectTrigger>
                  <SelectContent>{(accounts.data ?? []).map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-xl border p-3">
                <div className="flex items-center gap-2"><HandHeart className="h-4 w-4 text-primary" /><Label className="cursor-pointer">Apply tithe / giving to this income</Label></div>
                <Switch checked={f.tithe_on} onCheckedChange={(v) => setF({ ...f, tithe_on: v })} />
              </div>
              <div className="space-y-1.5"><Label>Notes</Label><Input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
              <Button type="submit" className="w-full">Record</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-card">
        <div className="text-xs text-muted-foreground">Total received this month</div>
        <div className="mt-1 text-3xl font-semibold tabular-nums">{formatCurrency(total, currency)}</div>
      </div>

      <div className="rounded-2xl border bg-card shadow-card">
        {entries.data?.length ? (
          <div className="divide-y">
            {entries.data.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <ArrowDownToLine className="h-4 w-4 text-primary" />
                  <div>
                    <div className="font-medium text-sm">{e.source}</div>
                    <div className="text-xs text-muted-foreground">{e.date}{e.notes ? ` · ${e.notes}` : ""}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>Tithe</span>
                    <Switch checked={!!e.tithe_on} onCheckedChange={(v) => toggleTithe(e.id, v)} />
                  </div>
                  <span className="tabular-nums font-medium">{formatCurrency(Number(e.amount), currency)}</span>
                  <button onClick={() => remove(e.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="py-10 text-center text-sm text-muted-foreground">No income recorded this month.</p>}
      </div>
    </div>
  );
}
