import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, useAccounts, useTithePayments, useIncomeEntries } from "@/lib/queries";
import { formatCurrency, isoLocalDate, monthLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, HandHeart } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/tithe")({ component: TithePage });

function TithePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const profile = useProfile();
  const accounts = useAccounts();
  const payments = useTithePayments();
  const income = useIncomeEntries();
  const currency = profile.data?.currency ?? "KES";
  const titheEnabled = !!profile.data?.tithe_enabled;
  const titheRate = profile.data?.tithe_rate ?? 0.10;

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(isoLocalDate());
  const [account, setAccount] = useState("");
  const [note, setNote] = useState("");

  const titheBudget = (income.data ?? [])
    .filter((e) => e.tithe_on ?? titheEnabled)
    .reduce((s, e) => s + Number(e.amount) * titheRate, 0);
  const paid = (payments.data ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const outstanding = Math.max(0, titheBudget - paid);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    if (!n || n <= 0) return toast.error("Enter an amount");
    const { error } = await supabase.from("tithe_payments").insert({
      user_id: user!.id, amount: n, paid_on: date,
      account_id: account || null, note: note || null,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    if (error) return toast.error(error.message);
    toast.success("Tithe payment recorded (account balances unchanged — tithe is pre-disposable).");
    setOpen(false); setAmount(""); setNote("");
    qc.invalidateQueries({ queryKey: ["tithe-payments"] });
  }
  async function remove(id: string) {
    await supabase.from("tithe_payments").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["tithe-payments"] });
  }

  if (!titheEnabled) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Tithe</h2>
        <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Tithe is currently disabled in your profile. <Link to="/settings" className="text-primary underline">Enable it in My Profile</Link> to start tracking.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{monthLabel()}</p>
          <h2 className="text-2xl font-semibold tracking-tight">Tithe</h2>
          <p className="text-xs text-muted-foreground">Recorded payments are tracked but don't reduce account balances — tithe is deducted before disposable.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> Record payment</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record tithe paid</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Amount ({currency})</Label><Input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
              </div>
              <div className="space-y-1.5"><Label>Paid from (optional, informational)</Label>
                <Select value={account} onValueChange={setAccount}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{(accounts.data ?? []).map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Note</Label><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" /></div>
              <Button type="submit" className="w-full">Save payment</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-gradient-hero p-5 text-primary-foreground shadow-elevated">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-80"><HandHeart className="h-4 w-4" /> Tithe due ({Math.round(titheRate * 100)}%)</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{formatCurrency(titheBudget, currency)}</div>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Paid this month</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{formatCurrency(paid, currency)}</div>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Outstanding</div>
          <div className={`mt-2 text-2xl font-semibold tabular-nums ${outstanding > 0 ? "text-amber-700" : "text-success"}`}>{formatCurrency(outstanding, currency)}</div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-card">
        <div className="border-b p-4 text-sm font-semibold">Payments</div>
        {payments.data?.length ? (
          <div className="divide-y">
            {payments.data.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <div className="font-medium">{formatCurrency(Number(p.amount), currency)}</div>
                  <div className="text-xs text-muted-foreground">{p.paid_on}{p.note ? ` · ${p.note}` : ""}</div>
                </div>
                <button onClick={() => remove(p.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        ) : <p className="p-8 text-center text-sm text-muted-foreground">No tithe payments recorded yet this month.</p>}
      </div>
    </div>
  );
}
