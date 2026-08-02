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

export default async function onSubmit(e: FormEvent) {
  e.preventDefault();

  const form = e.currentTarget as HTMLFormElement;
  const emailInput = form.elements.namedItem('email') as HTMLInputElement | null;
  const passwordInput = form.elements.namedItem('password') as HTMLInputElement | null;

  const email = emailInput?.value ?? '';
  const password = passwordInput?.value ?? '';

  await handleSignUp(email, password);
}
