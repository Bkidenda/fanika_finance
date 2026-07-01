
-- 1. Add family_plan_enabled to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS family_plan_enabled boolean NOT NULL DEFAULT false;

-- 2. Extend family_members with new fields for the Family Hub
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS role text CHECK (role IN ('spouse','child','other'));
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS avatar_colour text DEFAULT 'teal';
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS pocket_money numeric NOT NULL DEFAULT 0;
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','shared'));

-- 3. Child entries
CREATE TABLE IF NOT EXISTS public.child_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('income','expense','saving','giving')),
  amount numeric NOT NULL,
  category text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.child_entries TO authenticated;
GRANT ALL ON public.child_entries TO service_role;
ALTER TABLE public.child_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own child_entries" ON public.child_entries FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- 4. Child goals
CREATE TABLE IF NOT EXISTS public.child_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  name text NOT NULL,
  target_amount numeric NOT NULL,
  current_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.child_goals TO authenticated;
GRANT ALL ON public.child_goals TO service_role;
ALTER TABLE public.child_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own child_goals" ON public.child_goals FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
