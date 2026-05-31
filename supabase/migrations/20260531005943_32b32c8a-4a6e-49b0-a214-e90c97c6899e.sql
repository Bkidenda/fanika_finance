CREATE TABLE public.financial_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  title text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  kind text NOT NULL DEFAULT 'reminder',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_events TO authenticated;
GRANT ALL ON public.financial_events TO service_role;
ALTER TABLE public.financial_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.financial_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.financial_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.financial_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.financial_events FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX financial_events_user_date_idx ON public.financial_events(user_id, date);