// Compatibility shim for older auth calls.
// This routes Google OAuth through Supabase so it does not hit the Lovable /~oauth/initiate endpoint.

import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: "google" | "apple" | "microsoft" | "lovable", opts?: SignInOptions) => {
      if (provider !== "google") {
        return { error: new Error(`Unsupported provider: ${provider}`) };
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: opts?.redirect_uri ?? `${window.location.origin}/dashboard`,
          queryParams: opts?.extraParams,
        },
      });

      if (error) {
        return { data, error };
      }

      return { data, error: null, redirected: true };
    },
  },
};
