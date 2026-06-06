import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Coins, Receipt, Wallet, Landmark } from "lucide-react";

const TABS = [
  { to: "/income-entries", label: "Income", icon: Coins },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/budgets", label: "Budget", icon: Wallet },
  { to: "/accounts", label: "Accounts", icon: Landmark },
] as const;

export function MobileTabBar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 w-full border-t border-white/10 bg-[oklch(0.18_0.04_240)]/95 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 backdrop-blur md:hidden"
      aria-label="Primary"
    >
      <ul className="grid w-full grid-cols-5">
        {TABS.map((t) => {
          const active = path === t.to;
          const Icon = t.icon;
          return (
            <li key={t.to} className="flex">
              <Link
                to={t.to}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium transition ${
                  active ? "text-[oklch(0.82_0.16_175)]" : "text-white/65 hover:text-white/90"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.2 : 1.8} />
                <span className="leading-tight">{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
