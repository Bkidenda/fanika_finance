import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Wallet, Inbox, PieChart, Ellipsis } from "lucide-react";
import { usePendingCount } from "@/lib/pending";

const TABS = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/transactions", label: "Money", icon: Wallet },
  { to: "/review", label: "Review", icon: Inbox, badge: true },
  { to: "/budgets", label: "Budgets", icon: PieChart },
  { to: "/more", label: "More", icon: Ellipsis },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const pending = usePendingCount();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-2 bottom-2 z-40 rounded-[26px] bg-primary-dark px-1.5 pt-2 shadow-elevated"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
    >
      <ul className="grid w-full grid-cols-5">
        {TABS.map((t) => {
          const active = path === t.to || path.startsWith(t.to + "/");
          const Icon = t.icon;
          const showBadge = t.badge && pending > 0;
          return (
            <li key={t.to} className="flex">
              <Link
                to={t.to}
                className={`relative flex w-full flex-col items-center gap-1 rounded-2xl py-1.5 text-[11px] font-medium transition ${
                  active ? "bg-accent text-accent-foreground" : "text-white/60 hover:text-white/90"
                }`}
              >
                <span className="relative">
                  <Icon className="h-[20px] w-[20px]" strokeWidth={active ? 2.4 : 1.9} />
                  {showBadge && (
                    <span className="absolute -right-2.5 -top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                      {pending > 99 ? "99+" : pending}
                    </span>
                  )}
                </span>
                <span className="leading-none">{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
