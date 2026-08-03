import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAuthRedirectUrl } from "@/integrations/supabase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sprout } from "lucide-react";

export const Route = createFileRoute("/signup")({
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    const handle = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(handle)) return toast.error("Username: 3–30 chars, letters/numbers/underscore.");
    setBusy(true);

    // Pre-check uniqueness so we surface the friendly error before signup commits.
    const { data: taken } = await supabase.from("profiles").select("id").ilike("username", handle).maybeSingle();
    if (taken) { setBusy(false); return toast.error("Username already in use"); }

    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: getAuthRedirectUrl('/dashboard'),
        data: { full_name: name, username: handle },
      },
    });
    setBusy(false);
    if (error) {
      const msg = String(error.message ?? "");
      if (/duplicate|unique|profiles_username|already/i.test(msg) && /username/i.test(msg)) {
        return toast.error("Username already in use");
      }
      return toast.error(msg);
    }
    toast.success("Check your email to confirm your account");
    navigate({ to: "/login" });
  }

  async function google() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAuthRedirectUrl('/dashboard'),
      },
    });
    if (error) toast.error(error.message ?? "Sign-up failed");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-surface px-4">
      <div className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-elevated">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-card">
            <Sprout className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold">Fanika</span>
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Start your financial discipline journey today.</p>

        <Button variant="outline" className="mt-6 w-full" onClick={google}>
          Continue with Google
        </Button>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <div className="flex items-center rounded-md border bg-background px-2 focus-within:ring-1 focus-within:ring-ring">
              <span className="text-sm text-muted-foreground">@</span>
              <Input id="username" required value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} className="border-0 px-1 focus-visible:ring-0" placeholder="yourname" minLength={3} maxLength={30} pattern="[a-z0-9_]{3,30}" />
            </div>
            <p className="text-[11px] text-muted-foreground">Lowercase letters, numbers and underscores — 3 to 30 characters.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
