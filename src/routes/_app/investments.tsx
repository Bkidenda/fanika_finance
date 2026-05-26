import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useInvestments, useProfile } from "@/lib/queries";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const TYPES = ["savings", "sacco", "stocks", "crypto", "bonds", "fixed_deposit", "business", "other"] as const;

export const Route = createFileRoute("/_app/investments")({ component: Investments });

function Investments() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const investments = useInvestments();
  const profile = useProfile();
  const currency = profile.data?.currency ?? "KES";

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "savings" as (typeof TYPES)[number],
    institution: "",
    amount_invested: "",
    current_value: "",
    start_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("investments").insert({
      user_id: user!.id,
      name: form.name,
      type: form.type,
      institution: form.institution || null,
      amount_invested: Number(form.amount_invested),
      current_value: Number(form.current_value || form.amount_invested),
      start_date: form.start_date,
      notes: form.notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Investment added");
    setOpen(false);
    setForm({ ...form, name: "", institution: "", amount_invested: "", current_value: "", notes: "" });
    qc.invalidateQueries({ queryKey: ["investments"] });
  }

  async function remove(id: string) {
    await supabase.from("investments").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["investments"] });
  }

  const items = investments.data ?? [];
  const totalInvested = items.reduce((s, i) => s + Number(i.amount_invested), 0);
  const totalValue = items.reduce((s, i) => s + Number(i.current_value), 0);
  const totalROI = totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0;

  const allocation = items.map((i) => ({ name: i.name, value: Number(i.current_value) }));
  const COLORS = ["#0e9488", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ec4899", "#14b8a6", "#64748b"];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Investments</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1 h-4 w-4" /> Add asset</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add investment</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as (typeof TYPES)[number] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Institution</Label>
                  <Input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Amount invested</Label>
                  <Input type="number" required value={form.amount_invested} onChange={(e) => setForm({ ...form, amount_invested: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Current value</Label>
                  <Input type="number" value={form.current_value} onChange={(e) => setForm({ ...form, current_value: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Start date</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <div className="text-xs text-muted-foreground">Invested</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{formatCurrency(totalInvested, currency)}</div>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <div className="text-xs text-muted-foreground">Current value</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{formatCurrency(totalValue, currency)}</div>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <div className="text-xs text-muted-foreground">ROI</div>
          <div className={`mt-1 flex items-center gap-1 text-2xl font-semibold tabular-nums ${totalROI >= 0 ? "text-success" : "text-destructive"}`}>
            {totalROI >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            {formatPercent(totalROI)}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6 shadow-card">
          <h3 className="font-semibold">Portfolio allocation</h3>
          <div className="mt-4 h-72">
            {allocation.length ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={allocation} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                    {allocation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No assets yet</p>}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-card">
          <h3 className="font-semibold">Assets</h3>
          <div className="mt-3 divide-y">
            {items.length ? items.map((i) => {
              const roi = Number(i.amount_invested) > 0
                ? ((Number(i.current_value) - Number(i.amount_invested)) / Number(i.amount_invested)) * 100
                : 0;
              return (
                <div key={i.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium text-sm">{i.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {i.type.replace("_", " ")} · {i.institution || "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-sm font-medium tabular-nums">{formatCurrency(Number(i.current_value), currency)}</div>
                      <div className={`text-xs tabular-nums ${roi >= 0 ? "text-success" : "text-destructive"}`}>
                        {roi >= 0 ? "+" : ""}{formatPercent(roi)}
                      </div>
                    </div>
                    <button onClick={() => remove(i.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            }) : <p className="py-6 text-center text-sm text-muted-foreground">No investments yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
