import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({ period: z.string().regex(/^\d{4}-\d{2}$/) });

function nextMonthFromPeriod(period: string): { firstDay: string; key: string } {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(Date.UTC(y, m, 1));
  const ny = d.getUTCFullYear();
  const nm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return { firstDay: `${ny}-${nm}-01`, key: `${ny}-${nm}` };
}

export const closeMonth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const start = `${data.period}-01`;
    const next = nextMonthFromPeriod(data.period);
    const end = next.firstDay;

    const [exp, inc, dp, bud, sub, deb, acc, inv, rec] = await Promise.all([
      supabase.from("expenses").select("amount,category,is_emergency").gte("date", start).lt("date", end),
      supabase.from("income_entries").select("amount,source").gte("date", start).lt("date", end),
      supabase.from("debt_payments").select("amount").gte("date", start).lt("date", end),
      supabase.from("budgets").select("category,limit_amount").eq("month", start),
      supabase.from("subscriptions").select("amount,cycle,active"),
      supabase.from("debts").select("balance,kind"),
      supabase.from("accounts").select("balance"),
      supabase.from("investments").select("current_value"),
      supabase.from("recurring_budgets").select("category,amount,start_month,end_month,active"),
    ]);

    const totalIncome = (inc.data ?? []).reduce((s, x) => s + Number(x.amount), 0);
    const totalExpenses = (exp.data ?? []).reduce((s, x) => s + Number(x.amount), 0);
    const emergencyExpenses = (exp.data ?? []).filter((x) => x.is_emergency).reduce((s, x) => s + Number(x.amount), 0);
    const debtPaid = (dp.data ?? []).reduce((s, x) => s + Number(x.amount), 0);
    const budgetTotal = (bud.data ?? []).reduce((s, x) => s + Number(x.limit_amount), 0);
    const subsMonthly = (sub.data ?? []).filter((s) => s.active).reduce((s, x) => {
      const a = Number(x.amount);
      return s + (x.cycle === "monthly" ? a : x.cycle === "annual" ? a / 12 : x.cycle === "quarterly" ? a / 3 : a * 4);
    }, 0);
    const debtsTotal = (deb.data ?? []).reduce((s, x) => s + Number(x.balance), 0);
    const assets = (acc.data ?? []).reduce((s, x) => s + Number(x.balance), 0) + (inv.data ?? []).reduce((s, x) => s + Number(x.current_value), 0);
    const byCat = new Map<string, number>();
    (exp.data ?? []).forEach((e) => byCat.set(e.category, (byCat.get(e.category) ?? 0) + Number(e.amount)));
    const topCategories = [...byCat.entries()].map(([c, a]) => ({ category: c, amount: a })).sort((a, b) => b.amount - a.amount).slice(0, 10);
    const netCashflow = totalIncome - totalExpenses;

    const snapshot = {
      totalIncome, totalExpenses, emergencyExpenses, debtPaid, budgetTotal,
      subsMonthly, debtsTotal, assets, netWorth: assets - debtsTotal,
      netCashflow, savingsRate: totalIncome > 0 ? netCashflow / totalIncome : 0,
      budgetVariance: totalExpenses - budgetTotal, topCategories,
      nextMonth: next.key,
    };

    const { data: row, error } = await supabase
      .from("month_closures")
      .upsert({ user_id: userId, period: data.period, closed_at: new Date().toISOString(), snapshot }, { onConflict: "user_id,period" })
      .select().single();
    if (error) throw new Error(error.message);

    // Seed next month's budgets from RECURRING budget lines only (e.g. rent).
    // Fresh income & one-off budgets are entered manually each month.
    const { data: existingNext } = await supabase
      .from("budgets").select("id").eq("month", next.firstDay).limit(1);
    if (!existingNext || existingNext.length === 0) {
      const rows = (rec.data ?? [])
        .filter((r) => r.active)
        .filter((r) => r.start_month <= next.firstDay)
        .filter((r) => !r.end_month || r.end_month >= next.firstDay)
        .map((r) => ({
          user_id: userId,
          category: r.category,
          month: next.firstDay,
          limit_amount: Number(r.amount),
        }));
      if (rows.length > 0) {
        await supabase.from("budgets").insert(rows);
      }
    }

    return { ...row, nextMonth: next.key };
  });

export const reopenMonth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("month_closures").delete().eq("user_id", userId).eq("period", data.period);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
