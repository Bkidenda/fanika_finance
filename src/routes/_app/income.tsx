import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIncomes, useProfile } from "@/lib/queries";
import { formatCurrency } from "@/lib/format";
import { diversificationScore } from "@/lib/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Coins } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/income")({ component: Income });

const SOURCES = ["Salary", "Freelance", "Consultancy", "Business", "Rental", "Side hustle", "Dividends", "Other"];

function Income() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const profile = useProfile();
  const incomes = useIncomes();
  const currency = profile.data?.currency ?? "KES";
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ source: "Freelance", amount: "", frequency: "monthly" as "monthly" | "annual" | "one_time" });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("incomes").insert({
      user_id: user!.id, source: form.source, amount: Number(form.amount), frequency: form.frequency,
    });
    if (error) return toast.error(error.message);
    toast.success("Income added");
    setOpen(false); setForm({ source: "Freelance", amount: "", frequency: "monthly" });
    qc.invalidateQueries({ queryKey: ["incomes"] });
  }
  async function remove(id: string) {
    await supabase.from("incomes").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["incomes"] });
  }

  const monthlyTotal = (incomes.data ?? []).reduce((s, i) => s + (i.frequency === "annual" ? Number(i.amount) / 12 : i.frequency === "monthly" ? Number(i.amount) : 0), 0);
  const div = diversificationScore((incomes.data ?? []).map((i) => ({ amount: i.frequency === "annual" ? Number(i.amount) / 12 : Number(i.amount) })));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">All revenue streams</p>
          <h2 className="text-2xl font-semibold tracking-tight">Income</h2>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> Add income</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New income stream</DialogTitle></DialogHeader>
            <form onSubmit={add} className="space-y-3">
              <div className="space-y-1.5"><Label>Source</Label>
                <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Amount ({currency})</Label>
                  <Input type="number" min="0" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div className="space-y-1.5"><Label>Frequency</Label>
                  <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v as typeof form.frequency })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem><SelectItem value="annual">Annual</SelectItem><SelectItem value="one_time">One-time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full">Add</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-card"><div className="text-xs text-muted-foreground">Monthly aggregate</div><div className="mt-1 text-2xl font-semibold tabular-nums">{formatCurrency(monthlyTotal, currency)}</div></div>
        <div className="rounded-2xl border bg-card p-5 shadow-card"><div className="text-xs text-muted-foreground">Streams</div><div className="mt-1 text-2xl font-semibold tabular-nums">{incomes.data?.length ?? 0}</div></div>
        <div className="rounded-2xl border bg-card p-5 shadow-card"><div className="text-xs text-muted-foreground">Diversification score</div><div className="mt-1 text-2xl font-semibold tabular-nums">{div}<span className="text-base font-normal text-muted-foreground">/100</span></div></div>
      </div>

      <div className="rounded-2xl border bg-card shadow-card">
        {incomes.data?.length ? (
          <div className="divide-y">
            {incomes.data.map((i) => (
              <div key={i.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3"><Coins className="h-4 w-4 text-primary" /><div><div className="font-medium text-sm">{i.source}</div><div className="text-xs text-muted-foreground">{i.frequency}</div></div></div>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums font-medium">{formatCurrency(Number(i.amount), currency)}</span>
                  <button onClick={() => remove(i.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="py-10 text-center text-sm text-muted-foreground">No income streams yet.</p>}
      </div>
    </div>
  );
}
