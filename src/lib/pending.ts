import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { parseMessage } from "@/lib/sms-parser";
import { isoLocalDate } from "@/lib/format";

export type PendingTx = {
  id: string;
  user_id: string;
  source: string;
  message_text: string;
  direction: "in" | "out";
  amount: number;
  counterparty: string;
  kind: string;
  reference: string | null;
  occurred_at: string | null;
  account_hint: string | null;
  category: string | null;
  confidence: string;
  status: "pending" | "confirmed" | "ignored";
  created_at: string;
};

export const PENDING_KEY = ["pending-transactions"] as const;

export function usePendingTransactions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...PENDING_KEY, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pending_transactions")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PendingTx[];
    },
  });
}

export function usePendingCount() {
  const { data } = usePendingTransactions();
  return data?.length ?? 0;
}

/** Parse a forwarded/pasted message and store it as a draft for review. */
export async function ingestMessage(text: string): Promise<{ ok: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const parsed = parseMessage(text);
  if (!parsed) {
    return { ok: false, error: "We couldn't find an amount in that message. Check that it's a full M-PESA, Airtel or bank alert." };
  }
  // Skip exact duplicates of a still-pending draft
  const { data: existing } = await supabase
    .from("pending_transactions")
    .select("id")
    .eq("status", "pending")
    .eq("amount", parsed.amount)
    .eq("direction", parsed.direction)
    .eq("counterparty", parsed.counterparty);
  if ((existing ?? []).length > 0) return { ok: true };

  const { error } = await supabase.from("pending_transactions").insert({
    user_id: user.id,
    source: parsed.source,
    message_text: text.slice(0, 2000),
    direction: parsed.direction,
    amount: parsed.amount,
    counterparty: parsed.counterparty,
    kind: parsed.kind,
    reference: parsed.reference,
    occurred_at: parsed.occurredAt,
    account_hint: parsed.accountHint,
    category: parsed.categoryGuess,
    confidence: parsed.confidence,
  } as never);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export type ConfirmOptions = {
  category?: string;
  accountId?: string | null;
  description?: string;
  date?: string;
};

/** Turn a pending draft into a real transaction and retire the draft. */
export async function confirmPending(tx: PendingTx, opts: ConfirmOptions = {}): Promise<void> {
  const date = opts.date ?? (tx.occurred_at ? tx.occurred_at.slice(0, 10) : isoLocalDate());
  if (tx.direction === "in") {
    const { error } = await supabase.from("income_entries").insert({
      user_id: tx.user_id,
      date,
      source: opts.description || tx.counterparty,
      amount: tx.amount,
      account_id: opts.accountId ?? null,
    } as never);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("expenses").insert({
      user_id: tx.user_id,
      date,
      amount: tx.amount,
      category: opts.category || tx.category || "Other",
      description: opts.description || (tx.reference ? `${tx.counterparty} · ${tx.reference}` : tx.counterparty),
      payment_method: /m-?pesa/i.test(tx.source) ? "M-Pesa" : null,
      account_id: opts.accountId ?? null,
      transaction_fee: 0,
    } as never);
    if (error) throw error;
  }
  await supabase.from("pending_transactions").update({ status: "confirmed" }).eq("id", tx.id);
}

export async function ignorePending(id: string): Promise<void> {
  await supabase.from("pending_transactions").update({ status: "ignored" }).eq("id", id);
}

export const SAMPLE_MESSAGES = [
  "Safaricom M-PESA: You have paid Ksh2,340.00 to NAIVAS SUPERMARKET LTD on 3/11/26 at 6:42 PM. New M-PESA balance is Ksh12,400.00. Ref TK47XH1B8Q",
  "M-PESA: Ksh3,800.00 paid to PAYBILL 888880 KPLC account 12345678 on 3/11/26 at 1:15 PM. Ref CB12GH55KL. New M-PESA balance is Ksh8,600.00.",
  "EQUITY BANK: Dear customer, your account ****1234 has been credited with KES 18,500.00 on 3-Nov-2026 at 9:03 AM ref EQ1234567. Available balance KES 38,900.00",
  "Safaricom M-PESA: You have sent Ksh780.00 to JAVA HOUSE WESTLANDS on 2/11/26 at 8:12 AM. New M-PESA balance is Ksh16,180.00. Ref QW55RT21ZX",
];

export function pendingKeyForInvalidate(): readonly unknown[] {
  return PENDING_KEY;
}
