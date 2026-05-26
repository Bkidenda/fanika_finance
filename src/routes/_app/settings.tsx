import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, useDeductions } from "@/lib/queries";
import { computeBreakdown, DEFAULT_STATUTORY, type Deduction } from "@/lib/finance";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({ component: Settings });

function Settings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const profile = useProfile();
  const deductions = useDeductions();

  const [fullName, setFullName] = useState("");
  const [currency, setCurrency] = useState("KES");
  const [gross, setGross] = useState("");

  useEffect(() => {
    if (profile.data) {
      setFullName(profile.data.full_name ?? "");
      setCurrency(profile.data.currency);
      setGross(String(profile.data.gross_income ?? 0));
    }
  }, [profile.data]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, currency, gross_income: Number(gross) })
      .eq("id", user!.id);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  async function seedStatutory() {
    const rows = DEFAULT_STATUTORY.map((d) => ({ ...d, user_id: user!.id }));
    const { error } = await supabase.from("deductions").insert(rows);
    if (error) return toast.error(error.message);
    toast.success("Default statutory deductions added");
    qc.invalidateQueries({ queryKey: ["deductions"] });
  }

  const breakdown = computeBreakdown(Number(gross) || 0, deductions.data ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">Your income engine and deductions</p>
      </div>

      <form onSubmit={saveProfile} className="rounded-2xl border bg-card p-6 shadow-card">
        <h3 className="font-semibold">Profile & income</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["KES", "USD", "EUR", "GBP", "UGX", "TZS", "NGN", "ZAR", "INR"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Gross monthly income</Label>
            <Input type="number" min="0" value={gross} onChange={(e) => setGross(e.target.value)} />
          </div>
        </div>
        <Button type="submit" className="mt-4">Save profile</Button>
      </form>

      <div className="rounded-2xl border bg-gradient-hero p-6 text-primary-foreground shadow-elevated">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-80">
          <Sparkles className="h-4 w-4" /> Net income calculation
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <Row label="Gross" value={formatCurrency(breakdown.gross, currency)} />
          <Row label="Tithe (10%)" value={`− ${formatCurrency(breakdown.tithe, currency)}`} />
          <Row label="Statutory" value={`− ${formatCurrency(breakdown.statutory, currency)}`} />
          <Row label="Custom" value={`− ${formatCurrency(breakdown.custom, currency)}`} />
          <Row label="Net" value={formatCurrency(breakdown.net, currency)} emphasize />
        </div>
      </div>

      <DeductionsCard
        title="Statutory deductions"
        kind="statutory"
        items={(deductions.data ?? []).filter((d) => d.type === "statutory")}
        currency={currency}
        seedStatutory={seedStatutory}
      />
      <DeductionsCard
        title="Custom deductions"
        kind="custom"
        items={(deductions.data ?? []).filter((d) => d.type === "custom")}
        currency={currency}
      />
    </div>
  );
}

function Row({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className={`rounded-xl bg-white/10 p-3 ${emphasize ? "ring-2 ring-white/30" : ""}`}>
      <div className="text-xs opacity-80">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function DeductionsCard({
  title, kind, items, currency, seedStatutory,
}: {
  title: string;
  kind: "statutory" | "custom";
  items: Deduction[];
  currency: string;
  seedStatutory?: () => void;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{
    name: string; rule: "fixed" | "percentage"; value: string; frequency: "monthly" | "annual" | "one_time";
  }>({ name: "", rule: "fixed", value: "", frequency: "monthly" });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("deductions").insert({
      user_id: user!.id,
      type: kind,
      name: form.name,
      rule: form.rule,
      value: Number(form.value),
      frequency: form.frequency,
    });
    if (error) return toast.error(error.message);
    toast.success("Deduction added");
    setOpen(false);
    setForm({ name: "", rule: "fixed", value: "", frequency: "monthly" });
    qc.invalidateQueries({ queryKey: ["deductions"] });
  }

  async function remove(id: string) {
    await supabase.from("deductions").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["deductions"] });
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <div className="flex gap-2">
          {kind === "statutory" && items.length === 0 && seedStatutory && (
            <Button variant="outline" size="sm" onClick={seedStatutory}>Load defaults</Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Add</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add {kind} deduction</DialogTitle></DialogHeader>
              <form onSubmit={add} className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Rule</Label>
                    <Select value={form.rule} onValueChange={(v) => setForm({ ...form, rule: v as "fixed" | "percentage" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed amount</SelectItem>
                        <SelectItem value="percentage">Percentage of gross</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{form.rule === "percentage" ? "Rate (%)" : "Amount"}</Label>
                    <Input type="number" step="0.01" required value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Frequency</Label>
                  <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v as "monthly" | "annual" | "one_time" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="one_time">One-time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Add</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="mt-4 divide-y">
        {items.length ? items.map((d) => (
          <div key={d.id} className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm font-medium">{d.name}</div>
              <div className="text-xs text-muted-foreground">
                {d.rule === "percentage" ? `${d.value}%` : formatCurrency(d.value, currency)} · {d.frequency}
              </div>
            </div>
            <button onClick={() => remove(d.id)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )) : (
          <p className="py-6 text-center text-sm text-muted-foreground">None yet.</p>
        )}
      </div>
    </div>
  );
}
