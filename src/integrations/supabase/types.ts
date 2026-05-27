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
      budgets: {
        Row: {
          category: string
          created_at: string
          id: string
          limit_amount: number
          month: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          limit_amount?: number
          month: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          limit_amount?: number
          month?: string
          user_id?: string
        }
        Relationships: []
      }
      debt_payments: {
        Row: {
          amount: number
          created_at: string
          date: string
          debt_id: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          debt_id: string
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
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
          balance: number
          created_at: string
          creditor: string | null
          due_date: string | null
          id: string
          interest_rate: number
          monthly_payment: number
          name: string
          notes: string | null
          principal: number
          start_date: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          creditor?: string | null
          due_date?: string | null
          id?: string
          interest_rate?: number
          monthly_payment?: number
          name: string
          notes?: string | null
          principal?: number
          start_date?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          creditor?: string | null
          due_date?: string | null
          id?: string
          interest_rate?: number
          monthly_payment?: number
          name?: string
          notes?: string | null
          principal?: number
          start_date?: string | null
          user_id?: string
        }
        Relationships: []
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
          payment_method: string | null
          tags: string[] | null
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
          payment_method?: string | null
          tags?: string[] | null
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
          payment_method?: string | null
          tags?: string[] | null
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
      profiles: {
        Row: {
          created_at: string
          currency: string
          email: string | null
          full_name: string | null
          gross_income: number
          id: string
          is_resident: boolean
          nssf_mode: string
          tithe_base: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          email?: string | null
          full_name?: string | null
          gross_income?: number
          id: string
          is_resident?: boolean
          nssf_mode?: string
          tithe_base?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          email?: string | null
          full_name?: string | null
          gross_income?: number
          id?: string
          is_resident?: boolean
          nssf_mode?: string
          tithe_base?: string
          updated_at?: string
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
          active: boolean
          amount: number
          category: string
          created_at: string
          cycle: string
          id: string
          name: string
          next_charge: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          amount?: number
          category?: string
          created_at?: string
          cycle?: string
          id?: string
          name: string
          next_charge?: string | null
          notes?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          amount?: number
          category?: string
          created_at?: string
          cycle?: string
          id?: string
          name?: string
          next_charge?: string | null
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
