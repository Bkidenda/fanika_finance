import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { UserCircle, LogOut, ShieldAlert, Eraser, PowerOff, Trash2, HandHeart, Smartphone, Crown, Home, History } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({ component: ProfilePage });

function ProfilePage() {
  const { user, signOut } = useAuth();
  const qc = useQueryClient();
  const profile = useProfile();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [currency, setCurrency] = useState("KES");
  const [titheEnabled, setTitheEnabled] = useState(false);
  const [titheRate, setTitheRate] = useState("10");
  const [mpesaEnabled, setMpesaEnabled] = useState(true);
  const [mpesaRate, setMpesaRate] = useState("5");
  const [saving, setSaving] = useState(false);

  const [wipeOpen, setWipeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [familyOpen, setFamilyOpen] = useState(false);
  const [enablingFamily, setEnablingFamily] = useState(false);
  const familyEnabled = !!profile.data?.family_plan_enabled;

  async function enableFamilyPlan() {
    setEnablingFamily(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("profiles").update({ family_plan_enabled: true } as any).eq("id", user!.id);
    setEnablingFamily(false);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["profile"] });
    setFamilyOpen(true);
  }

  const deactivateFn = useServerFn(deactivateAccount);
  const deleteFn = useServerFn(deleteAccount);
  const wipeFn = useServerFn(wipeMyData);

  useEffect(() => {
    if (profile.data) {
      setFullName(profile.data.full_name ?? "");
      setUsername(profile.data.username ?? "");
      setCurrency(profile.data.currency);
      setTitheEnabled(!!profile.data.tithe_enabled);
      setTitheRate(String(Math.round((profile.data.tithe_rate ?? 0.10) * 100)));
      setMpesaEnabled(!!profile.data.mpesa_autosave_enabled);
      setMpesaRate(String(profile.data.mpesa_autosave_rate ?? 5));
    }
  }, [profile.data]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const handle = username.trim().toLowerCase();
    if (handle && !/^[a-z0-9_]{3,30}$/.test(handle)) return toast.error("Username: 3–30 chars, letters/numbers/underscore.");
    setSaving(true);
    const rate = Math.max(0, Math.min(100, Number(titheRate) || 0)) / 100;
    const mp = Math.max(0, Math.min(100, Number(mpesaRate) || 0));
    const { error } = await supabase
      .from("profiles")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ full_name: fullName, username: handle || null, currency, tithe_enabled: titheEnabled, tithe_rate: rate, mpesa_autosave_enabled: mpesaEnabled, mpesa_autosave_rate: mp } as any)
      .eq("id", user!.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  async function handleWipe() {
    setBusy(true);
    try { await wipeFn({}); toast.success("All your financial data cleared."); setWipeOpen(false); qc.invalidateQueries(); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }
  async function handleDeactivate() {
    setBusy(true);
    try { await deactivateFn({}); toast.success("Account deactivated."); await signOut(); navigate({ to: "/" }); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }
  async function handleDelete() {
    if (deleteConfirm !== "DELETE") return toast.error("Type DELETE to confirm.");
    setBusy(true);
    try { await deleteFn({ data: { confirm: "DELETE" } }); toast.success("Account permanently deleted."); await signOut(); navigate({ to: "/" }); }
    catch (e) { toast.error((e as Error).message); }
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
            <Label>Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="yourname"
            />
            <p className="text-[11px] text-muted-foreground">3–30 chars, lowercase letters / numbers / underscore. Shown as @{username || "yourname"}.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
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
                  <p className="text-xs text-muted-foreground">Computes tithe before disposable income is calculated. Record actual tithe payments on the Tithe page — they are tracked but don't reduce account balances (deducted pre-disposable).</p>
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

        <div className="border-t pt-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-primary"><Smartphone className="h-4 w-4" /></div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">M-Pesa auto-save to Ziidi</div>
                  <p className="text-xs text-muted-foreground">When you log an expense paid from an M-Pesa account, a percentage of it is automatically transferred to your "Ziidi" savings account. Requires a Ziidi account in Accounts.</p>
                </div>
                <Switch checked={mpesaEnabled} onCheckedChange={setMpesaEnabled} />
              </div>
              {mpesaEnabled && (
                <div className="mt-4 grid max-w-xs gap-1.5">
                  <Label>Auto-save rate (%)</Label>
                  <Input type="number" min="0" max="100" step="0.5" value={mpesaRate} onChange={(e) => setMpesaRate(e.target.value)} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button>
        </div>
      </form>

      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <h3 className="font-semibold">Account activity</h3>
        <p className="mt-1 text-xs text-muted-foreground">Review closed-month snapshots or manage this session.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link to="/history"><History className="mr-1 h-4 w-4" /> Financial history</Link></Button>
          <Button variant="outline" onClick={signOut}><LogOut className="mr-1 h-4 w-4" /> Sign out</Button>
        </div>
      </div>

      {/* Family Plan */}
      <div className="overflow-hidden rounded-2xl border shadow-elevated">
        <div className="bg-gradient-to-br from-[oklch(0.42_0.11_180)] via-[oklch(0.30_0.09_220)] to-[oklch(0.20_0.06_250)] p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <Crown className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-widest opacity-80">Premium</div>
                <div className="text-lg font-semibold">Family Plan</div>
              </div>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${familyEnabled ? "bg-emerald-400/20 text-emerald-100" : "bg-white/10 text-white/80"}`}>
              {familyEnabled ? "Active" : "Locked"}
            </span>
          </div>
          <p className="mt-4 max-w-lg text-sm opacity-90">
            Steward your household together. Invite your spouse and children, manage pocket money and savings goals, and see a combined household view — with privacy you control.
          </p>
          {!familyEnabled ? (
            <>
              <ul className="mt-4 grid gap-1.5 text-sm opacity-90 md:grid-cols-2">
                <li>• Invite spouse and children</li>
                <li>• Pocket money & child savings goals</li>
                <li>• Household net worth snapshot</li>
                <li>• Private-by-default sharing controls</li>
              </ul>
              <Button
                onClick={enableFamilyPlan}
                disabled={enablingFamily}
                className="mt-5 bg-white text-[oklch(0.22_0.07_240)] hover:bg-white/90"
              >
                <Home className="mr-2 h-4 w-4" /> {enablingFamily ? "Unlocking…" : "Unlock Family Plan"}
              </Button>
            </>
          ) : (
            <Button asChild className="mt-5 bg-white text-[oklch(0.22_0.07_240)] hover:bg-white/90">
              <Link to="/family"><Home className="mr-2 h-4 w-4" /> Manage Family</Link>
            </Button>
          )}
        </div>
      </div>

      <Dialog open={familyOpen} onOpenChange={setFamilyOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Welcome to Family Plan</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">You can now invite your family members and manage your household finances together.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setFamilyOpen(false)}>Later</Button>
            <Button asChild onClick={() => setFamilyOpen(false)}><Link to="/family">Open Family Hub</Link></Button>
          </div>
        </DialogContent>
      </Dialog>

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
          <p className="text-sm text-muted-foreground">Deletes every income entry, expense, budget, debt, investment, account, subscription, goal, AI insight and month closure. Profile and login preserved. Cannot be undone.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setWipeOpen(false)} disabled={busy}>Cancel</Button>
            <Button variant="destructive" onClick={handleWipe} disabled={busy}>{busy ? "Clearing…" : "Yes, clear everything"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete account permanently?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Type <span className="font-mono font-semibold">DELETE</span> to confirm.</p>
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
