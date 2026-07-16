import { signInWithGoogle } from '@/integrations/supabase/auth';

export function GoogleAuthButton() {
  return (
    <button
      type="button"
      onClick={() => {
        void signInWithGoogle();
      }}
      className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
    >
      Continue with Google
    </button>
  );
}