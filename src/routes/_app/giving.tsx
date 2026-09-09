import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, useAccounts, useTithePayments, useIncomeEntries } from "@/lib/queries";
import { formatCurrency, isoLocalDate, monthLabel, monthKey } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, HandHeart, Church } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/giving")({
  head: () => ({
    meta: [
      { title: "Charity & Giving — Fanika" },
      { name: "description", content: "Record tithes, offerings and other giving, and see what you have set aside this month." },
      { property: "og:title", content: "Charity & Giving — Fanika" },
      { property: "og:description", content: "Track giving alongside your budget in Fanika." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GivingPage,
});

const OFFERING_CATEGORIES = [
  "Tithe", "Offering", "Church Development", "Church Lunch",
  "Welfare", "Ministry Subscriptions", "Retreat", "Other",
] as const;

type Offering = {
  id: string; category: string; amount: number; paid_on: string;
  account_id: string | null; note: string | null;
};

function useOfferings(month?: string) {
  const { user } = useAuth();
  const m = month ?? monthKey();
  const d = new Date(m); d.setMonth(d.getMonth() + 1);
  const end = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  return useQuery({
    queryKey: ["offerings", user?.id, m], enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offerings" as never).select("*")
        .gte("paid_on", m).lt("paid_on", end)
        .order("paid_on", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Offering[];
    },
  });
}

function GivingPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const profile = useProfile();
  const accounts = useAccounts();
  const tithePayments = useTithePayments();
  const offerings = useOfferings();
  const income = useIncomeEntries();
  const currency = profile.data?.currency ?? "KES";
  const titheEnabled = !!profile.data?.tithe_enabled;
  const titheRate = profile.data?.tithe_rate ?? 0.10;

  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    category: "Tithe" as string,
    amount: "",
    date: isoLocalDate(),
    account_id: "",
    note: "",
  });

  const titheBudget = (income.data ?? [])
    .filter((e) => e.tithe_on ?? titheEnabled)
    .reduce((s, e) => s + Number(e.amount) * titheRate, 0);
  const tithePaid = (tithePayments.data ?? []).reduce((s, p) => s + Number(p.amount), 0)
    + (offerings.data ?? []).filter((o) => o.category === "Tithe").reduce((s, o) => s + Number(o.amount), 0);
  const titheOutstanding = Math.max(0, titheBudget - tithePaid);
  const offeringsTotal = (offerings.data ?? [])
    .filter((o) => o.category !== "Tithe")
    .reduce((s, o) => s + Number(o.amount), 0);
  const totalGiven = tithePaid + offeringsTotal;

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["offerings"] });
    qc.invalidateQueries({ queryKey: ["tithe-payments"] });
    qc.invalidateQueries({ queryKey: ["expenses"] });
    qc.invalidateQueries({ queryKey: ["expenses-all"] });
    qc.invalidateQueries({ queryKey: ["accounts"] });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(f.amount);
    if (!n || n <= 0) return toast.error("Enter an amount");
    if (f.category !== "Tithe" && !f.account_id) return toast.error("Choose an account — non-tithe giving debits a balance");
    const { error } = await supabase.from("offerings" as never).insert({
      user_id: user!.id,
      category: f.category,
      amount: n,
      paid_on: f.date,
      account_id: f.account_id || null,
      note: f.note || null,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    if (error) return toast.error(error.message);
    toast.success(
      f.category === "Tithe"
        ? "Giving recorded — account balances unchanged (tithe is pre-disposable)"
        : `${f.category} recorded — account debited and logged in expenses`
    );
    setOpen(false);
    setF({ category: "Tithe", amount: "", date: isoLocalDate(), account_id: "", note: "" });
    invalidate();
  }

  async function remove(id: string) {
    await supabase.from("offerings" as never).delete().eq("id", id);
    invalidate();
  }

  // Breakdown by category
  const byCat = new Map<string, number>();
  (offerings.data ?? []).forEach((o) => byCat.set(o.category, (byCat.get(o.category) ?? 0) + Number(o.amount)));
  // Legacy tithe_payments rolled into "Tithe"
  if (tithePayments.data?.length) {
    const t = tithePayments.data.reduce((s, p) => s + Number(p.amount), 0);
    byCat.set("Tithe", (byCat.get("Tithe") ?? 0) + t);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{monthLabel()}</p>
          <h2 className="text-2xl font-semibold tracking-tight">Charity & Giving</h2>
          <p className="text-xs text-muted-foreground">Tithes, offerings, welfare and ministry contributions. Tithes don't affect balance (already deducted) — everything else debits an account and posts as an expense.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> Record giving</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record giving</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-3">
              <div className="space-y-1.5"><Label>Type</Label>
                <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{OFFERING_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Amount ({currency})</Label><Input type="number" step="0.01" required value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label>{f.category === "Tithe" ? "Paid from (informational)" : "Pay from account"}</Label>
                <Select value={f.account_id} onValueChange={(v) => setF({ ...f, account_id: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{(accounts.data ?? []).map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Note</Label><Input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Optional" /></div>
              <div className="rounded-lg bg-secondary/50 p-2.5 text-[11px] text-muted-foreground">
                {f.category === "Tithe"
                  ? "Tithe is recorded for tracking only — your account balance will NOT be reduced."
                  : "This will debit the chosen account and post a mirrored entry in Expenses (Charity & Giving)."}
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-gradient-hero p-4 text-primary-foreground shadow-elevated">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest opacity-80"><Church className="h-3.5 w-3.5" /> Total to church (month)</div>
          <div className="mt-2 text-xl font-semibold tabular-nums md:text-2xl">{formatCurrency(totalGiven, currency)}</div>
        </div>
        {titheEnabled && (
          <div className="rounded-2xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground"><HandHeart className="h-3.5 w-3.5" /> Giving due ({Math.round(titheRate * 100)}%)</div>
            <div className="mt-2 text-xl font-semibold tabular-nums md:text-2xl">{formatCurrency(titheBudget, currency)}</div>
          </div>
        )}
        <div className="rounded-2xl border bg-card p-4 shadow-card">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Giving paid</div>
          <div className="mt-2 text-xl font-semibold tabular-nums md:text-2xl">{formatCurrency(tithePaid, currency)}</div>
          {titheEnabled && (
            <div className={`text-[11px] ${titheOutstanding > 0 ? "text-warning" : "text-success"}`}>
              {titheOutstanding > 0 ? `Outstanding ${formatCurrency(titheOutstanding, currency)}` : "Fully paid"}
            </div>
          )}
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-card">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Other offerings</div>
          <div className="mt-2 text-xl font-semibold tabular-nums md:text-2xl">{formatCurrency(offeringsTotal, currency)}</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <h3 className="font-semibold">Breakdown by category</h3>
          {byCat.size ? (
            <div className="mt-3 space-y-2">
              {[...byCat.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <span>{k}</span>
                  <span className="tabular-nums font-medium">{formatCurrency(v, currency)}</span>
                </div>
              ))}
            </div>
          ) : <p className="mt-3 text-xs text-muted-foreground">No giving recorded yet this month.</p>}
        </div>
        <div className="rounded-2xl border bg-card shadow-card">
          <div className="border-b p-4 text-sm font-semibold">Recent activity</div>
          {(offerings.data?.length ?? 0) || (tithePayments.data?.length ?? 0) ? (
            <div className="divide-y">
              {offerings.data?.map((o) => (
                <div key={o.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <div className="font-medium">{o.category}</div>
                    <div className="text-xs text-muted-foreground">{o.paid_on}{o.note ? ` · ${o.note}` : ""}{o.category === "Tithe" ? " · tracking only" : " · debited account"}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="tabular-nums font-medium">{formatCurrency(Number(o.amount), currency)}</span>
                    <button onClick={() => remove(o.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
              {tithePayments.data?.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <div className="font-medium">Tithe</div>
                    <div className="text-xs text-muted-foreground">{p.paid_on}{p.note ? ` · ${p.note}` : ""} · legacy entry</div>
                  </div>
                  <span className="tabular-nums font-medium">{formatCurrency(Number(p.amount), currency)}</span>
                </div>
              ))}
            </div>
          ) : <p className="p-8 text-center text-sm text-muted-foreground">Nothing recorded yet.</p>}
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Looking for the old <Link to="/tithe" className="text-primary underline">Tithe</Link> page? It now lives here as part of Charity & Giving.
      </div>
    </div>
  );
}
