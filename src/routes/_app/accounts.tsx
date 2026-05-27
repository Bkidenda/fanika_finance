import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAccounts, useProfile } from "@/lib/queries";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Landmark } from "lucide-react";
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
  const currency = profile.data?.currency ?? "KES";
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", type: "bank", institution: "", balance: "" });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("accounts").insert({
      user_id: user!.id, name: f.name, type: f.type, institution: f.institution || null, balance: Number(f.balance) || 0, currency,
    });
    if (error) return toast.error(error.message);
    toast.success("Account added"); setOpen(false); setF({ name: "", type: "bank", institution: "", balance: "" });
    qc.invalidateQueries({ queryKey: ["accounts"] });
  }
  async function remove(id: string) { await supabase.from("accounts").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["accounts"] }); }

  const total = (accounts.data ?? []).reduce((s, a) => s + Number(a.balance), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div><p className="text-sm text-muted-foreground">Unified balance view</p><h2 className="text-2xl font-semibold tracking-tight">Accounts</h2></div>
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

      <div className="rounded-2xl border bg-gradient-hero p-6 text-primary-foreground shadow-elevated">
        <div className="text-xs uppercase tracking-widest opacity-80">Total balance</div>
        <div className="mt-2 text-3xl font-semibold tabular-nums">{formatCurrency(total, currency)}</div>
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
            <div className="mt-3 text-2xl font-semibold tabular-nums">{formatCurrency(Number(a.balance), currency)}</div>
          </div>
        ))}
        {!accounts.data?.length && <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground md:col-span-2">No accounts yet.</p>}
      </div>
    </div>
  );
}
