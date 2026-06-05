import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, useAccounts } from "@/lib/queries";
import { formatCurrency, isoLocalDate, monthKey } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, Users, HeartHandshake } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/family")({ component: FamilyPage });

const RELATIONSHIPS = ["Parent", "Sibling", "Spouse", "Child", "Extended", "Other"];
const CONTRIBUTION_CATS = [
  { v: "allowance", l: "Allowance" },
  { v: "school_fees", l: "School fees" },
  { v: "medical", l: "Medical" },
  { v: "emergency", l: "Emergency" },
  { v: "other", l: "Other" },
];

type Family = { id: string; owner_id: string; name: string };
type Member = { id: string; family_id: string; name: string; relationship: string | null; monthly_allowance: number; notes: string | null };
type Contribution = { id: string; family_id: string; member_id: string | null; amount: number; paid_on: string; account_id: string | null; category: string; note: string | null };

function FamilyPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const profile = useProfile();
  const accounts = useAccounts();
  const currency = profile.data?.currency ?? "KES";

  const family = useQuery({
    queryKey: ["family", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("families" as never).select("*").eq("owner_id", user!.id).maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      return (data ?? null) as unknown as Family | null;
    },
  });

  const members = useQuery({
    queryKey: ["family-members", family.data?.id], enabled: !!family.data?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("family_members" as never).select("*").eq("family_id", family.data!.id).order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as Member[];
    },
  });

  const contributions = useQuery({
    queryKey: ["family-contributions", family.data?.id], enabled: !!family.data?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("family_contributions" as never).select("*").eq("family_id", family.data!.id).order("paid_on", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Contribution[];
    },
  });

  // Auto-create a family if none exists
  useEffect(() => {
    if (!user || family.isLoading || family.data) return;
    (async () => {
      const { error } = await supabase.from("families" as never).insert({ owner_id: user.id, name: "My Family" } as never);
      if (!error) qc.invalidateQueries({ queryKey: ["family", user.id] });
    })();
  }, [user, family.isLoading, family.data, qc]);

  const [mOpen, setMOpen] = useState(false);
  const [m, setM] = useState({ name: "", relationship: "Parent", monthly_allowance: "", notes: "" });
  const [cOpen, setCOpen] = useState(false);
  const [c, setC] = useState({ member_id: "", amount: "", paid_on: isoLocalDate(), account_id: "", category: "allowance", note: "" });

  function invalidateFam() {
    qc.invalidateQueries({ queryKey: ["family-members"] });
    qc.invalidateQueries({ queryKey: ["family-contributions"] });
    qc.invalidateQueries({ queryKey: ["expenses"] });
    qc.invalidateQueries({ queryKey: ["expenses-all"] });
    qc.invalidateQueries({ queryKey: ["accounts"] });
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!family.data) return;
    const { error } = await supabase.from("family_members" as never).insert({
      family_id: family.data.id, user_id: user!.id, name: m.name,
      relationship: m.relationship, monthly_allowance: Number(m.monthly_allowance) || 0, notes: m.notes || null,
    } as never);
    if (error) return toast.error(error.message);
    toast.success("Family member added");
    setMOpen(false); setM({ name: "", relationship: "Parent", monthly_allowance: "", notes: "" });
    invalidateFam();
  }

  async function removeMember(id: string) {
    await supabase.from("family_members" as never).delete().eq("id", id);
    invalidateFam();
  }

  async function addContribution(e: React.FormEvent) {
    e.preventDefault();
    if (!family.data) return;
    const n = Number(c.amount);
    if (!n || n <= 0) return toast.error("Enter amount");
    if (!c.account_id) return toast.error("Choose account to debit");
    const { error } = await supabase.from("family_contributions" as never).insert({
      user_id: user!.id, family_id: family.data.id,
      member_id: c.member_id || null, amount: n, paid_on: c.paid_on,
      account_id: c.account_id, category: c.category, note: c.note || null,
    } as never);
    if (error) return toast.error(error.message);
    toast.success("Contribution recorded — account debited and posted to expenses");
    setCOpen(false); setC({ member_id: "", amount: "", paid_on: isoLocalDate(), account_id: "", category: "allowance", note: "" });
    invalidateFam();
  }

  async function removeContribution(id: string) {
    await supabase.from("family_contributions" as never).delete().eq("id", id);
    invalidateFam();
  }

  const monthStart = monthKey();
  const monthEndDate = new Date(monthStart); monthEndDate.setMonth(monthEndDate.getMonth() + 1);
  const monthEnd = `${monthEndDate.getFullYear()}-${String(monthEndDate.getMonth() + 1).padStart(2, "0")}-01`;

  const paidPerMember = new Map<string, number>();
  (contributions.data ?? []).filter((x) => x.paid_on >= monthStart && x.paid_on < monthEnd).forEach((x) => {
    if (x.member_id) paidPerMember.set(x.member_id, (paidPerMember.get(x.member_id) ?? 0) + Number(x.amount));
  });
  const totalAllowance = (members.data ?? []).reduce((s, x) => s + Number(x.monthly_allowance), 0);
  const totalPaid = (contributions.data ?? []).filter((x) => x.paid_on >= monthStart && x.paid_on < monthEnd).reduce((s, x) => s + Number(x.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Family suite</p>
          <h2 className="text-2xl font-semibold tracking-tight">Family obligations</h2>
          <p className="text-xs text-muted-foreground">Track allowances and support for parents, siblings, spouse and dependents. Each contribution debits an account and posts to Expenses (Family).</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={mOpen} onOpenChange={setMOpen}>
            <DialogTrigger asChild><Button variant="outline"><Plus className="mr-1 h-4 w-4" /> Add member</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add family member</DialogTitle></DialogHeader>
              <form onSubmit={addMember} className="space-y-3">
                <div className="space-y-1.5"><Label>Name</Label><Input required value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Relationship</Label>
                    <Select value={m.relationship} onValueChange={(v) => setM({ ...m, relationship: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{RELATIONSHIPS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Monthly allowance ({currency})</Label>
                    <Input type="number" step="100" value={m.monthly_allowance} onChange={(e) => setM({ ...m, monthly_allowance: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5"><Label>Notes</Label><Input value={m.notes} onChange={(e) => setM({ ...m, notes: e.target.value })} /></div>
                <Button type="submit" className="w-full">Add</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={cOpen} onOpenChange={setCOpen}>
            <DialogTrigger asChild><Button disabled={!members.data?.length}><Plus className="mr-1 h-4 w-4" /> Record contribution</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record family contribution</DialogTitle></DialogHeader>
              <form onSubmit={addContribution} className="space-y-3">
                <div className="space-y-1.5"><Label>Member</Label>
                  <Select value={c.member_id} onValueChange={(v) => setC({ ...c, member_id: v })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{(members.data ?? []).map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Amount ({currency})</Label><Input required type="number" step="0.01" value={c.amount} onChange={(e) => setC({ ...c, amount: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={c.paid_on} onChange={(e) => setC({ ...c, paid_on: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Category</Label>
                    <Select value={c.category} onValueChange={(v) => setC({ ...c, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CONTRIBUTION_CATS.map((x) => <SelectItem key={x.v} value={x.v}>{x.l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Pay from account</Label>
                    <Select value={c.account_id} onValueChange={(v) => setC({ ...c, account_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Pick account" /></SelectTrigger>
                      <SelectContent>{(accounts.data ?? []).map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5"><Label>Note</Label><Input value={c.note} onChange={(e) => setC({ ...c, note: e.target.value })} /></div>
                <Button type="submit" className="w-full">Record</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-gradient-hero p-4 text-primary-foreground shadow-elevated">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest opacity-80"><Users className="h-3.5 w-3.5" /> Members</div>
          <div className="mt-2 text-xl font-semibold tabular-nums md:text-2xl">{members.data?.length ?? 0}</div>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-card">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Monthly allowance budget</div>
          <div className="mt-2 text-xl font-semibold tabular-nums md:text-2xl">{formatCurrency(totalAllowance, currency)}</div>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-card">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Paid this month</div>
          <div className="mt-2 text-xl font-semibold tabular-nums md:text-2xl">{formatCurrency(totalPaid, currency)}</div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-card">
        <div className="border-b p-4 text-sm font-semibold">Family members</div>
        {members.data?.length ? (
          <div className="divide-y">
            {members.data.map((x) => {
              const paid = paidPerMember.get(x.id) ?? 0;
              const pct = x.monthly_allowance > 0 ? Math.min(100, (paid / x.monthly_allowance) * 100) : 0;
              return (
                <div key={x.id} className="space-y-2 px-4 py-3">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">{x.name} <span className="text-xs text-muted-foreground">· {x.relationship || "—"}</span></div>
                      <div className="text-xs text-muted-foreground">Allowance {formatCurrency(Number(x.monthly_allowance), currency)}/mo</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="tabular-nums text-xs text-muted-foreground">Paid {formatCurrency(paid, currency)}</span>
                      <button onClick={() => removeMember(x.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  {x.monthly_allowance > 0 && <Progress value={pct} />}
                </div>
              );
            })}
          </div>
        ) : <p className="p-8 text-center text-sm text-muted-foreground">No family members yet — add one to start tracking.</p>}
      </div>

      <div className="rounded-2xl border bg-card shadow-card">
        <div className="flex items-center gap-2 border-b p-4 text-sm font-semibold"><HeartHandshake className="h-4 w-4 text-primary" /> Contribution history</div>
        {contributions.data?.length ? (
          <div className="divide-y">
            {contributions.data.map((x) => {
              const memberName = members.data?.find((m) => m.id === x.member_id)?.name ?? "—";
              const acctName = accounts.data?.find((a) => a.id === x.account_id)?.name;
              return (
                <div key={x.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <div className="font-medium">{memberName}</div>
                    <div className="text-xs text-muted-foreground capitalize">{x.paid_on} · {x.category.replace("_", " ")}{acctName ? ` · ${acctName}` : ""}{x.note ? ` · ${x.note}` : ""}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="tabular-nums font-medium">{formatCurrency(Number(x.amount), currency)}</span>
                    <button onClick={() => removeContribution(x.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : <p className="p-8 text-center text-sm text-muted-foreground">No contributions recorded yet.</p>}
      </div>
    </div>
  );
}
