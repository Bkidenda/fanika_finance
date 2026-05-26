import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useBudgets, useExpenses, useProfile } from "@/lib/queries";
import { DEFAULT_BUDGET_CATEGORIES } from "@/lib/finance";
import { formatCurrency, monthKey, monthLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/budgets")({ component: Budgets });

function Budgets() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const month = monthKey();
  const profile = useProfile();
  const budgets = useBudgets(month);
  const expenses = useExpenses(month);
  const currency = profile.data?.currency ?? "KES";

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(DEFAULT_BUDGET_CATEGORIES[0]);
  const [customCat, setCustomCat] = useState("");
  const [limit, setLimit] = useState("");

  const spendByCat = new Map<string, number>();
  (expenses.data ?? []).forEach((e) => {
    spendByCat.set(e.category, (spendByCat.get(e.category) ?? 0) + Number(e.amount));
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const cat = category === "__custom__" ? customCat.trim() : category;
    if (!cat || !limit) return;
    const { error } = await supabase.from("budgets").upsert(
      { user_id: user!.id, category: cat, month, limit_amount: Number(limit) },
      { onConflict: "user_id,category,month" }
    );
    if (error) return toast.error(error.message);
    toast.success("Budget saved");
    setOpen(false);
    setLimit("");
    setCustomCat("");
    qc.invalidateQueries({ queryKey: ["budgets"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["budgets"] });
  }

  const total = (budgets.data ?? []).reduce((s, b) => s + Number(b.limit_amount), 0);
  const spent = Array.from(spendByCat.values()).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{monthLabel()}</p>
          <h2 className="text-2xl font-semibold tracking-tight">Budgets</h2>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1 h-4 w-4" /> Add budget</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New budget for {monthLabel()}</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEFAULT_BUDGET_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    <SelectItem value="__custom__">Custom…</SelectItem>
                  </SelectContent>
                </Select>
                {category === "__custom__" && (
                  <Input className="mt-2" placeholder="Custom category" value={customCat} onChange={(e) => setCustomCat(e.target.value)} />
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Monthly limit ({currency})</Label>
                <Input type="number" min="0" step="100" value={limit} onChange={(e) => setLimit(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <div className="text-xs text-muted-foreground">Total budgeted</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{formatCurrency(total, currency)}</div>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <div className="text-xs text-muted-foreground">Total spent</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{formatCurrency(spent, currency)}</div>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <div className="text-xs text-muted-foreground">Remaining</div>
          <div className={`mt-1 text-2xl font-semibold tabular-nums ${spent > total ? "text-destructive" : ""}`}>
            {formatCurrency(total - spent, currency)}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-card">
        {budgets.data?.length ? (
          <div className="space-y-5">
            {budgets.data.map((b) => {
              const s = spendByCat.get(b.category) ?? 0;
              const pct = b.limit_amount > 0 ? Math.min(100, (s / b.limit_amount) * 100) : 0;
              const over = s > b.limit_amount;
              return (
                <div key={b.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{b.category}</span>
                    <div className="flex items-center gap-3">
                      <span className={over ? "text-destructive" : "text-muted-foreground"}>
                        {formatCurrency(s, currency)} / {formatCurrency(b.limit_amount, currency)}
                      </span>
                      <button onClick={() => remove(b.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <Progress value={pct} />
                  {over && <p className="text-xs text-destructive">Over budget by {formatCurrency(s - b.limit_amount, currency)}</p>}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">No budgets yet. Add your first one.</p>
        )}
      </div>
    </div>
  );
}
