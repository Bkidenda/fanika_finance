
-- Profile: avatar + display name
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Subscriptions: track last charge for automation idempotency
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS last_charged date;

-- Debts: link to an account so an existing bank loan can be shown as negative balance
ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS linked_account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL;

-- Family invites & roles
CREATE TABLE IF NOT EXISTS public.family_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_invites TO authenticated;
GRANT ALL ON public.family_invites TO service_role;
ALTER TABLE public.family_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invites owner rw" ON public.family_invites FOR ALL
  USING (invited_by = auth.uid()) WITH CHECK (invited_by = auth.uid());

-- Family chores with monetary rewards
CREATE TABLE IF NOT EXISTS public.family_chores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id uuid REFERENCES public.family_members(id) ON DELETE SET NULL,
  title text NOT NULL,
  reward numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  due_date date,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_chores TO authenticated;
GRANT ALL ON public.family_chores TO service_role;
ALTER TABLE public.family_chores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chores owner rw" ON public.family_chores FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
