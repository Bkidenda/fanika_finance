export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_transactions: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          date: string
          description: string | null
          id: string
          kind: string
          to_account_id: string | null
          transaction_fee: number
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          kind: string
          to_account_id?: string | null
          transaction_fee?: number
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          kind?: string
          to_account_id?: string | null
          transaction_fee?: number
          user_id?: string
        }
        Relationships: []
      }
      accounts: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          institution: string | null
          linked_debt_id: string | null
          name: string
          type: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          institution?: string | null
          linked_debt_id?: string | null
          name: string
          type: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          institution?: string | null
          linked_debt_id?: string | null
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_insights: {
        Row: {
          created_at: string
          id: string
          kind: string
          period: string
          recommendations: Json
          score: number | null
          summary: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          period: string
          recommendations?: Json
          score?: number | null
          summary: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          period?: string
          recommendations?: Json
          score?: number | null
          summary?: string
          user_id?: string
        }
        Relationships: []
      }
      budget_split_rules: {
        Row: {
          active: boolean
          base_type: string
          category: string
          created_at: string
          id: string
          month: string
          notes: string | null
          percentage: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          base_type?: string
          category: string
          created_at?: string
          id?: string
          month: string
          notes?: string | null
          percentage?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          base_type?: string
          category?: string
          created_at?: string
          id?: string
          month?: string
          notes?: string | null
          percentage?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          archived_at: string | null
          category: string
          created_at: string
          id: string
          is_recurring: boolean
          limit_amount: number
          month: string
          notes: string | null
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          category: string
          created_at?: string
          id?: string
          is_recurring?: boolean
          limit_amount?: number
          month: string
          notes?: string | null
          user_id: string
        }
        Update: {
          archived_at?: string | null
          category?: string
          created_at?: string
          id?: string
          is_recurring?: boolean
          limit_amount?: number
          month?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      child_entries: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          id: string
          member_id: string
          note: string | null
          owner_id: string
          type: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          id?: string
          member_id: string
          note?: string | null
          owner_id: string
          type: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          id?: string
          member_id?: string
          note?: string | null
          owner_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_entries_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      child_goals: {
        Row: {
          created_at: string
          current_amount: number
          id: string
          member_id: string
          name: string
          owner_id: string
          target_amount: number
        }
        Insert: {
          created_at?: string
          current_amount?: number
          id?: string
          member_id: string
          name: string
          owner_id: string
          target_amount: number
        }
        Update: {
          created_at?: string
          current_amount?: number
          id?: string
          member_id?: string
          name?: string
          owner_id?: string
          target_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "child_goals_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      debt_payments: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string
          date: string
          debt_id: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string
          date?: string
          debt_id: string
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string
          date?: string
          debt_id?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      debts: {
        Row: {
          archived_at: string | null
          balance: number
          created_at: string
          creditor: string | null
          deposit_account_id: string | null
          due_date: string | null
          id: string
          interest_rate: number
          kind: string
          linked_account_id: string | null
          monthly_payment: number
          name: string
          notes: string | null
          principal: number
          start_date: string | null
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          balance?: number
          created_at?: string
          creditor?: string | null
          deposit_account_id?: string | null
          due_date?: string | null
          id?: string
          interest_rate?: number
          kind?: string
          linked_account_id?: string | null
          monthly_payment?: number
          name: string
          notes?: string | null
          principal?: number
          start_date?: string | null
          user_id: string
        }
        Update: {
          archived_at?: string | null
          balance?: number
          created_at?: string
          creditor?: string | null
          deposit_account_id?: string | null
          due_date?: string | null
          id?: string
          interest_rate?: number
          kind?: string
          linked_account_id?: string | null
          monthly_payment?: number
          name?: string
          notes?: string | null
          principal?: number
          start_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debts_linked_account_id_fkey"
            columns: ["linked_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      deductions: {
        Row: {
          created_at: string
          frequency: Database["public"]["Enums"]["frequency_type"]
          id: string
          name: string
          rule: Database["public"]["Enums"]["rule_type"]
          type: Database["public"]["Enums"]["deduction_type"]
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          frequency?: Database["public"]["Enums"]["frequency_type"]
          id?: string
          name: string
          rule?: Database["public"]["Enums"]["rule_type"]
          type: Database["public"]["Enums"]["deduction_type"]
          user_id: string
          value?: number
        }
        Update: {
          created_at?: string
          frequency?: Database["public"]["Enums"]["frequency_type"]
          id?: string
          name?: string
          rule?: Database["public"]["Enums"]["rule_type"]
          type?: Database["public"]["Enums"]["deduction_type"]
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      devotionals: {
        Row: {
          created_at: string
          egw_quote: string
          egw_source: string | null
          id: string
          reflection: string
          tag: string
          verse: string
          verse_reference: string
        }
        Insert: {
          created_at?: string
          egw_quote: string
          egw_source?: string | null
          id?: string
          reflection: string
          tag?: string
          verse: string
          verse_reference: string
        }
        Update: {
          created_at?: string
          egw_quote?: string
          egw_source?: string | null
          id?: string
          reflection?: string
          tag?: string
          verse?: string
          verse_reference?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          account_id: string | null
          amount: number
          category: string
          created_at: string
          date: string
          description: string | null
          id: string
          is_emergency: boolean
          occurred_at: string
          payment_method: string | null
          skip_autosave: boolean
          source_debt_payment_id: string | null
          tags: string[] | null
          transaction_fee: number
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          is_emergency?: boolean
          occurred_at?: string
          payment_method?: string | null
          skip_autosave?: boolean
          source_debt_payment_id?: string | null
          tags?: string[] | null
          transaction_fee?: number
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          is_emergency?: boolean
          occurred_at?: string
          payment_method?: string | null
          skip_autosave?: boolean
          source_debt_payment_id?: string | null
          tags?: string[] | null
          transaction_fee?: number
          user_id?: string
        }
        Relationships: []
      }
      families: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      family_chores: {
        Row: {
          completed_at: string | null
          created_at: string
          due_date: string | null
          id: string
          member_id: string | null
          reward: number
          status: string
          title: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          member_id?: string | null
          reward?: number
          status?: string
          title: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          member_id?: string | null
          reward?: number
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_chores_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      family_contributions: {
        Row: {
          account_id: string | null
          amount: number
          category: string
          created_at: string
          family_id: string
          id: string
          linked_expense_id: string | null
          member_id: string | null
          note: string | null
          paid_on: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category?: string
          created_at?: string
          family_id: string
          id?: string
          linked_expense_id?: string | null
          member_id?: string | null
          note?: string | null
          paid_on?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category?: string
          created_at?: string
          family_id?: string
          id?: string
          linked_expense_id?: string | null
          member_id?: string | null
          note?: string | null
          paid_on?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_contributions_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_contributions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      family_invites: {
        Row: {
          created_at: string
          email: string
          family_id: string
          id: string
          invited_by: string
          role: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          family_id: string
          id?: string
          invited_by: string
          role?: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          family_id?: string
          id?: string
          invited_by?: string
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_invites_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          avatar_colour: string | null
          created_at: string
          email: string | null
          family_id: string
          id: string
          monthly_allowance: number
          name: string
          notes: string | null
          pocket_money: number
          relationship: string | null
          role: string | null
          user_id: string
          visibility: string
        }
        Insert: {
          avatar_colour?: string | null
          created_at?: string
          email?: string | null
          family_id: string
          id?: string
          monthly_allowance?: number
          name: string
          notes?: string | null
          pocket_money?: number
          relationship?: string | null
          role?: string | null
          user_id: string
          visibility?: string
        }
        Update: {
          avatar_colour?: string | null
          created_at?: string
          email?: string | null
          family_id?: string
          id?: string
          monthly_allowance?: number
          name?: string
          notes?: string | null
          pocket_money?: number
          relationship?: string | null
          role?: string | null
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_events: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          kind: string
          notes: string | null
          title: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          date: string
          id?: string
          kind?: string
          notes?: string | null
          title: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          kind?: string
          notes?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      income_entries: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string
          date: string
          id: string
          notes: string | null
          source: string
          tithe_on: boolean | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          source: string
          tithe_on?: boolean | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          source?: string
          tithe_on?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      incomes: {
        Row: {
          amount: number
          created_at: string
          frequency: Database["public"]["Enums"]["frequency_type"]
          id: string
          source: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          frequency?: Database["public"]["Enums"]["frequency_type"]
          id?: string
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          frequency?: Database["public"]["Enums"]["frequency_type"]
          id?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          amount_invested: number
          created_at: string
          current_value: number
          id: string
          institution: string | null
          name: string
          notes: string | null
          start_date: string | null
          type: Database["public"]["Enums"]["investment_type"]
          user_id: string
        }
        Insert: {
          amount_invested?: number
          created_at?: string
          current_value?: number
          id?: string
          institution?: string | null
          name: string
          notes?: string | null
          start_date?: string | null
          type?: Database["public"]["Enums"]["investment_type"]
          user_id: string
        }
        Update: {
          amount_invested?: number
          created_at?: string
          current_value?: number
          id?: string
          institution?: string | null
          name?: string
          notes?: string | null
          start_date?: string | null
          type?: Database["public"]["Enums"]["investment_type"]
          user_id?: string
        }
        Relationships: []
      }
      month_closures: {
        Row: {
          closed_at: string
          id: string
          period: string
          snapshot: Json
          user_id: string
        }
        Insert: {
          closed_at?: string
          id?: string
          period: string
          snapshot?: Json
          user_id: string
        }
        Update: {
          closed_at?: string
          id?: string
          period?: string
          snapshot?: Json
          user_id?: string
        }
        Relationships: []
      }
      offerings: {
        Row: {
          account_id: string | null
          amount: number
          category: string
          created_at: string
          id: string
          linked_expense_id: string | null
          note: string | null
          paid_on: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category: string
          created_at?: string
          id?: string
          linked_expense_id?: string | null
          note?: string | null
          paid_on?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category?: string
          created_at?: string
          id?: string
          linked_expense_id?: string | null
          note?: string | null
          paid_on?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          currency: string
          display_currency: string
          email: string | null
          family_plan_enabled: boolean
          full_name: string | null
          id: string
          is_active: boolean
          mpesa_autosave_enabled: boolean
          mpesa_autosave_rate: number
          net_income: number
          tithe_enabled: boolean
          tithe_rate: number
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          currency?: string
          display_currency?: string
          email?: string | null
          family_plan_enabled?: boolean
          full_name?: string | null
          id: string
          is_active?: boolean
          mpesa_autosave_enabled?: boolean
          mpesa_autosave_rate?: number
          net_income?: number
          tithe_enabled?: boolean
          tithe_rate?: number
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          currency?: string
          display_currency?: string
          email?: string | null
          family_plan_enabled?: boolean
          full_name?: string | null
          id?: string
          is_active?: boolean
          mpesa_autosave_enabled?: boolean
          mpesa_autosave_rate?: number
          net_income?: number
          tithe_enabled?: boolean
          tithe_rate?: number
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      recurring_budgets: {
        Row: {
          active: boolean
          amount: number
          category: string
          created_at: string
          end_month: string | null
          id: string
          notes: string | null
          start_month: string
          user_id: string
        }
        Insert: {
          active?: boolean
          amount?: number
          category: string
          created_at?: string
          end_month?: string | null
          id?: string
          notes?: string | null
          start_month: string
          user_id: string
        }
        Update: {
          active?: boolean
          amount?: number
          category?: string
          created_at?: string
          end_month?: string | null
          id?: string
          notes?: string | null
          start_month?: string
          user_id?: string
        }
        Relationships: []
      }
      savings_goals: {
        Row: {
          created_at: string
          current_amount: number
          deadline: string | null
          id: string
          name: string
          target_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string
          current_amount?: number
          deadline?: string | null
          id?: string
          name: string
          target_amount: number
          user_id: string
        }
        Update: {
          created_at?: string
          current_amount?: number
          deadline?: string | null
          id?: string
          name?: string
          target_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          account_id: string | null
          active: boolean
          amount: number
          category: string
          created_at: string
          cycle: string
          id: string
          last_charged: string | null
          name: string
          next_charge: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          active?: boolean
          amount?: number
          category?: string
          created_at?: string
          cycle?: string
          id?: string
          last_charged?: string | null
          name: string
          next_charge?: string | null
          notes?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          active?: boolean
          amount?: number
          category?: string
          created_at?: string
          cycle?: string
          id?: string
          last_charged?: string | null
          name?: string
          next_charge?: string | null
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tithe_payments: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string
          id: string
          note: string | null
          paid_on: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string
          id?: string
          note?: string | null
          paid_on?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          paid_on?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_account_delta: {
        Args: { p_account: string; p_delta: number }
        Returns: undefined
      }
      process_due_subscriptions: { Args: never; Returns: number }
      seed_budget_split_rules_for_month: {
        Args: { p_target_month: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      deduction_type: "statutory" | "custom"
      frequency_type: "monthly" | "annual" | "one_time"
      investment_type:
        | "savings"
        | "sacco"
        | "stocks"
        | "crypto"
        | "bonds"
        | "fixed_deposit"
        | "business"
        | "other"
      rule_type: "fixed" | "percentage"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      deduction_type: ["statutory", "custom"],
      frequency_type: ["monthly", "annual", "one_time"],
      investment_type: [
        "savings",
        "sacco",
        "stocks",
        "crypto",
        "bonds",
        "fixed_deposit",
        "business",
        "other",
      ],
      rule_type: ["fixed", "percentage"],
    },
  },
} as const
