import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useBudgets, useExpenses, useProfile, useAllBudgets, useBudgetSplitRules, useIncomeEntries } from "@/lib/queries";
import { DEFAULT_BUDGET_CATEGORIES } from "@/lib/finance";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Archive, ChevronLeft, ChevronRight, Repeat } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/budgets")({ component: Budgets });

function firstOfMonthISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}
function shiftMonth(iso: string, delta: number) {
  const [y, m] = iso.split("-").map(Number);
  return firstOfMonthISO(new Date(y, (m - 1) + delta, 1));
}
function labelForMonth(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
}

function Budgets() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [month, setMonth] = useState(() => firstOfMonthISO(new Date()));

  const profile = useProfile();
  const budgets = useBudgets(month);
  const expenses = useExpenses(month);
  const allBudgets = useAllBudgets();
  const splitRules = useBudgetSplitRules(month);
  const incomeEntries = useIncomeEntries(month);
  const currency = profile.data?.currency ?? "KES";

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>(DEFAULT_BUDGET_CATEGORIES[0]);
  const [customCat, setCustomCat] = useState("");
  const [limit, setLimit] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [notes, setNotes] = useState("");
  const [splitCategory, setSplitCategory] = useState<string>(DEFAULT_BUDGET_CATEGORIES[0]);
  const [splitCustomCat, setSplitCustomCat] = useState("");
  const [splitPercent, setSplitPercent] = useState("25");
  const [splitBaseType, setSplitBaseType] = useState<"income" | "disposable">("income");
  const [splitNotes, setSplitNotes] = useState("");
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Group spend by category for this month.
  const spendByCat = useMemo(() => {
    const map = new Map<string, number>();
    (expenses.data ?? []).forEach((e) =>
      map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount)),
    );
    return map;
  }, [expenses.data]);

  // Totals.
  const totalBudget = (budgets.data ?? []).reduce((s, b) => s + Number(b.limit_amount), 0);
  const totalSpent = (expenses.data ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const remaining = totalBudget - totalSpent;
  const monthlyIncome = (incomeEntries.data ?? []).reduce((s, entry) => s + Number(entry.amount), 0);
  const disposableBase = Math.max(0, monthlyIncome);
  const splitSuggestions = useMemo(() => {
    const rules = (splitRules.data ?? []).filter((rule) => Number(rule.percentage) > 0);
    if (!rules.length) return [] as Array<{ category: string; amount: number; percentage: number }>;
    return rules.map((rule) => ({
      category: rule.category,
      percentage: Number(rule.percentage),
      amount: (splitBaseType === "disposable" ? disposableBase : monthlyIncome) * (Number(rule.percentage) / 100),
    }));
  }, [disposableBase, monthlyIncome, splitBaseType, splitRules.data]);
  const utilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const variance = totalBudget - totalSpent;

  // Auto-seed month from previous month if empty.
  const seededRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!user) return;
    if (budgets.isLoading || allBudgets.isLoading) return;
    if ((budgets.data ?? []).length > 0) return;
    if (seededRef.current.has(month)) return;
    // Find latest prior month with budgets
    const priorMonths = Array.from(new Set((allBudgets.data ?? []).map((b) => b.month))).filter((m) => m < month).sort().reverse();
    const source = priorMonths[0];
    if (!source) return;
    const sourceLines = (allBudgets.data ?? []).filter((b) => b.month === source);
    if (!sourceLines.length) return;
    seededRef.current.add(month);
    void (async () => {
      const rows = sourceLines.map((s) => ({
        user_id: user.id,
        category: s.category,
        month,
        limit_amount: s.is_recurring ? Number(s.limit_amount) : 0,
        is_recurring: s.is_recurring,
        notes: s.notes,
      }));
      const { error } = await supabase.from("budgets").upsert(rows, { onConflict: "user_id,category,month" });
      if (error) return; // silent
      qc.invalidateQueries({ queryKey: ["budgets"] });
      qc.invalidateQueries({ queryKey: ["budgets-all"] });
      toast.success(`Seeded ${sourceLines.length} lines from ${labelForMonth(source)}`);
    })();
  }, [user, month, budgets.data, budgets.isLoading, allBudgets.data, allBudgets.isLoading, qc]);

  async function saveNew(e: React.FormEvent) {
    e.preventDefault();
    const cat = category === "__custom__" ? customCat.trim() : category;
    if (!cat) return toast.error("Pick a category");
    const amt = Number(limit || 0);
    if (!Number.isFinite(amt) || amt < 0) return toast.error("Invalid amount");
    const { error } = await supabase.from("budgets").upsert(
      { user_id: user!.id, category: cat, month, limit_amount: amt, is_recurring: recurring, notes: notes || null },
      { onConflict: "user_id,category,month" },
    );
    if (error) return toast.error(error.message);
    toast.success("Budget saved");
    setOpen(false); setLimit(""); setCustomCat(""); setNotes(""); setRecurring(false);
    qc.invalidateQueries({ queryKey: ["budgets"] });
    qc.invalidateQueries({ queryKey: ["budgets-all"] });
  }

  async function updateField(id: string, patch: Partial<{ limit_amount: number; notes: string | null; is_recurring: boolean; archived_at: string | null }>) {
    const { error } = await supabase.from("budgets").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["budgets"] });
    qc.invalidateQueries({ queryKey: ["budgets-all"] });
  }

  async function removeLine(line: { id: string; category: string; limit_amount: number; is_recurring: boolean; notes: string | null }) {
    const { error } = await supabase.from("budgets").delete().eq("id", line.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["budgets"] });
    qc.invalidateQueries({ queryKey: ["budgets-all"] });
    toast.success(`"${line.category}" removed`, {
      action: {
        label: "Undo",
        onClick: async () => {
          const { error: err } = await supabase.from("budgets").upsert(
            {
              user_id: user!.id, category: line.category, month,
              limit_amount: Number(line.limit_amount), is_recurring: line.is_recurring, notes: line.notes,
            },
            { onConflict: "user_id,category,month" },
          );
          if (err) return toast.error("Couldn't restore this budget line.");
          toast.success(`"${line.category}" restored`);
          qc.invalidateQueries({ queryKey: ["budgets"] });
          qc.invalidateQueries({ queryKey: ["budgets-all"] });
        },
      },
    });
  }


  async function saveSplitRule(e: React.FormEvent) {
    e.preventDefault();
    const cat = splitCategory === "__custom__" ? splitCustomCat.trim() : splitCategory;
    if (!cat) return toast.error("Pick a category");
    const pct = Number(splitPercent);
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) return toast.error("Percent must be between 1 and 100");

    const payload = {
      user_id: user!.id,
      category: cat,
      percentage: pct,
      base_type: splitBaseType,
      month,
      active: true,
      notes: splitNotes || null,
    };

    if (editingRuleId) {
      const { error } = await (supabase.from("budget_split_rules" as never) as any).update(payload).eq("id", editingRuleId);
      if (error) return toast.error(error.message);
      toast.success("Split rule updated");
    } else {
      const { error } = await (supabase.from("budget_split_rules" as never) as any).upsert(payload, { onConflict: "user_id,category,month,base_type" });
      if (error) return toast.error(error.message);
      toast.success("Split rule saved");
    }

    setEditingRuleId(null);
    setSplitCategory(DEFAULT_BUDGET_CATEGORIES[0]);
    setSplitCustomCat("");
    setSplitNotes("");
    setSplitPercent("25");
    setSplitBaseType("income");
    qc.invalidateQueries({ queryKey: ["budget-split-rules"] });
  }

  async function applySplitRulesToBudgets() {
    if (!user) return;
    const rules = (splitRules.data ?? []).filter((rule) => Number(rule.percentage) > 0);
    if (!rules.length) return toast.error("Add at least one split rule first");
    for (const rule of rules) {
      const pct = Number(rule.percentage ?? 0);
      if (!Number.isFinite(pct) || pct <= 0) continue;
      const baseAmount = rule.base_type === "disposable" ? disposableBase : monthlyIncome;
      const amount = baseAmount * (pct / 100);
      if (amount <= 0) continue;
      const { error } = await (supabase.from("budgets" as never) as any).upsert({
        user_id: user.id,
        category: rule.category,
        month,
        limit_amount: amount,
        is_recurring: false,
        notes: rule.notes ?? "Auto-filled from income split",
      }, { onConflict: "user_id,category,month" });
      if (error) return toast.error(error.message);
    }
    toast.success("Split rules applied to budget lines");
    qc.invalidateQueries({ queryKey: ["budgets"] });
    qc.invalidateQueries({ queryKey: ["budgets-all"] });
  }

  function startEditRule(rule: { id: string; category: string; percentage: number; base_type: "income" | "disposable"; notes: string | null }) {
    setEditingRuleId(rule.id);
    if (DEFAULT_BUDGET_CATEGORIES.includes(rule.category)) {
      setSplitCategory(rule.category);
      setSplitCustomCat("");
    } else {
      setSplitCategory("__custom__");
      setSplitCustomCat(rule.category);
    }
    setSplitPercent(String(rule.percentage));
    setSplitBaseType(rule.base_type);
    setSplitNotes(rule.notes ?? "");
  }

  async function removeSplitRule(id: string) {
    const { error } = await (supabase.from("budget_split_rules" as never) as any).update({ active: false }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Split rule removed");
    qc.invalidateQueries({ queryKey: ["budget-split-rules"] });
  }

  return (
    <div className="space-y-5">
      {/* Month nav */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-full border bg-card p-1 shadow-card">
          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => setMonth((m) => shiftMonth(m, -1))} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[140px] text-center text-sm font-semibold">{labelForMonth(month)}</div>
          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => setMonth((m) => shiftMonth(m, +1))} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Add budget line</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New budget line — {labelForMonth(month)}</DialogTitle></DialogHeader>
            <form onSubmit={saveNew} className="space-y-3">
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
                <Label>Amount ({currency})</Label>
                <Input type="number" min="0" step="1" value={limit} onChange={(e) => setLimit(e.target.value)} required />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">Recurring budget</div>
                  <div className="text-xs text-muted-foreground">Carry this amount into every new month automatically.</div>
                </div>
                <Switch checked={recurring} onCheckedChange={setRecurring} />
              </div>
              <div className="space-y-1.5">
                <Label>Notes (optional)</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Landlord — due 5th" />
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Totals grid */}
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-4">
        <TotalCard label="Total budget" value={formatCurrency(totalBudget, currency)} />
        <TotalCard label="Total spent" value={formatCurrency(totalSpent, currency)} />
        <TotalCard label="Remaining" value={formatCurrency(remaining, currency)} tone={remaining < 0 ? "danger" : "normal"} />
        <TotalCard label="Utilization" value={`${utilization.toFixed(1)}%`} tone={utilization > 100 ? "danger" : "normal"} />
      </div>

      {/* Percentage split tools */}
      <div className="rounded-2xl border bg-card p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold">Percentage split rules</h3>
            <p className="text-xs text-muted-foreground">Auto-suggest budget amounts from income. The rules apply to this month and can be customized.</p>
          </div>
        </div>
        <form onSubmit={saveSplitRule} className="grid gap-3 md:grid-cols-[1.2fr_0.7fr_0.8fr_auto]">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={splitCategory} onValueChange={setSplitCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DEFAULT_BUDGET_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                <SelectItem value="__custom__">Custom…</SelectItem>
              </SelectContent>
            </Select>
            {splitCategory === "__custom__" && (
              <Input className="mt-2" placeholder="Custom category" value={splitCustomCat} onChange={(e) => setSplitCustomCat(e.target.value)} />
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Percent</Label>
            <Input type="number" min="1" max="100" step="1" value={splitPercent} onChange={(e) => setSplitPercent(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Base</Label>
            <Select value={splitBaseType} onValueChange={(v) => setSplitBaseType(v as "income" | "disposable") }>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="disposable">Disposable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2 self-end">
            <Button type="submit">{editingRuleId ? "Update rule" : "Save rule"}</Button>
            {editingRuleId ? (
              <Button type="button" variant="outline" onClick={() => { setEditingRuleId(null); setSplitCategory(DEFAULT_BUDGET_CATEGORIES[0]); setSplitCustomCat(""); setSplitPercent("25"); setSplitBaseType("income"); setSplitNotes(""); }}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">Monthly split preview</div>
            <Button type="button" variant="outline" size="sm" onClick={applySplitRulesToBudgets}>Apply to budget lines</Button>
          </div>
          {splitSuggestions.length ? splitSuggestions.map((rule) => (
            <div key={`${rule.category}-${rule.percentage}`} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
              <span>{rule.category}</span>
              <span className="font-medium">{rule.percentage}% → {formatCurrency(rule.amount, currency)}</span>
            </div>
          )) : <div className="rounded-lg border border-dashed px-3 py-3 text-sm text-muted-foreground">Add a split rule to preview suggested budget amounts.</div>}
          {splitRules.data?.length ? (
            <div className="space-y-2 rounded-lg border p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Saved rules</div>
              {splitRules.data.map((rule) => {
                const amount = ((rule.base_type === "disposable" ? disposableBase : monthlyIncome) * Number(rule.percentage)) / 100;
                return (
                  <div key={rule.id} className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-sm">
                    <div>
                      <div className="font-medium">{rule.category}</div>
                      <div className="text-[11px] text-muted-foreground">{rule.percentage}% · {rule.base_type === "disposable" ? "Disposable" : "Income"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(amount, currency)}</span>
                      <button title="Edit rule" type="button" onClick={() => startEditRule(rule)} className="text-muted-foreground hover:text-primary">
                        Edit
                      </button>
                      <button title="Remove rule" type="button" onClick={() => removeSplitRule(rule.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {/* Variance chip */}
      <div className="rounded-2xl border bg-card p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">Variance (Budget − Actual)</span>
          <span className={`tabular-nums font-semibold ${variance < 0 ? "text-destructive" : "text-primary"}`}>
            {variance >= 0 ? "+" : "−"}{formatCurrency(Math.abs(variance), currency)}
          </span>
        </div>
        <Progress className="mt-3" value={Math.min(100, utilization)} />
      </div>

      {/* Lines */}
      <div className="rounded-2xl border bg-card p-3 shadow-card md:p-6">
        {budgets.isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : budgets.data?.length ? (
          <ul className="divide-y">
            {budgets.data.map((b) => {
              const spent = spendByCat.get(b.category) ?? 0;
              const pct = b.limit_amount > 0 ? Math.min(100, (spent / b.limit_amount) * 100) : 0;
              const over = spent > b.limit_amount && b.limit_amount > 0;
              return (
                <li key={b.id} className="space-y-2 py-3">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 md:grid-cols-[minmax(0,1.4fr)_auto_auto_auto]">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{b.category}</span>
                        {b.is_recurring && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            <Repeat className="h-2.5 w-2.5" /> Recurring
                          </span>
                        )}
                      </div>
                      <EditableNotes id={b.id} value={b.notes ?? ""} onSaved={(v) => updateField(b.id, { notes: v || null })} />
                    </div>
                    <div className="text-right text-xs text-muted-foreground md:text-sm">
                      <div className={over ? "text-destructive" : ""}>
                        {formatCurrency(spent, currency)} <span className="text-muted-foreground">/</span>{" "}
                        <EditableAmount value={Number(b.limit_amount)} currency={currency} onSave={(n) => updateField(b.id, { limit_amount: n })} />
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-3 md:col-span-1">
                      <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Switch checked={b.is_recurring} onCheckedChange={(v) => updateField(b.id, { is_recurring: v })} />
                        Recurring
                      </label>
                    </div>
                    <div className="col-span-2 flex justify-end gap-1 md:col-span-1">
                      <button
                        title="Archive"
                        aria-label={`Archive ${b.category}`}
                        onClick={() => updateField(b.id, { archived_at: new Date().toISOString() })}
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                      <ConfirmDelete
                        trigger={
                          <button title="Delete" aria-label={`Delete ${b.category}`} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        }
                        title={`Delete "${b.category}"?`}
                        description="This removes the budget line for this month. You can undo this right after deleting."
                        onConfirm={() => removeLine({ id: b.id, category: b.category, limit_amount: Number(b.limit_amount), is_recurring: b.is_recurring, notes: b.notes ?? null })}
                      />
                    </div>

                  </div>
                  <Progress value={pct} />
                  {over && <p className="text-xs text-destructive">Over budget by {formatCurrency(spent - Number(b.limit_amount), currency)}</p>}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">No budget lines for {labelForMonth(month)} yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">Add your first line, or navigate to a prior month — new months auto-seed from the previous one.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TotalCard({ label, value, tone = "normal" }: { label: string; value: string; tone?: "normal" | "danger" }) {
  return (
    <div className="rounded-2xl border bg-card p-3 shadow-card md:p-5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground md:text-xs">{label}</div>
      <div className={`mt-0.5 text-base font-semibold tabular-nums md:text-2xl ${tone === "danger" ? "text-destructive" : ""}`}>{value}</div>
    </div>
  );
}

function EditableAmount({ value, currency, onSave }: { value: number; currency: string; onSave: (n: number) => unknown }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(String(value));
  useEffect(() => setV(String(value)), [value]);
  function commit() {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) { toast.error("Invalid amount"); setV(String(value)); setEditing(false); return; }
    setEditing(false);
    if (n !== value) void onSave(n);
  }
  if (editing) {
    return (
      <input
        autoFocus type="number" step="1" min="0" value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setV(String(value)); setEditing(false); } }}
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

function EditableNotes({ id, value, onSaved }: { id: string; value: string; onSaved: (v: string) => unknown }) {
  const [v, setV] = useState(value);
  const [editing, setEditing] = useState(false);
  useEffect(() => setV(value), [value]);
  if (editing) {
    return (
      <input
        autoFocus value={v} onChange={(e) => setV(e.target.value)}
        onBlur={() => { setEditing(false); if (v !== value) void onSaved(v); }}
        onKeyDown={(e) => { if (e.key === "Enter") { setEditing(false); if (v !== value) void onSaved(v); } if (e.key === "Escape") { setV(value); setEditing(false); } }}
        placeholder="Add notes…"
        className="mt-0.5 w-full rounded border bg-background px-1.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-primary"
      />
    );
  }
  return (
    <button onClick={() => setEditing(true)} className={`mt-0.5 block truncate text-left text-[11px] ${value ? "text-muted-foreground" : "text-muted-foreground/60 italic"}`}>
      {value || "Add notes…"}
    </button>
  );
}
