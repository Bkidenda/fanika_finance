import { toast } from 'sonner';
import { supabase } from './client';

type ProfileInsert = {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
};

export function getAuthRedirectUrl(path = '/dashboard') {
  const configuredOrigin = import.meta.env.VITE_APP_URL ?? import.meta.env.VITE_SITE_URL;
  const base = configuredOrigin ? configuredOrigin.replace(/\/$/, '') : (typeof window !== 'undefined' ? window.location.origin : 'https://www.fanika.top');
  return new URL(path, base).toString();
}

export async function createOrUpdateProfile(profile: ProfileInsert) {
  const { error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' });

  if (error) {
    console.error('[Supabase] Failed to save profile:', error);
  }

  return { error };
}

/**
 * Starts Google sign-in through the managed broker (works inside the editor
 * preview and on the published site). After sign-in the user returns to the
 * public origin and the login page forwards them to `path`.
 */
export async function signInWithGoogle(path = '/dashboard') {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem('fanika:after_login', path.startsWith('/') ? path : '/dashboard');
  } catch {
    /* ignore */
  }
  const { lovable } = await import('@/integrations/lovable');
  const result = await lovable.auth.signInWithOAuth('google', {
    redirect_uri: window.location.origin + '/login',
  });
  if (result.error) {
    toast.error(result.error.message || 'Google sign-in failed');
  }
}

export async function signUpWithEmail({
  email,
  password,
  redirectTo,
}: {
  email: string;
  password: string;
  redirectTo?: string;
}) {
  const callbackUrl = redirectTo ?? getAuthRedirectUrl('/dashboard');

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: callbackUrl,
    },
  });

  if (error) {
    toast.error(error.message);
    return { data, error };
  }

  if (data.user) {
    await createOrUpdateProfile({
      id: data.user.id,
      email: data.user.email ?? email,
      full_name: data.user.user_metadata?.full_name ?? null,
      avatar_url: data.user.user_metadata?.avatar_url ?? null,
    });
  }

  return { data, error };
}

export async function handleSupabaseAuthCallback() {
  if (typeof window === 'undefined') {
    return { session: null, error: null };
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('[Supabase] Auth callback error:', error);
  }

  return { data, error };
}