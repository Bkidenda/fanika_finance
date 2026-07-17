import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sprout } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();

    setBusy(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password reset link sent. Check your email.");
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

        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          Reset password
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email and we will send you a password reset link.
        </p>

        <form onSubmit={resetPassword} className="mt-6 space-y-4">

          <div className="space-y-1.5">
            <Label htmlFor="email">
              Email
            </Label>

            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={busy}
          >
            {busy ? "Sending..." : "Send reset link"}
          </Button>

        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link
            to="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}