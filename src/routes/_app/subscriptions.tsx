import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useSubscriptions, useProfile, useAccounts } from "@/lib/queries";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Repeat } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/subscriptions")({ head: () => ({ meta: [{ title: "Subscriptions — Fanika" }] }), component: Subs });

function Subs() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const profile = useProfile();
  const subs = useSubscriptions();
  const accounts = useAccounts();
  const currency = profile.data?.currency ?? "KES";
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    name: "", amount: "", cycle: "monthly" as "weekly" | "monthly" | "quarterly" | "annual",
    next_charge: "", category: "Subscriptions", account_id: "",
  });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function renewDueSubscriptions() {
      const { data, error } = await supabase.rpc("process_due_subscriptions");
      if (cancelled) return;
      if (error) {
        toast.error("Automatic subscription renewal could not be completed.");
        return;
      }
      if (Number(data) > 0) {
        toast.success(`${data} subscription ${Number(data) === 1 ? "payment was" : "payments were"} recorded.`);
        qc.invalidateQueries({ queryKey: ["subscriptions"] });
        qc.invalidateQueries({ queryKey: ["expenses"] });
        qc.invalidateQueries({ queryKey: ["expenses-all"] });
        qc.invalidateQueries({ queryKey: ["accounts"] });
      }
    }
    renewDueSubscriptions();
    return () => { cancelled = true; };
  }, [qc, user]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("subscriptions").insert({
      user_id: user!.id, name: f.name, amount: Number(f.amount), cycle: f.cycle,
      next_charge: f.next_charge || null, category: f.category,
      account_id: f.account_id || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Subscription added"); setOpen(false);
    setF({ name: "", amount: "", cycle: "monthly", next_charge: "", category: "Subscriptions", account_id: "" });
    qc.invalidateQueries({ queryKey: ["subscriptions"] });
  }
  async function remove(id: string) { await supabase.from("subscriptions").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["subscriptions"] }); }
  async function toggle(id: string, active: boolean) { await supabase.from("subscriptions").update({ active: !active }).eq("id", id); qc.invalidateQueries({ queryKey: ["subscriptions"] }); }

  const monthly = (subs.data ?? []).filter((s) => s.active).reduce((s, x) => {
    const a = Number(x.amount);
    return s + (x.cycle === "monthly" ? a : x.cycle === "annual" ? a / 12 : x.cycle === "quarterly" ? a / 3 : a * 4);
  }, 0);

  const acctName = (id: string | null | undefined) => (accounts.data ?? []).find((a) => a.id === id)?.name;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div><p className="text-sm text-muted-foreground">Recurring payments</p><h2 className="text-2xl font-semibold tracking-tight">Subscriptions</h2></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> Add subscription</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New subscription</DialogTitle></DialogHeader>
            <form onSubmit={add} className="space-y-3">
              <div className="space-y-1.5"><Label>Name</Label><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Netflix, Spotify, etc." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Amount ({currency})</Label><Input required type="number" step="0.01" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Cycle</Label>
                  <Select value={f.cycle} onValueChange={(v) => setF({ ...f, cycle: v as typeof f.cycle })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Category</Label><Input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Next charge</Label><Input type="date" value={f.next_charge} onChange={(e) => setF({ ...f, next_charge: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5">
                <Label>Paid from account</Label>
                <Select value={f.account_id} onValueChange={(v) => setF({ ...f, account_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Choose an account (optional)" /></SelectTrigger>
                  <SelectContent>
                    {(accounts.data ?? []).map((a) => <SelectItem key={a.id} value={a.id}>{a.name} · {a.type}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">Used so future charges debit the right balance.</p>
              </div>
              <Button type="submit" className="w-full">Add</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-card"><div className="text-xs text-muted-foreground">Monthly cost</div><div className="mt-1 text-2xl font-semibold tabular-nums">{formatCurrency(monthly, currency)}</div></div>
        <div className="rounded-2xl border bg-card p-5 shadow-card"><div className="text-xs text-muted-foreground">Active</div><div className="mt-1 text-2xl font-semibold tabular-nums">{(subs.data ?? []).filter((s) => s.active).length}</div></div>
        <div className="rounded-2xl border bg-card p-5 shadow-card"><div className="text-xs text-muted-foreground">Annual projection</div><div className="mt-1 text-2xl font-semibold tabular-nums">{formatCurrency(monthly * 12, currency)}</div></div>
      </div>

      <div className="rounded-2xl border bg-card shadow-card">
        {subs.data?.length ? (
          <div className="divide-y">
            {subs.data.map((s) => {
              const acct = acctName((s as unknown as { account_id?: string | null }).account_id);
              return (
                <div key={s.id} className={`flex items-center justify-between px-4 py-3 ${s.active ? "" : "opacity-50"}`}>
                  <div className="flex items-center gap-3">
                    <Repeat className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium text-sm">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.cycle} · {s.category}{acct ? ` · ${acct}` : ""}{s.next_charge ? ` · next ${s.next_charge}` : ""}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="tabular-nums font-medium">{formatCurrency(Number(s.amount), currency)}</span>
                    <button onClick={() => toggle(s.id, s.active)} className="text-xs text-muted-foreground hover:text-primary">{s.active ? "Pause" : "Resume"}</button>
                    <button onClick={() => remove(s.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : <p className="py-10 text-center text-sm text-muted-foreground">No subscriptions tracked.</p>}
      </div>
    </div>
  );
}
