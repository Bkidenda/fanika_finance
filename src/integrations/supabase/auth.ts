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
 * Starts Google sign-in. Inside an embedded preview frame Google refuses to
 * render, so we take the URL ourselves and open it at the top level.
 */
export async function signInWithGoogle(path = '/dashboard') {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getAuthRedirectUrl(path),
      skipBrowserRedirect: true,
    },
  });

  if (error || !data?.url) {
    toast.error(error?.message ?? 'Sign-in failed');
    return;
  }

  const framed = typeof window !== 'undefined' && window.top && window.top !== window;
  if (framed) {
    window.open(data.url, '_blank', 'noopener,noreferrer');
    return;
  }
  window.location.assign(data.url);
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