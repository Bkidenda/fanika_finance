import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/lib/queries";
import { formatCurrency, isoLocalDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ChevronLeft, ChevronRight, Trash2, CalendarDays } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/calendar")({ head: () => ({ meta: [{ title: "Calendar — Fanika" }] }), component: CalendarPage });

type FinEvent = {
  id: string;
  date: string;
  title: string;
  amount: number;
  kind: "reminder" | "bill" | "income" | "giving" | "debt" | "goal";
  notes: string | null;
};

const KIND_COLORS: Record<FinEvent["kind"], string> = {
  reminder: "bg-slate-100 text-slate-700 border-slate-200",
  bill: "bg-rose-50 text-rose-700 border-rose-200",
  income: "bg-emerald-50 text-emerald-700 border-emerald-200",
  giving: "bg-violet-50 text-violet-700 border-violet-200",
  debt: "bg-amber-50 text-amber-700 border-amber-200",
  goal: "bg-sky-50 text-sky-700 border-sky-200",
};

function useFinancialEvents(year: number, month: number) {
  const { user } = useAuth();
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endDate = new Date(year, month + 1, 1);
  const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-01`;
  return useQuery({
    queryKey: ["financial-events", user?.id, start],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("financial_events").select("*").gte("date", start).lt("date", end).order("date");
      if (error) throw error;
      return (data ?? []) as FinEvent[];
    },
  });
}

function CalendarPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const profile = useProfile();
  const currency = profile.data?.currency ?? "KES";

  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const events = useFinancialEvents(cursor.getFullYear(), cursor.getMonth());

  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(isoLocalDate(today));
  const [form, setForm] = useState<{ title: string; amount: string; kind: FinEvent["kind"]; notes: string }>({
    title: "", amount: "", kind: "reminder", notes: "",
  });

  const monthLabel = cursor.toLocaleString("en-US", { month: "long", year: "numeric" });

  const grid = useMemo(() => {
    const y = cursor.getFullYear();
    const mo = cursor.getMonth();
    const first = new Date(y, mo, 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(y, mo + 1, 0).getDate();
    const cells: { date: string | null; day: number | null }[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ date: null, day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      // Build YYYY-MM-DD directly — DO NOT use toISOString which shifts by TZ
      cells.push({ date: `${y}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`, day: d });
    }
    while (cells.length % 7 !== 0) cells.push({ date: null, day: null });
    return cells;
  }, [cursor]);

  const eventsByDate = useMemo(() => {
    const m = new Map<string, FinEvent[]>();
    (events.data ?? []).forEach((e) => {
      const arr = m.get(e.date) ?? [];
      arr.push(e);
      m.set(e.date, arr);
    });
    return m;
  }, [events.data]);

  function openDialog(date: string) {
    setSelectedDate(date);
    setForm({ title: "", amount: "", kind: "reminder", notes: "" });
    setOpen(true);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    const { error } = await supabase.from("financial_events").insert({
      user_id: user!.id,
      date: selectedDate,
      title: form.title.trim(),
      amount: Number(form.amount) || 0,
      kind: form.kind,
      notes: form.notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Event added");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["financial-events"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("financial_events").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["financial-events"] });
  }

  const todayIso = isoLocalDate(today);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> Financial calendar</p>
          <h2 className="text-2xl font-semibold tracking-tight">{monthLabel}</h2>
          <p className="text-sm text-muted-foreground">Mark dates with financial implications — bills, expected income, deadlines and giving.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}>Today</Button>
          <Button size="icon" variant="outline" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
          <Button onClick={() => openDialog(todayIso)}><Plus className="mr-1 h-4 w-4" /> Add event</Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4 shadow-card">
        <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {grid.map((c, i) => {
            const list = c.date ? eventsByDate.get(c.date) ?? [] : [];
            const isToday = c.date === todayIso;
            return (
              <div
                key={i}
                onClick={() => c.date && openDialog(c.date)}
                className={`min-h-[96px] rounded-xl border p-2 text-left transition ${c.date ? "cursor-pointer bg-background hover:border-primary/40 hover:shadow-card" : "border-transparent"} ${isToday ? "border-primary ring-1 ring-primary/30" : ""}`}
              >
                {c.day && (
                  <>
                    <div className={`text-xs font-medium tabular-nums ${isToday ? "text-primary" : "text-muted-foreground"}`}>{c.day}</div>
                    <div className="mt-1 space-y-1">
                      {list.slice(0, 3).map((e) => (
                        <div key={e.id} className={`truncate rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${KIND_COLORS[e.kind]}`}>
                          {e.title}{e.amount ? ` · ${formatCurrency(e.amount, currency)}` : ""}
                        </div>
                      ))}
                      {list.length > 3 && <div className="text-[10px] text-muted-foreground">+{list.length - 3} more</div>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* List view for the month */}
      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <h3 className="font-semibold">All events this month</h3>
        {(events.data ?? []).length ? (
          <div className="mt-3 divide-y">
            {(events.data ?? []).map((e) => (
              <div key={e.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className={`rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${KIND_COLORS[e.kind]}`}>{e.kind}</span>
                  <div>
                    <div className="text-sm font-medium">{e.title}</div>
                    <div className="text-xs text-muted-foreground">{new Date(e.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}{e.notes ? ` · ${e.notes}` : ""}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {!!e.amount && <span className="text-sm font-semibold tabular-nums">{formatCurrency(e.amount, currency)}</span>}
                  <button onClick={() => remove(e.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 py-6 text-center text-sm text-muted-foreground">No events yet for this month. Click any day to add one.</p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add event — {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</DialogTitle></DialogHeader>
          <form onSubmit={add} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Rent due, Salary expected" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v as FinEvent["kind"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="bill">Bill</SelectItem>
                    <SelectItem value="income">Expected income</SelectItem>
                    <SelectItem value="giving">Giving / Tithe</SelectItem>
                    <SelectItem value="debt">Debt payment</SelectItem>
                    <SelectItem value="goal">Goal milestone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Amount ({currency})</Label>
                <Input type="number" min="0" step="100" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
            <Button type="submit" className="w-full">Add event</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
