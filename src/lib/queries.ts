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
  tithe_base: "gross" | "net";
  is_resident: boolean;
  nssf_mode: "simple" | "tiered";
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

export type Budget = { id: string; category: string; month: string; limit_amount: number };

export type Expense = {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string | null;
  payment_method: string | null;
  tags: string[] | null;
  is_emergency: boolean;
  account_id: string | null;
};

export type Income = {
  id: string;
  source: string;
  amount: number;
  frequency: "monthly" | "annual" | "one_time";
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

export type Account = {
  id: string;
  name: string;
  type: "bank" | "mpesa" | "cash" | "sacco" | "investment" | "other";
  institution: string | null;
  balance: number;
  currency: string;
};

export type Subscription = {
  id: string;
  name: string;
  category: string;
  amount: number;
  cycle: "weekly" | "monthly" | "quarterly" | "annual";
  next_charge: string | null;
  active: boolean;
  notes: string | null;
};

export type Debt = {
  id: string;
  name: string;
  creditor: string | null;
  principal: number;
  balance: number;
  interest_rate: number;
  monthly_payment: number;
  start_date: string | null;
  due_date: string | null;
  notes: string | null;
};

export type AIInsight = {
  id: string;
  kind: string;
  period: string;
  score: number | null;
  summary: string;
  recommendations: Array<{ kind: string; text: string }>;
  created_at: string;
};

// ---------- Existing ----------

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
      const { data, error } = await supabase.from("deductions").select("*").order("created_at");
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
      const { data, error } = await supabase.from("budgets").select("*").eq("month", month).order("category");
      if (error) throw error;
      return (data ?? []) as Budget[];
    },
  });
}

export function useExpenses(month?: string) {
  const { user } = useAuth();
  const m = month ?? monthKey();
  const d = new Date(m);
  d.setMonth(d.getMonth() + 1);
  const end = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  return useQuery({
    queryKey: ["expenses", user?.id, m],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses").select("*").gte("date", m).lt("date", end).order("date", { ascending: false });
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
      const { data, error } = await supabase.from("expenses").select("*").order("date", { ascending: false }).limit(1000);
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
      const { data, error } = await supabase.from("investments").select("*").order("created_at", { ascending: false });
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
      const { data, error } = await supabase.from("savings_goals").select("*").order("created_at", { ascending: false });
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
      return data[new Date().getDate() % data.length];
    },
  });
}

// ---------- New entities ----------

export function useIncomes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["incomes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("incomes").select("*").order("created_at");
      if (error) throw error;
      return (data ?? []) as Income[];
    },
  });
}

export function useAccounts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["accounts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("*").order("created_at");
      if (error) throw error;
      return (data ?? []) as Account[];
    },
  });
}

export function useSubscriptions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["subscriptions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("subscriptions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Subscription[];
    },
  });
}

export function useDebts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["debts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("debts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Debt[];
    },
  });
}

export function useAIInsights() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ai-insights", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_insights").select("*").order("created_at", { ascending: false }).limit(10);
      if (error) throw error;
      return (data ?? []) as AIInsight[];
    },
  });
}
