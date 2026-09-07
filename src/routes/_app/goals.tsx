import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useGoals, useProfile, goalsCrud, type Goal } from "@/lib/queries";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ListSkeleton, EmptyState, ConfirmDelete } from "@/components/ui-states";
import { Plus, Trash2, Pencil, Target } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/goals")({ head: () => ({ meta: [{ title: "Goals — Fanika" }] }), component: Goals });

type FormState = { name: string; target: string; current: string; deadline: string };
const emptyForm: FormState = { name: "", target: "", current: "", deadline: "" };

function validate(f: FormState): string | null {
  if (!f.name.trim()) return "Give this goal a name.";
  const target = Number(f.target);
  if (!Number.isFinite(target) || target <= 0) return "Target amount must be a positive number.";
  if (f.current !== "" && (!Number.isFinite(Number(f.current)) || Number(f.current) < 0)) return "Saved amount must be zero or more.";
  return null;
}

function Goals() {
  const { user } = useAuth();
  const goals = useGoals();
  const profile = useProfile();
  const currency = profile.data?.currency ?? "KES";

  const addMutation = goalsCrud.useAdd();
  const updateMutation = goalsCrud.useUpdate();
  const removeMutation = goalsCrud.useRemove();
  const restoreMutation = goalsCrud.useRestore();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }
  function openEdit(g: Goal) {
    setEditing(g);
    setForm({ name: g.name, target: String(g.target_amount), current: String(g.current_amount), deadline: g.deadline ?? "" });
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate(form);
    if (err) return toast.error(err);
    const payload = {
      name: form.name.trim(),
      target_amount: Number(form.target),
      current_amount: Number(form.current || 0),
      deadline: form.deadline || null,
    };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, patch: payload });
        toast.success("Goal updated");
      } else {
        await addMutation.mutateAsync({ user_id: user!.id, ...payload });
        toast.success("Goal created");
      }
      setOpen(false);
      setForm(emptyForm);
      setEditing(null);
    } catch (err2: any) {
      toast.error(err2?.message ?? "Something went wrong saving this goal.");
    }
  }

  async function updateProgress(g: Goal, current: number) {
    if (!Number.isFinite(current) || current < 0) return toast.error("Enter a valid amount.");
    try {
      await updateMutation.mutateAsync({ id: g.id, patch: { current_amount: current } });
      toast.success("Progress updated");
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't update progress.");
    }
  }

  async function remove(g: Goal) {
    try {
      await removeMutation.mutateAsync(g.id);
      toast.success(`"${g.name}" deleted`, {
        action: {
          label: "Undo",
          onClick: () => {
            restoreMutation.mutate(g, {
              onError: () => toast.error("Couldn't restore the goal."),
              onSuccess: () => toast.success(`"${g.name}" restored`),
            });
          },
        },
      });
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't delete this goal.");
    }
  }

  const busy = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Savings goals</h2>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> New goal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit goal" : "Create goal"}</DialogTitle>
              <DialogDescription>
                {editing ? "Update the target, progress, or deadline for this goal." : "Set a target amount and optional deadline to track your progress."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Emergency fund" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Target amount</Label>
                  <Input type="number" required value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Saved so far</Label>
                  <Input type="number" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Deadline</Label>
                <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={busy} aria-busy={busy}>
                {busy ? "Saving…" : editing ? "Save changes" : "Save"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {goals.isLoading ? (
        <ListSkeleton rows={3} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" />
      ) : goals.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.data.map((g) => {
            const pct = g.target_amount > 0 ? Math.min(100, (g.current_amount / g.target_amount) * 100) : 0;
            return (
              <div key={g.id} className="min-w-0 rounded-2xl border bg-card p-5 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Target className="h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate">{g.name}</span>
                    </div>
                    {g.deadline && <div className="mt-0.5 text-xs text-muted-foreground">By {g.deadline}</div>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" aria-label={`Edit ${g.name}`} onClick={() => openEdit(g)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <ConfirmDelete
                      trigger={
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label={`Delete ${g.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
                      title={`Delete "${g.name}"?`}
                      description="This removes the goal and its saved progress. You can undo this immediately after deleting."
                      busy={removeMutation.isPending}
                      onConfirm={() => remove(g)}
                    />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-semibold tabular-nums">
                  {formatCurrency(g.current_amount, currency)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    / {formatCurrency(g.target_amount, currency)}
                  </span>
                </div>
                <Progress value={pct} className="mt-3" />
                <div className="mt-3 flex gap-2">
                  <Input
                    type="number"
                    placeholder="Update progress"
                    aria-label={`Update saved amount for ${g.name}`}
                    className="h-9"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        updateProgress(g, Number((e.target as HTMLInputElement).value));
                        (e.target as HTMLInputElement).value = "";
                      }
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Create your first savings goal to start putting money aside with intention."
          action={{ label: "Create your first goal", onClick: openCreate }}
        />
      )}
    </div>
  );
}
