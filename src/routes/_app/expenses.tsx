import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAllExpenses, useProfile } from "@/lib/queries";
import { DEFAULT_BUDGET_CATEGORIES } from "@/lib/finance";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/expenses")({ component: Expenses });

function Expenses() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const expenses = useAllExpenses();
  const profile = useProfile();
  const currency = profile.data?.currency ?? "KES";

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(DEFAULT_BUDGET_CATEGORIES[0]);
  const [desc, setDesc] = useState("");
  const [method, setMethod] = useState("Cash");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("expenses").insert({
      user_id: user!.id,
      date,
      amount: Number(amount),
      category,
      description: desc || null,
      payment_method: method,
    });
    if (error) return toast.error(error.message);
    toast.success("Expense added");
    setOpen(false);
    setAmount("");
    setDesc("");
    qc.invalidateQueries({ queryKey: ["expenses"] });
    qc.invalidateQueries({ queryKey: ["expenses-all"] });
  }

  async function remove(id: string) {
    await supabase.from("expenses").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["expenses"] });
    qc.invalidateQueries({ queryKey: ["expenses-all"] });
  }

  const filtered = (expenses.data ?? []).filter((e) => {
    const q = search.toLowerCase();
    return (
      !q ||
      e.category.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      e.payment_method?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Expenses</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1 h-4 w-4" /> Add expense</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log expense</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Amount ({currency})</Label>
                  <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEFAULT_BUDGET_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional" />
              </div>
              <div className="space-y-1.5">
                <Label>Payment method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Cash", "Card", "Mobile money", "Bank transfer", "Other"].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Add expense</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-2xl border bg-card shadow-card">
        <div className="flex items-center gap-2 border-b p-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search by category, description, or method"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        {filtered.length ? (
          <div className="divide-y">
            {filtered.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-secondary/50">
                <div>
                  <div className="font-medium">{e.description || e.category}</div>
                  <div className="text-xs text-muted-foreground">
                    {e.date} · {e.category} · {e.payment_method}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums font-medium">{formatCurrency(Number(e.amount), currency)}</span>
                  <button onClick={() => remove(e.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">No expenses yet.</p>
        )}
      </div>
    </div>
  );
}
