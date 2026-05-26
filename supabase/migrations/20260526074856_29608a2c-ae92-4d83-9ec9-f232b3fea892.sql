
-- Enums
CREATE TYPE public.deduction_type AS ENUM ('statutory','custom');
CREATE TYPE public.rule_type AS ENUM ('fixed','percentage');
CREATE TYPE public.frequency_type AS ENUM ('monthly','annual','one_time');
CREATE TYPE public.investment_type AS ENUM ('savings','sacco','stocks','crypto','bonds','fixed_deposit','business','other');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  currency TEXT NOT NULL DEFAULT 'KES',
  gross_income NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  frequency public.frequency_type NOT NULL DEFAULT 'monthly',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.deduction_type NOT NULL,
  name TEXT NOT NULL,
  rule public.rule_type NOT NULL DEFAULT 'fixed',
  value NUMERIC(14,4) NOT NULL DEFAULT 0,
  frequency public.frequency_type NOT NULL DEFAULT 'monthly',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  month DATE NOT NULL,
  limit_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category, month)
);

CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(14,2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  payment_method TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type public.investment_type NOT NULL DEFAULT 'savings',
  institution TEXT,
  amount_invested NUMERIC(14,2) NOT NULL DEFAULT 0,
  current_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  start_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(14,2) NOT NULL,
  current_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  deadline DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.devotionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verse TEXT NOT NULL,
  verse_reference TEXT NOT NULL,
  egw_quote TEXT NOT NULL,
  egw_source TEXT,
  reflection TEXT NOT NULL,
  tag TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed devotionals
INSERT INTO public.devotionals (verse, verse_reference, egw_quote, egw_source, reflection, tag) VALUES
('Bring ye all the tithes into the storehouse, that there may be meat in mine house, and prove me now herewith, saith the Lord of hosts, if I will not open you the windows of heaven.', 'Malachi 3:10', 'A faithful return of tithe is a part of the worship that we owe to God.', 'Counsels on Stewardship, p. 81', 'Stewardship begins with returning what is already God''s. Notice how He invites you to test Him.', 'giving'),
('Honor the Lord with your wealth, with the firstfruits of all your crops.', 'Proverbs 3:9', 'God is the giver of every good gift. He intends that there shall be order and harmony in the distribution of His blessings.', 'Counsels on Stewardship, p. 65', 'Plan your finances before spending, so the first portion always honors God.', 'budgeting'),
('The plans of the diligent lead surely to abundance, but everyone who is hasty comes only to poverty.', 'Proverbs 21:5', 'Economy is a virtue worthy of being cultivated by every Christian.', 'Counsels on Stewardship, p. 250', 'Slow, steady discipline beats impulsive spending every time.', 'discipline'),
('Give, and it will be given to you. A good measure, pressed down, shaken together and running over, will be poured into your lap.', 'Luke 6:38', 'No one can fail to be benefited by giving. He who gives most receives most in return.', 'Acts of the Apostles, p. 339', 'Generosity is a habit of the heart; small consistent giving compounds.', 'generosity'),
('My God shall supply all your need according to his riches in glory by Christ Jesus.', 'Philippians 4:19', 'Trust in the Lord, and rest in Him; let nothing rob you of your faith.', 'Ministry of Healing, p. 481', 'Financial stress is real, yet provision is promised. Lean on Him.', 'trust'),
('For which of you, intending to build a tower, sitteth not down first, and counteth the cost?', 'Luke 14:28', 'Economy in the use of money is excellent. The careful and frugal use of money is a duty.', 'Counsels on Stewardship, p. 249', 'Budgets are the disciple''s blueprint—count the cost before spending.', 'budgeting'),
('A good man leaveth an inheritance to his children''s children.', 'Proverbs 13:22', 'Parents should provide for their children, but should not lavish upon them money for selfish gratification.', 'Adventist Home, p. 391', 'Building wealth is not selfish when it''s done to bless future generations.', 'investing'),
('Cast thy bread upon the waters: for thou shalt find it after many days.', 'Ecclesiastes 11:1', 'Be not weary in well doing, for in due season ye shall reap, if ye faint not.', 'Christian Service, p. 86', 'Faithful saving and giving today produce a future harvest.', 'savings'),
('The borrower is slave to the lender.', 'Proverbs 22:7', 'Keep out of debt. Do not borrow unless you can see the way clear to pay back.', 'Counsels on Stewardship, p. 254', 'Freedom from debt is freedom to serve. Make a plan to be free.', 'discipline'),
('Where your treasure is, there will your heart be also.', 'Matthew 6:21', 'Money has great value, because it can do great good. In the hands of God''s children it is food for the hungry.', 'Counsels on Stewardship, p. 137', 'Look at your spending—it tells the true story of what you love.', 'general');

-- has_role pattern reserved for future. Not needed for v1.

-- Trigger function: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devotionals ENABLE ROW LEVEL SECURITY;

-- Owner-only policies
CREATE POLICY "own profile select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DO $$ DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['incomes','deductions','budgets','expenses','investments','savings_goals']) LOOP
    EXECUTE format('CREATE POLICY "own select" ON public.%I FOR SELECT USING (auth.uid() = user_id);', t);
    EXECUTE format('CREATE POLICY "own insert" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id);', t);
    EXECUTE format('CREATE POLICY "own update" ON public.%I FOR UPDATE USING (auth.uid() = user_id);', t);
    EXECUTE format('CREATE POLICY "own delete" ON public.%I FOR DELETE USING (auth.uid() = user_id);', t);
  END LOOP;
END $$;

-- Devotionals: any authenticated user can read
CREATE POLICY "devotionals read" ON public.devotionals FOR SELECT TO authenticated USING (true);
