import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useDebts, useProfile } from "@/lib/queries";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, CreditCard } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/debts")({ component: Debts });

function Debts() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const profile = useProfile();
  const debts = useDebts();
  const currency = profile.data?.currency ?? "KES";
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", creditor: "", principal: "", balance: "", interest_rate: "", monthly_payment: "", due_date: "" });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("debts").insert({
      user_id: user!.id, name: f.name, creditor: f.creditor || null,
      principal: Number(f.principal), balance: Number(f.balance || f.principal),
      interest_rate: Number(f.interest_rate) || 0, monthly_payment: Number(f.monthly_payment) || 0,
      due_date: f.due_date || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Debt added"); setOpen(false);
    setF({ name: "", creditor: "", principal: "", balance: "", interest_rate: "", monthly_payment: "", due_date: "" });
    qc.invalidateQueries({ queryKey: ["debts"] });
  }
  async function pay(id: string, balance: number) {
    const amt = Number(prompt("Payment amount?") || 0);
    if (!amt) return;
    const newBal = Math.max(0, balance - amt);
    await supabase.from("debt_payments").insert({ user_id: user!.id, debt_id: id, amount: amt });
    await supabase.from("debts").update({ balance: newBal }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["debts"] });
    toast.success("Payment recorded");
  }
  async function remove(id: string) { await supabase.from("debts").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["debts"] }); }

  const totalBalance = (debts.data ?? []).reduce((s, d) => s + Number(d.balance), 0);
  const monthly = (debts.data ?? []).reduce((s, d) => s + Number(d.monthly_payment), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div><p className="text-sm text-muted-foreground">Repayment planning</p><h2 className="text-2xl font-semibold tracking-tight">Debts</h2></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> Add debt</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New debt</DialogTitle></DialogHeader>
            <form onSubmit={add} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Name</Label><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Creditor</Label><Input value={f.creditor} onChange={(e) => setF({ ...f, creditor: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Principal ({currency})</Label><Input type="number" step="0.01" required value={f.principal} onChange={(e) => setF({ ...f, principal: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Outstanding balance</Label><Input type="number" step="0.01" value={f.balance} onChange={(e) => setF({ ...f, balance: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5"><Label>Rate %</Label><Input type="number" step="0.01" value={f.interest_rate} onChange={(e) => setF({ ...f, interest_rate: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Monthly</Label><Input type="number" step="0.01" value={f.monthly_payment} onChange={(e) => setF({ ...f, monthly_payment: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Due date</Label><Input type="date" value={f.due_date} onChange={(e) => setF({ ...f, due_date: e.target.value })} /></div>
              </div>
              <Button type="submit" className="w-full">Add</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-card"><div className="text-xs text-muted-foreground">Total outstanding</div><div className="mt-1 text-2xl font-semibold tabular-nums">{formatCurrency(totalBalance, currency)}</div></div>
        <div className="rounded-2xl border bg-card p-5 shadow-card"><div className="text-xs text-muted-foreground">Monthly repayments</div><div className="mt-1 text-2xl font-semibold tabular-nums">{formatCurrency(monthly, currency)}</div></div>
        <div className="rounded-2xl border bg-card p-5 shadow-card"><div className="text-xs text-muted-foreground">Active debts</div><div className="mt-1 text-2xl font-semibold tabular-nums">{debts.data?.length ?? 0}</div></div>
      </div>

      <div className="space-y-3">
        {(debts.data ?? []).map((d) => {
          const paid = Number(d.principal) - Number(d.balance);
          const pct = d.principal > 0 ? Math.min(100, (paid / Number(d.principal)) * 100) : 0;
          return (
            <div key={d.id} className="rounded-2xl border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><CreditCard className="h-5 w-5" /></div>
                  <div><div className="font-medium">{d.name}</div><div className="text-xs text-muted-foreground">{d.creditor || "—"} · {d.interest_rate}% · {formatCurrency(Number(d.monthly_payment), currency)}/mo</div></div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => pay(d.id, Number(d.balance))}>Record payment</Button>
                  <button onClick={() => remove(d.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{formatCurrency(paid, currency)} paid</span>
                <span className="tabular-nums font-medium">{formatCurrency(Number(d.balance), currency)} left</span>
              </div>
              <Progress value={pct} className="mt-2" />
            </div>
          );
        })}
        {!debts.data?.length && <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">No debts tracked.</p>}
      </div>
    </div>
  );
}
