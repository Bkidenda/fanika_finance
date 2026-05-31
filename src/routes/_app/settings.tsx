import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCircle, Coins, CreditCard, LogOut } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({ component: ProfilePage });

function ProfilePage() {
  const { user, signOut } = useAuth();
  const qc = useQueryClient();
  const profile = useProfile();

  const [fullName, setFullName] = useState("");
  const [currency, setCurrency] = useState("KES");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile.data) {
      setFullName(profile.data.full_name ?? "");
      setCurrency(profile.data.currency);
    }
  }, [profile.data]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, currency })
      .eq("id", user!.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-card">
          <UserCircle className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">My Profile</h2>
          <p className="text-sm text-muted-foreground">Your personal details, display currency and account.</p>
        </div>
      </div>

      <form onSubmit={saveProfile} className="rounded-2xl border bg-card p-6 shadow-card space-y-6">
        <h3 className="font-semibold">Personal details</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
            <p className="text-xs text-muted-foreground">Email is managed by your sign-in provider.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Display currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["KES", "USD", "EUR", "GBP", "UGX", "TZS", "NGN", "ZAR", "INR"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">All amounts across Nuru Steward are formatted in this currency.</p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/income-entries" className="rounded-2xl border bg-card p-5 shadow-card transition hover:shadow-elevated">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-primary"><Coins className="h-4 w-4" /></div>
          <div className="mt-3 font-semibold">Income</div>
          <p className="text-xs text-muted-foreground">Record salary, side income and any other money coming in on the Income page.</p>
        </Link>
        <Link to="/debts" className="rounded-2xl border bg-card p-5 shadow-card transition hover:shadow-elevated">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-primary"><CreditCard className="h-4 w-4" /></div>
          <div className="mt-3 font-semibold">Loans & deductions</div>
          <p className="text-xs text-muted-foreground">Track loans and standing deductions on the Debts page so they reconcile with your accounts.</p>
        </Link>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <h3 className="font-semibold">Account</h3>
        <p className="mt-1 text-sm text-muted-foreground">Sign out of Nuru Steward on this device.</p>
        <div className="mt-4">
          <Button variant="outline" onClick={signOut}><LogOut className="mr-1 h-4 w-4" /> Sign out</Button>
        </div>
      </div>
    </div>
  );
}
