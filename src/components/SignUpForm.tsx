import { getAuthRedirectUrl, signUpWithEmail } from '@/integrations/supabase/auth';

export async function handleSignUp(email: string, password: string) {
  const redirectTo = getAuthRedirectUrl('/dashboard');

  const { data, error } = await signUpWithEmail({
    email,
    password,
    redirectTo,
  });

  if (error) {
    throw error;
  }

  return data;
}

export default async function onSubmit(e: React.FormEvent) {
  e.preventDefault();

  const form = e.currentTarget as HTMLFormElement;
  const emailInput = form.elements.namedItem('email') as HTMLInputElement | null;
  const passwordInput = form.elements.namedItem('password') as HTMLInputElement | null;

  const email = emailInput?.value ?? '';
  const password = passwordInput?.value ?? '';

  await handleSignUp(email, password);
}

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id);