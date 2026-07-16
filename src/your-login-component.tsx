import { signInWithGoogle } from '@/integrations/supabase/auth';

export function LoginPage() {
  return (
    <div>
      <h2>Sign in</h2>
      <GoogleAuthButton />
    </div>
  );
}