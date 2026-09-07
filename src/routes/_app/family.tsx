import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, useAccounts, useExpenses, useIncomeEntries } from "@/lib/queries";
import { formatCurrency, isoLocalDate, monthKey } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, Users, HeartHandshake, Crown, GraduationCap, Stethoscope,
  Calendar as CalendarIcon, TrendingUp, AlertTriangle, Sparkles, PiggyBank, Home,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/family")({ head: () => ({ meta: [{ title: "Family — Fanika" }] }), component: FamilyGate });

function FamilyGate() {
  const profile = useProfile();
  const navigate = useNavigate();
  useEffect(() => {
    if (profile.data && !profile.data.family_plan_enabled) {
      toast.error("Enable Family Plan in settings to access this feature");
      navigate({ to: "/settings" });
    }
  }, [profile.data, navigate]);
  if (!profile.data?.family_plan_enabled) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center shadow-card">
        <Crown className="mx-auto h-8 w-8 text-amber-500" />
        <p className="mt-3 text-sm text-muted-foreground">Family Plan is locked. Redirecting to settings…</p>
      </div>
    );
  }
  return <FamilyPage />;
}

const RELATIONSHIPS = ["Parent", "Sibling", "Spouse", "Child", "Extended", "Other"];
const CONTRIBUTION_CATS = [
  { v: "allowance", l: "Allowance", icon: HeartHandshake },
  { v: "school_fees", l: "School fees", icon: GraduationCap },
  { v: "medical", l: "Medical", icon: Stethoscope },
  { v: "emergency", l: "Emergency", icon: AlertTriangle },
  { v: "other", l: "Other", icon: PiggyBank },
] as const;

type Family = { id: string; owner_id: string; name: string };
type Member = { id: string; family_id: string; name: string; relationship: string | null; monthly_allowance: number; notes: string | null };
type Contribution = { id: string; family_id: string; member_id: string | null; amount: number; paid_on: string; account_id: string | null; category: string; note: string | null };

function FamilyPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const profile = useProfile();
  const accounts = useAccounts();
  const expenses = useExpenses();
  const incomes = useIncomeEntries();
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
  const [filterMember, setFilterMember] = useState<string>("all");
  const [filterCat, setFilterCat] = useState<string>("all");

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

  const thisMonthContribs = (contributions.data ?? []).filter((x) => x.paid_on >= monthStart && x.paid_on < monthEnd);

  const paidPerMember = new Map<string, number>();
  thisMonthContribs.forEach((x) => {
    if (x.member_id) paidPerMember.set(x.member_id, (paidPerMember.get(x.member_id) ?? 0) + Number(x.amount));
  });

  const totalAllowance = (members.data ?? []).reduce((s, x) => s + Number(x.monthly_allowance), 0);
  const totalPaid = thisMonthContribs.reduce((s, x) => s + Number(x.amount), 0);
  const coverage = totalAllowance > 0 ? Math.min(100, (totalPaid / totalAllowance) * 100) : 0;
  const remaining = Math.max(0, totalAllowance - totalPaid);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    thisMonthContribs.forEach((x) => map.set(x.category, (map.get(x.category) ?? 0) + Number(x.amount)));
    return CONTRIBUTION_CATS.map((c) => ({ ...c, amount: map.get(c.v) ?? 0 }));
  }, [thisMonthContribs]);

  // 6-month trend
  const trend = useMemo(() => {
    const months: { key: string; label: string; total: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      const nd = new Date(d); nd.setMonth(nd.getMonth() + 1);
      const nkey = `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, "0")}-01`;
      const total = (contributions.data ?? []).filter((x) => x.paid_on >= key && x.paid_on < nkey).reduce((s, x) => s + Number(x.amount), 0);
      months.push({ key, label: d.toLocaleString("en-US", { month: "short" }), total });
    }
    return months;
  }, [contributions.data]);
  const trendMax = Math.max(1, ...trend.map((t) => t.total));

  // YTD & lifetime
  const yearStart = `${new Date().getFullYear()}-01-01`;
  const ytdTotal = (contributions.data ?? []).filter((x) => x.paid_on >= yearStart).reduce((s, x) => s + Number(x.amount), 0);
  const lifetimeTotal = (contributions.data ?? []).reduce((s, x) => s + Number(x.amount), 0);

  // Household income share
  const monthlyIncome = (incomes.data ?? []).reduce((s, x) => s + Number(x.amount), 0);
  const familyShare = monthlyIncome > 0 ? (totalPaid / monthlyIncome) * 100 : 0;

  // Filtered contributions
  const filteredContribs = (contributions.data ?? []).filter((x) => {
    if (filterMember !== "all" && x.member_id !== filterMember) return false;
    if (filterCat !== "all" && x.category !== filterCat) return false;
    return true;
  });

  const fmt = (n: number) => formatCurrency(n, currency);

  return (
    <div className="space-y-6">
      {/* Premium hero */}
      <div className="relative overflow-hidden rounded-3xl border bg-gradient-hero p-6 text-primary-foreground shadow-elevated md:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-12 -left-8 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <Badge className="mb-3 border-white/30 bg-white/15 text-primary-foreground hover:bg-white/20">
              <Crown className="mr-1 h-3 w-3" /> Family Suite
            </Badge>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{family.data?.name ?? "My Family"}</h2>
            <p className="mt-1 text-sm opacity-90">Steward every shilling that leaves your household — allowances, school fees, medical support, and emergencies — in one premium command center.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Dialog open={mOpen} onOpenChange={setMOpen}>
              <DialogTrigger asChild><Button variant="secondary"><Plus className="mr-1 h-4 w-4" /> Add member</Button></DialogTrigger>
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
              <DialogTrigger asChild><Button className="bg-white text-primary hover:bg-white/90" disabled={!members.data?.length}><Plus className="mr-1 h-4 w-4" /> Record contribution</Button></DialogTrigger>
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

        {/* KPI strip */}
        <div className="relative mt-6 grid gap-3 md:grid-cols-4">
          <KpiPill label="Members" value={String(members.data?.length ?? 0)} icon={Users} />
          <KpiPill label="Monthly budget" value={fmt(totalAllowance)} icon={PiggyBank} />
          <KpiPill label="Paid this month" value={fmt(totalPaid)} icon={HeartHandshake} />
          <KpiPill label="Household share" value={`${familyShare.toFixed(1)}%`} icon={Home} />
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="planner">Planner</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Allowance coverage — this month</div>
                  <div className="mt-1 text-2xl font-semibold tabular-nums">{coverage.toFixed(0)}%</div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>Paid <span className="font-medium text-foreground">{fmt(totalPaid)}</span></div>
                  <div>Remaining <span className="font-medium text-foreground">{fmt(remaining)}</span></div>
                </div>
              </div>
              <Progress value={coverage} className="mt-3" />
              <p className="mt-2 text-xs text-muted-foreground">
                {coverage >= 100 ? "All member allowances are covered for the month. Well done, faithful steward." : `${fmt(remaining)} still to be sent to fully cover this month's commitments.`}
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-card">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Category breakdown — this month</div>
              <div className="mt-3 space-y-2">
                {byCategory.map((c) => {
                  const pct = totalPaid > 0 ? (c.amount / totalPaid) * 100 : 0;
                  const Icon = c.icon;
                  return (
                    <div key={c.v}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {c.l}</span>
                        <span className="tabular-nums font-medium">{fmt(c.amount)}</span>
                      </div>
                      <Progress value={pct} className="mt-1 h-1.5" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <div className="flex items-center gap-2 text-sm font-semibold"><TrendingUp className="h-4 w-4 text-primary" /> 6-month contribution trend</div>
            <div className="mt-4 flex items-end justify-between gap-2">
              {trend.map((t) => (
                <div key={t.key} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-32 w-full items-end justify-center">
                    <div className="w-full rounded-t-md bg-gradient-primary transition-all" style={{ height: `${(t.total / trendMax) * 100}%`, minHeight: t.total > 0 ? 4 : 2 }} />
                  </div>
                  <div className="text-[10px] text-muted-foreground">{t.label}</div>
                  <div className="text-[10px] tabular-nums text-muted-foreground">{t.total > 0 ? fmt(t.total) : "—"}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-card shadow-card">
            <div className="flex items-center gap-2 border-b p-4 text-sm font-semibold"><CalendarIcon className="h-4 w-4 text-primary" /> Recent activity</div>
            {contributions.data?.length ? (
              <div className="divide-y">
                {contributions.data.slice(0, 5).map((x) => {
                  const memberName = members.data?.find((m) => m.id === x.member_id)?.name ?? "—";
                  const cat = CONTRIBUTION_CATS.find((k) => k.v === x.category);
                  const Icon = cat?.icon ?? HeartHandshake;
                  return (
                    <div key={x.id} className="flex items-center justify-between px-4 py-3 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary"><Icon className="h-4 w-4" /></div>
                        <div>
                          <div className="font-medium">{memberName}</div>
                          <div className="text-xs text-muted-foreground">{x.paid_on} · {cat?.l ?? x.category}{x.note ? ` · ${x.note}` : ""}</div>
                        </div>
                      </div>
                      <span className="tabular-nums font-medium">{fmt(Number(x.amount))}</span>
                    </div>
                  );
                })}
              </div>
            ) : <p className="p-8 text-center text-sm text-muted-foreground">No contributions recorded yet.</p>}
          </div>
        </TabsContent>

        {/* MEMBERS */}
        <TabsContent value="members" className="mt-4">
          <div className="rounded-2xl border bg-card shadow-card">
            <div className="border-b p-4 text-sm font-semibold">Family members</div>
            {members.data?.length ? (
              <div className="divide-y">
                {members.data.map((x) => {
                  const paid = paidPerMember.get(x.id) ?? 0;
                  const pct = x.monthly_allowance > 0 ? Math.min(100, (paid / x.monthly_allowance) * 100) : 0;
                  const status = pct >= 100 ? "Covered" : pct >= 50 ? "Partial" : pct > 0 ? "Started" : "Pending";
                  const statusColor = pct >= 100 ? "text-primary" : pct >= 50 ? "text-amber-600" : "text-muted-foreground";
                  return (
                    <div key={x.id} className="space-y-2 px-4 py-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary font-semibold uppercase">
                            {x.name.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-medium">{x.name} <span className="text-xs text-muted-foreground">· {x.relationship || "—"}</span></div>
                            <div className="text-xs text-muted-foreground">Allowance {fmt(Number(x.monthly_allowance))}/mo{x.notes ? ` · ${x.notes}` : ""}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className={`text-xs font-medium uppercase tracking-wider ${statusColor}`}>{status}</div>
                            <div className="tabular-nums text-xs text-muted-foreground">Paid {fmt(paid)}</div>
                          </div>
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
        </TabsContent>

        {/* LEDGER */}
        <TabsContent value="ledger" className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Filter by member</Label>
              <Select value={filterMember} onValueChange={setFilterMember}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All members</SelectItem>
                  {(members.data ?? []).map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Filter by category</Label>
              <Select value={filterCat} onValueChange={setFilterCat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {CONTRIBUTION_CATS.map((x) => <SelectItem key={x.v} value={x.v}>{x.l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="rounded-2xl border bg-card shadow-card">
            {filteredContribs.length ? (
              <div className="divide-y">
                {filteredContribs.map((x) => {
                  const memberName = members.data?.find((m) => m.id === x.member_id)?.name ?? "—";
                  const acctName = accounts.data?.find((a) => a.id === x.account_id)?.name;
                  const cat = CONTRIBUTION_CATS.find((k) => k.v === x.category);
                  const Icon = cat?.icon ?? HeartHandshake;
                  return (
                    <div key={x.id} className="flex items-center justify-between px-4 py-3 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary"><Icon className="h-4 w-4" /></div>
                        <div>
                          <div className="font-medium">{memberName}</div>
                          <div className="text-xs text-muted-foreground">{x.paid_on} · {cat?.l ?? x.category}{acctName ? ` · ${acctName}` : ""}{x.note ? ` · ${x.note}` : ""}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="tabular-nums font-medium">{fmt(Number(x.amount))}</span>
                        <button onClick={() => removeContribution(x.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="p-8 text-center text-sm text-muted-foreground">No contributions match these filters.</p>}
          </div>
        </TabsContent>

        {/* PLANNER */}
        <TabsContent value="planner" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border bg-card p-5 shadow-card">
              <div className="text-sm font-semibold">Monthly forecast</div>
              <p className="mt-1 text-xs text-muted-foreground">Based on current allowances × active members.</p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Committed allowances</span><span className="tabular-nums font-medium">{fmt(totalAllowance)}</span></div>
                <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Paid so far</span><span className="tabular-nums font-medium">{fmt(totalPaid)}</span></div>
                <div className="flex justify-between border-b py-2"><span className="text-muted-foreground">Still owed this month</span><span className="tabular-nums font-medium text-destructive">{fmt(remaining)}</span></div>
                <div className="flex justify-between py-2 font-semibold"><span>Annualized commitment</span><span className="tabular-nums">{fmt(totalAllowance * 12)}</span></div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-card">
              <div className="text-sm font-semibold">Pending obligations</div>
              <p className="mt-1 text-xs text-muted-foreground">Members not yet fully covered this month.</p>
              <div className="mt-3 space-y-2">
                {(members.data ?? []).filter((x) => (paidPerMember.get(x.id) ?? 0) < Number(x.monthly_allowance)).map((x) => {
                  const paid = paidPerMember.get(x.id) ?? 0;
                  const gap = Number(x.monthly_allowance) - paid;
                  return (
                    <div key={x.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                      <div>
                        <div className="font-medium">{x.name}</div>
                        <div className="text-xs text-muted-foreground">Owed {fmt(gap)} of {fmt(Number(x.monthly_allowance))}</div>
                      </div>
                      <Badge variant="outline">Pending</Badge>
                    </div>
                  );
                })}
                {(members.data ?? []).every((x) => (paidPerMember.get(x.id) ?? 0) >= Number(x.monthly_allowance)) && (
                  <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">All members are fully covered for this month. ✓</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-gradient-hero p-5 text-primary-foreground shadow-elevated">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 shrink-0" />
              <div>
                <div className="text-sm font-semibold">Steward's guidance</div>
                <ul className="mt-2 space-y-1.5 text-sm opacity-95">
                  {familyShare > 40 && <li>• Family support is over 40% of your monthly income — consider reviewing allowances so your own household stays solvent.</li>}
                  {coverage < 50 && new Date().getDate() > 20 && <li>• Late in the month and less than half of allowances are paid — schedule the remaining sends this week.</li>}
                  {byCategory.find((c) => c.v === "school_fees" && c.amount > 0) && <li>• School fees are being paid — remember to keep receipts for term reconciliation.</li>}
                  {(members.data?.length ?? 0) === 0 && <li>• Add at least one member to start tracking allowance coverage.</li>}
                  <li>• Set up recurring reminders on the Calendar so no dependent is forgotten.</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* INSIGHTS */}
        <TabsContent value="insights" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border bg-card p-5 shadow-card">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Year to date</div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">{fmt(ytdTotal)}</div>
              <p className="mt-1 text-xs text-muted-foreground">Total family support this calendar year.</p>
            </div>
            <div className="rounded-2xl border bg-card p-5 shadow-card">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Lifetime given</div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">{fmt(lifetimeTotal)}</div>
              <p className="mt-1 text-xs text-muted-foreground">Since you started tracking with Fanika.</p>
            </div>
            <div className="rounded-2xl border bg-card p-5 shadow-card">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Avg per member</div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">{fmt((members.data?.length ?? 0) > 0 ? totalPaid / (members.data!.length) : 0)}</div>
              <p className="mt-1 text-xs text-muted-foreground">Average paid to each member this month.</p>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <div className="text-sm font-semibold">Contributions by member — this month</div>
            <div className="mt-3 space-y-2">
              {(members.data ?? []).map((x) => {
                const paid = paidPerMember.get(x.id) ?? 0;
                const pct = totalPaid > 0 ? (paid / totalPaid) * 100 : 0;
                return (
                  <div key={x.id}>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{x.name} <span className="opacity-60">· {x.relationship}</span></span>
                      <span className="tabular-nums font-medium">{fmt(paid)} <span className="text-muted-foreground">({pct.toFixed(0)}%)</span></span>
                    </div>
                    <Progress value={pct} className="mt-1 h-1.5" />
                  </div>
                );
              })}
              {(members.data?.length ?? 0) === 0 && <p className="text-center text-xs text-muted-foreground">Add members to see per-member insights.</p>}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiPill({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest opacity-80"><Icon className="h-3 w-3" /> {label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums md:text-xl">{value}</div>
    </div>
  );
}
