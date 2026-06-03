import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useBudgets, useExpenses, useProfile, useRecurringBudgets, useIncomeEntries } from "@/lib/queries";
import { DEFAULT_BUDGET_CATEGORIES } from "@/lib/finance";
import { formatCurrency, monthKey, monthLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Repeat } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/budgets")({ component: Budgets });

function Budgets() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const month = monthKey();
  const profile = useProfile();
  const budgets = useBudgets(month);
  const expenses = useExpenses(month);
  const recurring = useRecurringBudgets();
  const income = useIncomeEntries(month);
  const currency = profile.data?.currency ?? "KES";
  const titheEnabled = !!profile.data?.tithe_enabled;
  const titheRate = profile.data?.tithe_rate ?? 0.10;
  const availableIncome = (income.data ?? []).reduce((s, e) => {
    const t = (e.tithe_on ?? titheEnabled) ? Number(e.amount) * titheRate : 0;
    return s + Number(e.amount) - t;
  }, 0);

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(DEFAULT_BUDGET_CATEGORIES[0]);
  const [customCat, setCustomCat] = useState("");
  const [limit, setLimit] = useState("");

  const [recOpen, setRecOpen] = useState(false);
  const [recCat, setRecCat] = useState(DEFAULT_BUDGET_CATEGORIES[0]);
  const [recAmt, setRecAmt] = useState("");
  const [recStart, setRecStart] = useState(month);
  const [recEnd, setRecEnd] = useState("");

  const spendByCat = new Map<string, number>();
  (expenses.data ?? []).forEach((e) => spendByCat.set(e.category, (spendByCat.get(e.category) ?? 0) + Number(e.amount)));

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
    setOpen(false); setLimit(""); setCustomCat("");
    qc.invalidateQueries({ queryKey: ["budgets"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["budgets"] });
  }

  async function saveRecurring(e: React.FormEvent) {
    e.preventDefault();
    if (!recAmt) return;
    const { error } = await supabase.from("recurring_budgets").insert({
      user_id: user!.id, category: recCat, amount: Number(recAmt),
      start_month: recStart, end_month: recEnd || null, active: true,
    });
    if (error) return toast.error(error.message);
    toast.success("Recurring line added — auto-seeds next month");
    setRecOpen(false); setRecAmt(""); setRecEnd("");
    qc.invalidateQueries({ queryKey: ["recurring-budgets"] });
  }

  async function toggleRec(id: string, next: boolean) {
    await supabase.from("recurring_budgets").update({ active: next }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["recurring-budgets"] });
  }
  async function deleteRec(id: string) {
    await supabase.from("recurring_budgets").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["recurring-budgets"] });
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

      {availableIncome > 0 && total > availableIncome && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <span className="mt-0.5">⚠️</span>
          <div>
            <div className="font-semibold">Budget exceeds available funds by {formatCurrency(total - availableIncome, currency)}.</div>
            <div className="text-xs">Total budgeted ({formatCurrency(total, currency)}) is more than your post-tithe income this month ({formatCurrency(availableIncome, currency)}). Trim a category or add income.</div>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="hidden"><Plus className="mr-1 h-4 w-4" /> Add budget</Button>
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
                        {formatCurrency(s, currency)} / <EditableLimit id={b.id} value={Number(b.limit_amount)} currency={currency} onSaved={() => qc.invalidateQueries({ queryKey: ["budgets"] })} />
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

      {/* Recurring budget lines */}
      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Recurring budget lines</h3>
            </div>
            <p className="text-xs text-muted-foreground">Standing budgets like rent or insurance. Active lines auto-seed every new month when you close the current one.</p>
          </div>
          <Dialog open={recOpen} onOpenChange={setRecOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="mr-1 h-3.5 w-3.5" /> Add recurring line</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New recurring budget</DialogTitle></DialogHeader>
              <form onSubmit={saveRecurring} className="space-y-3">
                <div className="space-y-1.5"><Label>Category</Label>
                  <Select value={recCat} onValueChange={setRecCat}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{DEFAULT_BUDGET_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Monthly amount ({currency})</Label>
                  <Input type="number" min="0" step="100" required value={recAmt} onChange={(e) => setRecAmt(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Start month</Label><Input type="date" value={recStart} onChange={(e) => setRecStart(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>End month (optional)</Label><Input type="date" value={recEnd} onChange={(e) => setRecEnd(e.target.value)} /></div>
                </div>
                <Button type="submit" className="w-full">Save recurring line</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {recurring.data?.length ? (
          <div className="mt-4 divide-y">
            {recurring.data.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <div className="font-medium">{r.category}</div>
                  <div className="text-xs text-muted-foreground">From {r.start_month}{r.end_month ? ` to ${r.end_month}` : " · ongoing"}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums font-medium">{formatCurrency(Number(r.amount), currency)}/mo</span>
                  <Switch checked={r.active} onCheckedChange={(v) => toggleRec(r.id, v)} />
                  <button onClick={() => deleteRec(r.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No recurring lines yet. Add rent, insurance or any standing budget.</p>
        )}
      </div>
    </div>
  );
}

function EditableLimit({ id, value, currency, onSaved }: { id: string; value: number; currency: string; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(String(value));
  async function save() {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) return toast.error("Invalid amount");
    const { error } = await supabase.from("budgets").update({ limit_amount: n }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Budget updated");
    setEditing(false); onSaved();
  }
  if (editing) {
    return (
      <input
        autoFocus type="number" step="100" min="0" value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
        className="w-24 rounded border bg-background px-1.5 py-0.5 text-right text-sm tabular-nums outline-none focus:ring-1 focus:ring-primary"
      />
    );
  }
  return (
    <button onClick={() => { setV(String(value)); setEditing(true); }} className="underline-offset-2 hover:underline">
      {formatCurrency(value, currency)}
    </button>
  );
}
