import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard, Coins, Receipt, Wallet, Landmark, Plus,
  TrendingUp, Target, CreditCard, FileText, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

type Tab = { to: string; label: string; icon: typeof LayoutDashboard; center?: boolean };
const TABS: readonly Tab[] = [
  { to: "/income-entries", label: "Income", icon: Coins },
  { to: "/transactions", label: "Money", icon: Receipt },
  { to: "/dashboard", label: "Home", icon: LayoutDashboard, center: true },
  { to: "/budgets", label: "Budget", icon: Wallet },
  { to: "/accounts", label: "Accounts", icon: Landmark },
];

const ACTIONS = [
  { to: "/income-entries", label: "Add Income", icon: ArrowDownRight, color: "bg-accent/20 text-accent-foreground border-accent/40" },
  { to: "/transactions", label: "Add Expense", icon: ArrowUpRight, color: "bg-destructive/20 text-destructive border-destructive/40" },
  { to: "/goals", label: "Update Goal", icon: Target, color: "bg-primary/20 text-primary border-primary/40" },

  { to: "/investments", label: "Log Investment", icon: TrendingUp, color: "bg-info/15 text-info border-info/30" },
  { to: "/debts", label: "Log Payment", icon: CreditCard, color: "bg-primary/15 text-primary border-primary/30" },
  { to: "/reports", label: "Statements", icon: FileText, color: "bg-secondary text-secondary-foreground border-border" },
] as const;

export function MobileTabBar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Spacer so page content isn't hidden behind the bar */}
      <div aria-hidden className="h-[76px] md:hidden" />

      {/* Action overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close quick actions"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
        >
          <div className="absolute inset-x-0 bottom-24 px-6" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto max-w-sm rounded-3xl border border-white/10 bg-foreground/95 p-4 shadow-2xl backdrop-blur">
              <div className="grid grid-cols-3 gap-3">
                {ACTIONS.map((a) => {
                  const Icon = a.icon;
                  return (
                    <button
                      key={a.label}
                      onClick={() => { setOpen(false); navigate({ to: a.to }); }}
                      className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-white/85 active:scale-95 transition"
                    >
                      <span className={`flex h-11 w-11 items-center justify-center rounded-xl border ${a.color}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-[10px] font-medium leading-tight text-center">{a.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </button>
      )}

      {/* FAB */}
      <button
        type="button"
        aria-label={open ? "Close quick actions" : "Open quick actions"}
        onClick={() => setOpen((v) => !v)}
        className="fixed left-1/2 z-50 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border border-white/15 bg-primary text-primary-foreground shadow-elevated transition-transform md:hidden"
        style={{ bottom: `calc(env(safe-area-inset-bottom, 0px) + 72px)` }}
      >
        <Plus className={`h-6 w-6 transition-transform ${open ? "rotate-45" : ""}`} strokeWidth={2.4} />
      </button>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 w-full border-t border-white/10 bg-foreground/95 backdrop-blur md:hidden"
        style={{ paddingBottom: `max(env(safe-area-inset-bottom), 0.5rem)` }}
        aria-label="Primary"
      >
        <ul className="relative grid w-full grid-cols-5 items-end pt-2">
          {TABS.map((t) => {
            const active = path === t.to;
            const Icon = t.icon;
            if (t.center) {
              return (
                <li key={t.to} className="flex justify-center">
                  <Link
                    to={t.to}
                    className={`relative -mt-7 flex h-14 w-14 flex-col items-center justify-center rounded-full border text-[10px] font-medium transition ${
                      active
                        ? "border-primary/70 bg-background text-primary shadow-elevated"
                        : "border-white/10 bg-background/80 text-white/60"
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                    <span className="mt-0.5 leading-none">{t.label}</span>
                  </Link>
                </li>
              );
            }
            return (
              <li key={t.to} className="flex">
                <Link
                  to={t.to}
                  className={`relative flex flex-1 flex-col items-center gap-0.5 px-1 pb-1.5 pt-2 text-[10px] font-medium transition ${
                    active ? "text-primary-glow" : "text-white/45 hover:text-white/80"
                  }`}
                >
                  {active && <span className="absolute inset-x-3 top-0 h-[2px] rounded-full bg-primary-glow" />}
                  <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 1.8} />
                  <span className="leading-tight">{t.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
