CREATE TABLE public.pending_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL,
  message_text text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('in','out')),
  amount numeric NOT NULL CHECK (amount > 0),
  counterparty text NOT NULL,
  kind text,
  reference text,
  occurred_at timestamptz,
  account_hint text,
  category text,
  confidence text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','ignored')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pending_transactions TO authenticated;
GRANT ALL ON public.pending_transactions TO service_role;

ALTER TABLE public.pending_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own pending transactions"
  ON public.pending_transactions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX pending_transactions_user_status_idx ON public.pending_transactions (user_id, status);