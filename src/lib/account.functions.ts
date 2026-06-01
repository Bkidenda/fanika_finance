import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const USER_TABLES = [
  "account_transactions", "debt_payments", "expenses", "income_entries", "incomes",
  "budgets", "recurring_budgets", "subscriptions", "savings_goals", "debts",
  "investments", "accounts", "ai_insights", "month_closures", "financial_events",
  "deductions",
] as const;

export const deactivateAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("profiles").update({ is_active: false }).eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reactivateAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("profiles").update({ is_active: true }).eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const wipeMyData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    for (const t of USER_TABLES) {
      await supabase.from(t).delete().eq("user_id", userId);
    }
    await supabase.from("profiles").update({ net_income: 0 }).eq("id", userId);
    return { ok: true };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ confirm: z.literal("DELETE") }).parse(input))
  .handler(async ({ context }) => {
    const { userId } = context;
    for (const t of USER_TABLES) {
      await supabaseAdmin.from(t).delete().eq("user_id", userId);
    }
    await supabaseAdmin.from("profiles").delete().eq("id", userId);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
