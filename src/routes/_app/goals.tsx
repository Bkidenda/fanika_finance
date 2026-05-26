import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useGoals, useProfile } from "@/lib/queries";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Target } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/goals")({ component: Goals });

function Goals() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const goals = useGoals();
  const profile = useProfile();
  const currency = profile.data?.currency ?? "KES";

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", target: "", current: "", deadline: "" });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("savings_goals").insert({
      user_id: user!.id,
      name: form.name,
      target_amount: Number(form.target),
      current_amount: Number(form.current || 0),
      deadline: form.deadline || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Goal created");
    setOpen(false);
    setForm({ name: "", target: "", current: "", deadline: "" });
    qc.invalidateQueries({ queryKey: ["goals"] });
  }

  async function updateProgress(id: string, current: number) {
    const { error } = await supabase.from("savings_goals").update({ current_amount: current }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["goals"] });
  }

  async function remove(id: string) {
    await supabase.from("savings_goals").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["goals"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Savings goals</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1 h-4 w-4" /> New goal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create goal</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-3">
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
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(goals.data ?? []).map((g) => {
          const pct = g.target_amount > 0 ? Math.min(100, (g.current_amount / g.target_amount) * 100) : 0;
          return (
            <div key={g.id} className="rounded-2xl border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Target className="h-4 w-4 text-primary" />
                    {g.name}
                  </div>
                  {g.deadline && <div className="mt-0.5 text-xs text-muted-foreground">By {g.deadline}</div>}
                </div>
                <button onClick={() => remove(g.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
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
                  className="h-9"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      updateProgress(g.id, Number((e.target as HTMLInputElement).value));
                      (e.target as HTMLInputElement).value = "";
                    }
                  }}
                />
              </div>
            </div>
          );
        })}
        {!goals.data?.length && (
          <div className="col-span-full rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
            No goals yet. Create your first one to start saving with intention.
          </div>
        )}
      </div>
    </div>
  );
}
