import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { monthKey } from "@/lib/format";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  currency: string;
  gross_income: number;
};

export type Deduction = {
  id: string;
  user_id: string;
  type: "statutory" | "custom";
  name: string;
  rule: "fixed" | "percentage";
  value: number;
  frequency: "monthly" | "annual" | "one_time";
};

export type Budget = {
  id: string;
  category: string;
  month: string;
  limit_amount: number;
};

export type Expense = {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string | null;
  payment_method: string | null;
  tags: string[] | null;
};

export type Investment = {
  id: string;
  name: string;
  type: string;
  institution: string | null;
  amount_invested: number;
  current_value: number;
  start_date: string | null;
  notes: string | null;
};

export type Goal = {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
};

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      if (error) throw error;
      return data as Profile;
    },
  });
}

export function useDeductions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["deductions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deductions")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Deduction[];
    },
  });
}

export function useBudgets(month = monthKey()) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["budgets", user?.id, month],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("month", month)
        .order("category");
      if (error) throw error;
      return (data ?? []) as Budget[];
    },
  });
}

export function useExpenses(month?: string) {
  const { user } = useAuth();
  const m = month ?? monthKey();
  // first day inclusive, next month exclusive
  const start = m;
  const d = new Date(m);
  d.setMonth(d.getMonth() + 1);
  const end = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  return useQuery({
    queryKey: ["expenses", user?.id, start],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .gte("date", start)
        .lt("date", end)
        .order("date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Expense[];
    },
  });
}

export function useAllExpenses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["expenses-all", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("date", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Expense[];
    },
  });
}

export function useInvestments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["investments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Investment[];
    },
  });
}

export function useGoals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["goals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("savings_goals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Goal[];
    },
  });
}

export function useDevotional() {
  return useQuery({
    queryKey: ["devotional-today"],
    queryFn: async () => {
      const { data, error } = await supabase.from("devotionals").select("*");
      if (error) throw error;
      if (!data || data.length === 0) return null;
      const idx = new Date().getDate() % data.length;
      return data[idx];
    },
  });
}
