import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useInvestments, useProfile, investmentsCrud, type Investment } from "@/lib/queries";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ListSkeleton, EmptyState, ConfirmDelete } from "@/components/ui-states";
import { Plus, Trash2, Pencil, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { chartColorByRank, rankByValue } from "@/lib/chart-colors";

const TYPES = ["savings", "sacco", "stocks", "crypto", "bonds", "fixed_deposit", "business", "other"] as const;

export const Route = createFileRoute("/_app/investments")({ head: () => ({ meta: [{ title: "Investments — Fanika" }] }), component: Investments });

type FormState = {
  name: string; type: (typeof TYPES)[number]; institution: string;
  amount_invested: string; current_value: string; start_date: string; notes: string;
};
const emptyForm: FormState = {
  name: "", type: "savings", institution: "", amount_invested: "", current_value: "",
  start_date: new Date().toISOString().slice(0, 10), notes: "",
};

function validate(f: FormState): string | null {
  if (!f.name.trim()) return "Give this investment a name.";
  const amt = Number(f.amount_invested);
  if (!Number.isFinite(amt) || amt < 0) return "Amount invested must be zero or more.";
  if (f.current_value !== "" && (!Number.isFinite(Number(f.current_value)) || Number(f.current_value) < 0)) return "Current value must be zero or more.";
  return null;
}

function Investments() {
  const { user } = useAuth();
  const investments = useInvestments();
  const profile = useProfile();
  const currency = profile.data?.currency ?? "KES";

  const addMutation = investmentsCrud.useAdd();
  const updateMutation = investmentsCrud.useUpdate();
  const removeMutation = investmentsCrud.useRemove();
  const restoreMutation = investmentsCrud.useRestore();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  function openCreate() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(i: Investment) {
    setEditing(i);
    setForm({
      name: i.name, type: (i.type as (typeof TYPES)[number]) ?? "other", institution: i.institution ?? "",
      amount_invested: String(i.amount_invested), current_value: String(i.current_value),
      start_date: i.start_date ?? emptyForm.start_date, notes: i.notes ?? "",
    });
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate(form);
    if (err) return toast.error(err);
    const payload = {
      name: form.name.trim(),
      type: form.type,
      institution: form.institution.trim() || null,
      amount_invested: Number(form.amount_invested),
      current_value: Number(form.current_value || form.amount_invested),
      start_date: form.start_date,
      notes: form.notes.trim() || null,
    };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, patch: payload });
        toast.success("Investment updated");
      } else {
        await addMutation.mutateAsync({ user_id: user!.id, ...payload });
        toast.success("Investment added");
      }
      setOpen(false); setForm(emptyForm); setEditing(null);
    } catch (err2: any) {
      toast.error(err2?.message ?? "Something went wrong saving this investment.");
    }
  }

  async function remove(i: Investment) {
    try {
      await removeMutation.mutateAsync(i.id);
      toast.success(`"${i.name}" deleted`, {
        action: {
          label: "Undo",
          onClick: () => {
            restoreMutation.mutate(i, {
              onError: () => toast.error("Couldn't restore the investment."),
              onSuccess: () => toast.success(`"${i.name}" restored`),
            });
          },
        },
      });
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't delete this investment.");
    }
  }

  const items = investments.data ?? [];
  const totalInvested = items.reduce((s, i) => s + Number(i.amount_invested), 0);
  const totalValue = items.reduce((s, i) => s + Number(i.current_value), 0);
  const totalROI = totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0;

  const allocation = rankByValue(items.map((i) => ({ name: i.name, value: Number(i.current_value) })));
  const busy = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Investments</h2>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Add asset</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit investment" : "Add investment"}</DialogTitle>
              <DialogDescription>
                {editing ? "Update this asset's value or details." : "Track a savings plan, SACCO share, stock, or other asset."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-3">
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
              <Button type="submit" className="w-full" disabled={busy} aria-busy={busy}>
                {busy ? "Saving…" : editing ? "Save changes" : "Save"}
              </Button>
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

      {investments.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <ListSkeleton rows={1} className="[&>*]:h-72" />
          <ListSkeleton rows={4} />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="min-w-0 rounded-2xl border bg-card p-6 shadow-card">
            <h3 className="font-semibold">Portfolio allocation</h3>
            <div className="mt-4 h-72">
              {allocation.length ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={allocation} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                      {allocation.map((_, i) => <Cell key={i} fill={chartColorByRank(i)} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No assets yet</p>}
            </div>
          </div>

          <div className="min-w-0 rounded-2xl border bg-card p-6 shadow-card">
            <h3 className="font-semibold">Assets</h3>
            {items.length ? (
              <div className="mt-3 divide-y">
                {items.map((i) => {
                  const roi = Number(i.amount_invested) > 0
                    ? ((Number(i.current_value) - Number(i.amount_invested)) / Number(i.amount_invested)) * 100
                    : 0;
                  return (
                    <div key={i.id} className="flex items-center justify-between gap-2 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{i.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {i.type.replace("_", " ")} · {i.institution || "—"}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 text-right">
                        <div>
                          <div className="text-sm font-medium tabular-nums">{formatCurrency(Number(i.current_value), currency)}</div>
                          <div className={`text-xs tabular-nums ${roi >= 0 ? "text-success" : "text-destructive"}`}>
                            {roi >= 0 ? "+" : ""}{formatPercent(roi)}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" aria-label={`Edit ${i.name}`} onClick={() => openEdit(i)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmDelete
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label={`Delete ${i.name}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                          title={`Delete "${i.name}"?`}
                          description="This removes the investment from your portfolio. You can undo this immediately after deleting."
                          busy={removeMutation.isPending}
                          onConfirm={() => remove(i)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={PiggyBank}
                title="No investments yet"
                description="Add a savings plan, SACCO share, or other asset to track its growth over time."
                action={{ label: "Add your first asset", onClick: openCreate }}
                className="mt-3"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
