import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({ period: z.string().regex(/^\d{4}-\d{2}$/) });

export const closeMonth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const start = `${data.period}-01`;
    const d = new Date(start);
    d.setMonth(d.getMonth() + 1);
    const end = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;

    const [exp, inc, dp, bud, sub, deb, acc, inv] = await Promise.all([
      supabase.from("expenses").select("amount,category,is_emergency").gte("date", start).lt("date", end),
      supabase.from("income_entries").select("amount,source").gte("date", start).lt("date", end),
      supabase.from("debt_payments").select("amount").gte("date", start).lt("date", end),
      supabase.from("budgets").select("category,limit_amount").eq("month", start),
      supabase.from("subscriptions").select("amount,cycle,active"),
      supabase.from("debts").select("balance,kind"),
      supabase.from("accounts").select("balance"),
      supabase.from("investments").select("current_value"),
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
    };

    const { data: row, error } = await supabase
      .from("month_closures")
      .upsert({ user_id: userId, period: data.period, closed_at: new Date().toISOString(), snapshot }, { onConflict: "user_id,period" })
      .select().single();
    if (error) throw new Error(error.message);
    return row;
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
