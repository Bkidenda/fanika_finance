import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/lib/queries";
import { deactivateAccount, deleteAccount, wipeMyData } from "@/lib/account.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserCircle, Coins, CreditCard, LogOut, ShieldAlert, Eraser, PowerOff, Trash2, HandHeart } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({ component: ProfilePage });

function ProfilePage() {
  const { user, signOut } = useAuth();
  const qc = useQueryClient();
  const profile = useProfile();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [currency, setCurrency] = useState("KES");
  const [titheEnabled, setTitheEnabled] = useState(false);
  const [titheRate, setTitheRate] = useState("10");
  const [saving, setSaving] = useState(false);

  const [wipeOpen, setWipeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const deactivateFn = useServerFn(deactivateAccount);
  const deleteFn = useServerFn(deleteAccount);
  const wipeFn = useServerFn(wipeMyData);

  useEffect(() => {
    if (profile.data) {
      setFullName(profile.data.full_name ?? "");
      setCurrency(profile.data.currency);
      setTitheEnabled(!!profile.data.tithe_enabled);
      setTitheRate(String(Math.round((profile.data.tithe_rate ?? 0.10) * 100)));
    }
  }, [profile.data]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const rate = Math.max(0, Math.min(100, Number(titheRate) || 0)) / 100;
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, currency, tithe_enabled: titheEnabled, tithe_rate: rate })
      .eq("id", user!.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  async function handleWipe() {
    setBusy(true);
    try {
      await wipeFn({});
      toast.success("All your financial data cleared.");
      setWipeOpen(false);
      qc.invalidateQueries();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }

  async function handleDeactivate() {
    setBusy(true);
    try {
      await deactivateFn({});
      toast.success("Account deactivated. You can reactivate by signing back in.");
      await signOut();
      navigate({ to: "/" });
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }

  async function handleDelete() {
    if (deleteConfirm !== "DELETE") return toast.error("Type DELETE to confirm.");
    setBusy(true);
    try {
      await deleteFn({ data: { confirm: "DELETE" } });
      toast.success("Account permanently deleted.");
      await signOut();
      navigate({ to: "/" });
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-card">
          <UserCircle className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">My Profile</h2>
          <p className="text-sm text-muted-foreground">Your personal details, giving preferences, and account.</p>
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
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-primary"><HandHeart className="h-4 w-4" /></div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Automatic tithe / giving</div>
                  <p className="text-xs text-muted-foreground">When enabled, a percentage of every income entry is computed and set aside before disposable income is calculated.</p>
                </div>
                <Switch checked={titheEnabled} onCheckedChange={setTitheEnabled} />
              </div>
              {titheEnabled && (
                <div className="mt-4 grid max-w-xs gap-1.5">
                  <Label>Tithe rate (%)</Label>
                  <Input type="number" min="0" max="100" step="0.5" value={titheRate} onChange={(e) => setTitheRate(e.target.value)} />
                </div>
              )}
            </div>
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
        <h3 className="font-semibold">Session</h3>
        <p className="mt-1 text-sm text-muted-foreground">Sign out of Nuru Steward on this device.</p>
        <div className="mt-4">
          <Button variant="outline" onClick={signOut}><LogOut className="mr-1 h-4 w-4" /> Sign out</Button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 shadow-card">
        <div className="flex items-center gap-2 text-destructive">
          <ShieldAlert className="h-5 w-5" />
          <h3 className="font-semibold">Danger zone</h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">These actions are irreversible (except deactivate).</p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Button variant="outline" onClick={() => setWipeOpen(true)} className="justify-start">
            <Eraser className="mr-2 h-4 w-4" /> Clear all my data
          </Button>
          <Button variant="outline" onClick={handleDeactivate} disabled={busy} className="justify-start">
            <PowerOff className="mr-2 h-4 w-4" /> Deactivate account
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)} className="justify-start">
            <Trash2 className="mr-2 h-4 w-4" /> Delete permanently
          </Button>
        </div>
      </div>

      <Dialog open={wipeOpen} onOpenChange={setWipeOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Clear all financial data?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This deletes every income entry, expense, budget, debt, investment, account, subscription, goal, AI insight and month closure. Your profile and login are preserved. This cannot be undone.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setWipeOpen(false)} disabled={busy}>Cancel</Button>
            <Button variant="destructive" onClick={handleWipe} disabled={busy}>{busy ? "Clearing…" : "Yes, clear everything"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete account permanently?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This deletes your account, profile and every record. You will not be able to recover any data. Type <span className="font-mono font-semibold">DELETE</span> to confirm.</p>
          <Input className="mt-3" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="Type DELETE" />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={busy}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={busy || deleteConfirm !== "DELETE"}>{busy ? "Deleting…" : "Delete forever"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
