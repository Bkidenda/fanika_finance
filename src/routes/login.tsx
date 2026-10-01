import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signInWithGoogle } from "@/integrations/supabase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sprout } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { IMG } from "@/lib/site-images";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Fanika" },
      { name: "description", content: "Sign in to Fanika to manage your budgets, accounts and goals." },
      { property: "og:title", content: "Sign in — Fanika" },
      { property: "og:description", content: "Sign in to Fanika to manage your budgets, accounts and goals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  // Interactive only once React has taken over the page; otherwise an early
  // click submits the form natively and reloads without signing in.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/dashboard" });
  }

  async function google() {
    await signInWithGoogle("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      {/* Photo panel: top banner on mobile, left half on desktop */}
      <div className="relative h-[42vh] min-h-[280px] overflow-hidden lg:h-auto lg:min-h-screen">
        <img src={IMG.phone} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-foreground/20 to-foreground/80" />
        <div className="relative flex h-full flex-col justify-between p-6 text-background lg:p-12">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
                <Sprout className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold">Fanika</span>
            </Link>
            <Link to="/" className="rounded-full bg-background/20 px-3 py-1 text-xs font-medium backdrop-blur hover:bg-background/30">
              Home
            </Link>
          </div>
          <div className="pb-8 lg:pb-0">
            <h1 className="text-4xl font-bold leading-tight tracking-tight lg:text-5xl">Welcome<br />back</h1>
            <p className="mt-2 max-w-sm text-sm text-background/85 lg:text-base">
              Sign in to see your budgets, accounts and goals in one place.
            </p>
          </div>
        </div>
      </div>

      {/* Sheet */}
      <div className="relative -mt-6 rounded-t-3xl bg-card px-6 pb-10 pt-7 shadow-elevated lg:mt-0 lg:flex lg:items-center lg:justify-center lg:rounded-none lg:shadow-none">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="text-xl font-semibold tracking-tight">Sign in</h2>

          <Button variant="outline" className="mt-5 h-12 w-full rounded-xl" onClick={google} disabled={!ready}>
            Continue with Google
          </Button>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={signIn} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required className="h-12 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot?</Link>
              </div>
              <Input id="password" type="password" required className="h-12 rounded-xl" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="h-12 w-full rounded-xl" disabled={busy || !ready}>
              {busy ? "Signing in…" : "Continue with email"}
            </Button>
          </form>

          <Link to="/signup" className="mt-5 flex items-center justify-between rounded-xl border px-4 py-3 text-sm hover:bg-muted">
            <span>
              <span className="block font-medium">New to Fanika?</span>
              <span className="text-xs text-muted-foreground">Create a free account</span>
            </span>
            <span className="text-muted-foreground">›</span>
          </Link>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            By continuing you agree to Fanika's Terms and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}