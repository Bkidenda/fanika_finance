import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useDebts, useProfile, useAccounts } from "@/lib/queries";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, CreditCard, HeartHandshake } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/debts")({ component: Debts });

function Debts() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const profile = useProfile();
  const debts = useDebts();
  const accounts = useAccounts();
  const currency = profile.data?.currency ?? "KES";
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState<{ id: string; balance: number } | null>(null);
  const [payAmt, setPayAmt] = useState("");
  const [payAccount, setPayAccount] = useState<string>("");
  const [f, setF] = useState({
    kind: "formal" as "formal" | "informal",
    name: "", creditor: "", principal: "", balance: "",
    interest_rate: "", monthly_payment: "", due_date: "", deposit_account_id: "",
  });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const isInformal = f.kind === "informal";
    if (!f.deposit_account_id) return toast.error("Pick an account to deposit the borrowed amount into.");
    const { error } = await supabase.from("debts").insert({
      user_id: user!.id, kind: f.kind, name: f.name, creditor: f.creditor || null,
      principal: Number(f.principal), balance: Number(f.balance || f.principal),
      interest_rate: isInformal ? 0 : Number(f.interest_rate) || 0,
      monthly_payment: isInformal ? 0 : Number(f.monthly_payment) || 0,
      due_date: isInformal ? null : f.due_date || null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deposit_account_id: f.deposit_account_id,
    } as never);
    if (error) return toast.error(error.message);
    toast.success(`Debt added — ${formatCurrency(Number(f.balance || f.principal), currency)} credited to the chosen account.`);
    setOpen(false);
    setF({ kind: "formal", name: "", creditor: "", principal: "", balance: "", interest_rate: "", monthly_payment: "", due_date: "", deposit_account_id: "" });
    qc.invalidateQueries({ queryKey: ["debts"] });
    qc.invalidateQueries({ queryKey: ["accounts"] });
  }
  async function recordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!payOpen) return;
    const amt = Number(payAmt);
    if (!amt) return;
    // DB trigger handles: reduces debts.balance, archives when settled, auto-creates expense which debits the account.
    const { error } = await supabase.from("debt_payments").insert({ user_id: user!.id, debt_id: payOpen.id, amount: amt, account_id: payAccount || null });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["debts"] });
    qc.invalidateQueries({ queryKey: ["accounts"] });
    qc.invalidateQueries({ queryKey: ["expenses"] });
    qc.invalidateQueries({ queryKey: ["expenses-all"] });
    setPayOpen(null); setPayAmt(""); setPayAccount("");
    toast.success("Payment recorded — expense logged and account adjusted.");
  }
  async function remove(id: string) { await supabase.from("debts").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["debts"] }); }

  const active = (debts.data ?? []).filter((d) => !d.archived_at && Number(d.balance) > 0);
  const formal = active.filter((d) => d.kind !== "informal");
  const informal = active.filter((d) => d.kind === "informal");
  const totalBalance = active.reduce((s, d) => s + Number(d.balance), 0);
  const monthly = formal.reduce((s, d) => s + Number(d.monthly_payment), 0);

  const renderDebt = (d: typeof formal[number]) => {
    const paid = Number(d.principal) - Number(d.balance);
    const pct = d.principal > 0 ? Math.min(100, (paid / Number(d.principal)) * 100) : 0;
    const isInformal = d.kind === "informal";
    return (
      <div key={d.id} className="rounded-2xl border bg-card p-5 shadow-card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
              {isInformal ? <HeartHandshake className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
            </div>
            <div>
              <div className="font-medium">{d.name}</div>
              <div className="text-xs text-muted-foreground">
                {isInformal ? `Owed to ${d.creditor || "friend/family"}` : `${d.creditor || "—"} · ${d.interest_rate}% · ${formatCurrency(Number(d.monthly_payment), currency)}/mo`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => { setPayOpen({ id: d.id, balance: Number(d.balance) }); setPayAmt(""); setPayAccount(""); }}>Record payment</Button>
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
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div><p className="text-sm text-muted-foreground">Repayment planning</p><h2 className="text-2xl font-semibold tracking-tight">Debts</h2></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> Add debt</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New debt</DialogTitle></DialogHeader>
            <form onSubmit={add} className="space-y-3">
              <div className="space-y-1.5"><Label>Type</Label>
                <Select value={f.kind} onValueChange={(v) => setF({ ...f, kind: v as "formal" | "informal" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formal (bank, SACCO, lender)</SelectItem>
                    <SelectItem value="informal">Informal (friends, family)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Name</Label><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>{f.kind === "informal" ? "Lender" : "Creditor"}</Label><Input value={f.creditor} onChange={(e) => setF({ ...f, creditor: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Principal ({currency})</Label><Input type="number" step="0.01" required value={f.principal} onChange={(e) => setF({ ...f, principal: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Outstanding</Label><Input type="number" step="0.01" value={f.balance} onChange={(e) => setF({ ...f, balance: e.target.value })} /></div>
              </div>
              {f.kind === "formal" && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5"><Label>Rate %</Label><Input type="number" step="0.01" value={f.interest_rate} onChange={(e) => setF({ ...f, interest_rate: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Monthly</Label><Input type="number" step="0.01" value={f.monthly_payment} onChange={(e) => setF({ ...f, monthly_payment: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Due date</Label><Input type="date" value={f.due_date} onChange={(e) => setF({ ...f, due_date: e.target.value })} /></div>
                </div>
              )}
              <div className="space-y-1.5"><Label>Deposit into account *</Label>
                <Select value={f.deposit_account_id} onValueChange={(v) => setF({ ...f, deposit_account_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Which account receives the borrowed money?" /></SelectTrigger>
                  <SelectContent>{(accounts.data ?? []).filter((a) => ["bank","mpesa","cash","sacco"].includes(a.type)).map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">The outstanding balance is credited to this account immediately.</p>
              </div>
              <Button type="submit" className="w-full">Add</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-card"><div className="text-xs text-muted-foreground">Total outstanding</div><div className="mt-1 text-2xl font-semibold tabular-nums">{formatCurrency(totalBalance, currency)}</div></div>
        <div className="rounded-2xl border bg-card p-5 shadow-card"><div className="text-xs text-muted-foreground">Monthly (formal)</div><div className="mt-1 text-2xl font-semibold tabular-nums">{formatCurrency(monthly, currency)}</div></div>
        <div className="rounded-2xl border bg-card p-5 shadow-card"><div className="text-xs text-muted-foreground">Active debts</div><div className="mt-1 text-2xl font-semibold tabular-nums">{active.length}</div></div>
      </div>

      {formal.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Formal</h3>
          {formal.map(renderDebt)}
        </div>
      )}
      {informal.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Informal (friends & family)</h3>
          {informal.map(renderDebt)}
        </div>
      )}
      {!active.length && <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">No active debts. Settled debts are archived under History.</p>}

      <Dialog open={!!payOpen} onOpenChange={(o) => !o && setPayOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record payment</DialogTitle></DialogHeader>
          <form onSubmit={recordPayment} className="space-y-3">
            <div className="space-y-1.5"><Label>Amount ({currency})</Label><Input type="number" step="0.01" required value={payAmt} onChange={(e) => setPayAmt(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Paid from account</Label>
              <Select value={payAccount} onValueChange={setPayAccount}>
                <SelectTrigger><SelectValue placeholder="(none — won't affect balances)" /></SelectTrigger>
                <SelectContent>{(accounts.data ?? []).map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">Save payment</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
