import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAccounts, useProfile, useInvestments, useDebts } from "@/lib/queries";
import { computeNetWorth } from "@/lib/finance";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Landmark, ArrowLeftRight, Scale } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/accounts")({ component: Accounts });

const TYPES = [
  { v: "bank", l: "Bank" }, { v: "mpesa", l: "M-Pesa" }, { v: "cash", l: "Cash" },
  { v: "sacco", l: "SACCO" }, { v: "investment", l: "Investment" }, { v: "other", l: "Other" },
] as const;

function Accounts() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const profile = useProfile();
  const accounts = useAccounts();
  const investments = useInvestments();
  const debts = useDebts();
  const currency = profile.data?.currency ?? "KES";
  const [open, setOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [f, setF] = useState({ name: "", type: "bank", institution: "", balance: "" });
  const [t, setT] = useState({ from: "", to: "", amount: "", note: "" });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("accounts").insert({
      user_id: user!.id, name: f.name, type: f.type, institution: f.institution || null, balance: Number(f.balance) || 0, currency,
    });
    if (error) return toast.error(error.message);
    toast.success("Account added"); setOpen(false); setF({ name: "", type: "bank", institution: "", balance: "" });
    qc.invalidateQueries({ queryKey: ["accounts"] });
  }

  async function remove(id: string) {
    await supabase.from("accounts").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["accounts"] });
  }

  async function transfer(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(t.amount);
    if (!t.from || !t.to || t.from === t.to || amt <= 0) return toast.error("Pick two different accounts and a positive amount.");
    const from = accounts.data?.find((a) => a.id === t.from);
    const to = accounts.data?.find((a) => a.id === t.to);
    if (!from || !to) return;
    const { error: e1 } = await supabase.from("accounts").update({ balance: Number(from.balance) - amt }).eq("id", from.id);
    if (e1) return toast.error(e1.message);
    const { error: e2 } = await supabase.from("accounts").update({ balance: Number(to.balance) + amt }).eq("id", to.id);
    if (e2) return toast.error(e2.message);
    toast.success("Transfer recorded");
    setTransferOpen(false);
    setT({ from: "", to: "", amount: "", note: "" });
    qc.invalidateQueries({ queryKey: ["accounts"] });
  }

  const total = (accounts.data ?? []).reduce((s, a) => s + Number(a.balance), 0);
  const nw = computeNetWorth({
    accounts: accounts.data ?? [],
    investments: investments.data ?? [],
    debts: debts.data ?? [],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Unified balance view</p>
          <h2 className="text-2xl font-semibold tracking-tight">Accounts</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTransferOpen(true)} disabled={(accounts.data?.length ?? 0) < 2}>
            <ArrowLeftRight className="mr-1 h-4 w-4" /> Transfer
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> Add account</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New account</DialogTitle></DialogHeader>
              <form onSubmit={add} className="space-y-3">
                <div className="space-y-1.5"><Label>Name</Label><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Type</Label>
                    <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Balance ({currency})</Label><Input type="number" step="0.01" value={f.balance} onChange={(e) => setF({ ...f, balance: e.target.value })} /></div>
                </div>
                <div className="space-y-1.5"><Label>Institution</Label><Input value={f.institution} onChange={(e) => setF({ ...f, institution: e.target.value })} /></div>
                <Button type="submit" className="w-full">Add</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-gradient-hero p-6 text-primary-foreground shadow-elevated">
          <div className="text-xs uppercase tracking-widest opacity-80">Total cash balance</div>
          <div className="mt-2 text-3xl font-semibold tabular-nums">{formatCurrency(total, currency)}</div>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-card">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"><Scale className="h-3.5 w-3.5" /> Net worth</div>
          <div className="mt-2 text-3xl font-semibold tabular-nums">{formatCurrency(nw.net, currency)}</div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>Assets <span className="ml-1 font-medium text-foreground tabular-nums">{formatCurrency(nw.assets, currency)}</span></div>
            <div>Liabilities <span className="ml-1 font-medium text-foreground tabular-nums">{formatCurrency(nw.liabilities, currency)}</span></div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(accounts.data ?? []).map((a) => (
          <div key={a.id} className="rounded-2xl border bg-card p-5 shadow-card">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><Landmark className="h-5 w-5" /></div>
                <div><div className="font-medium">{a.name}</div><div className="text-xs text-muted-foreground capitalize">{a.type}{a.institution ? ` · ${a.institution}` : ""}</div></div>
              </div>
              <button onClick={() => remove(a.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
            <EditableBalance id={a.id} value={Number(a.balance)} currency={currency} onSaved={() => qc.invalidateQueries({ queryKey: ["accounts"] })} />
          </div>
        ))}
        {!accounts.data?.length && <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground md:col-span-2">No accounts yet.</p>}
      </div>

      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Transfer between accounts</DialogTitle></DialogHeader>
          <form onSubmit={transfer} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>From</Label>
                <Select value={t.from} onValueChange={(v) => setT({ ...t, from: v })}>
                  <SelectTrigger><SelectValue placeholder="Account" /></SelectTrigger>
                  <SelectContent>{(accounts.data ?? []).map((a) => <SelectItem key={a.id} value={a.id}>{a.name} ({formatCurrency(Number(a.balance), currency)})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>To</Label>
                <Select value={t.to} onValueChange={(v) => setT({ ...t, to: v })}>
                  <SelectTrigger><SelectValue placeholder="Account" /></SelectTrigger>
                  <SelectContent>{(accounts.data ?? []).filter((a) => a.id !== t.from).map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Amount ({currency})</Label><Input required type="number" step="0.01" min="0.01" value={t.amount} onChange={(e) => setT({ ...t, amount: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Note (optional)</Label><Input value={t.note} onChange={(e) => setT({ ...t, note: e.target.value })} /></div>
            <Button type="submit" className="w-full">Transfer</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditableBalance({ id, value, currency, onSaved }: { id: string; value: number; currency: string; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(String(value));
  async function save() {
    const n = Number(v);
    if (!Number.isFinite(n)) return toast.error("Invalid balance");
    const { error } = await supabase.from("accounts").update({ balance: n }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Balance updated");
    setEditing(false); onSaved();
  }
  if (editing) {
    return (
      <input
        autoFocus type="number" step="0.01" value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
        className="mt-3 w-full rounded border bg-background px-2 py-1 text-2xl font-semibold tabular-nums outline-none focus:ring-1 focus:ring-primary"
      />
    );
  }
  return (
    <button onClick={() => { setV(String(value)); setEditing(true); }} className="mt-3 block text-left text-2xl font-semibold tabular-nums underline-offset-4 hover:underline">
      {formatCurrency(value, currency)}
    </button>
  );
}
