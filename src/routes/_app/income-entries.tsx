import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIncomeEntries, useProfile, useAccounts, useIsMonthClosed } from "@/lib/queries";
import { formatCurrency, monthKey } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, ArrowDownToLine } from "lucide-react";
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
  const isClosed = useIsMonthClosed(monthKey().slice(0, 7));

  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ date: new Date().toISOString().slice(0, 10), source: "Salary", amount: "", account_id: "", notes: "" });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (isClosed) return toast.error("This month is closed.");
    const { error } = await supabase.from("income_entries").insert({
      user_id: user!.id, date: f.date, source: f.source, amount: Number(f.amount),
      account_id: f.account_id || null, notes: f.notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Income received"); setOpen(false);
    setF({ date: new Date().toISOString().slice(0, 10), source: "Salary", amount: "", account_id: "", notes: "" });
    qc.invalidateQueries({ queryKey: ["income-entries"] });
    qc.invalidateQueries({ queryKey: ["accounts"] });
  }
  async function remove(id: string) {
    await supabase.from("income_entries").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["income-entries"] });
    qc.invalidateQueries({ queryKey: ["accounts"] });
  }

  const total = (entries.data ?? []).reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div><p className="text-sm text-muted-foreground">Money actually received — every entry updates the linked account balance and feeds the dashboard.</p><h2 className="text-2xl font-semibold tracking-tight">Income</h2></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button disabled={isClosed}><Plus className="mr-1 h-4 w-4" /> Record income</Button></DialogTrigger>
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
                <div className="flex items-center gap-3">
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
