import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/page-header";
import { useAuth } from "@/hooks/use-auth";
import { useSubscriptions } from "@/lib/queries";
import {
  Coins, CalendarDays, FileText, HeartHandshake, Repeat, Scale, TrendingUp,
  NotebookPen, Sparkles, Target, Landmark, Users, UserRound, MessageSquareText, LogOut,
} from "lucide-react";

export const Route = createFileRoute("/_app/more")({
  head: () => ({
    meta: [
      { title: "More — Fanika" },
      { name: "description", content: "Income, calendar, reports, giving, subscriptions, debts, investments, reflections and more." },
      { property: "og:title", content: "More — Fanika" },
      { property: "og:description", content: "Everything else in Fanika: income, calendar, reports, giving, debts, investments and insights." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: More,
});

function More() {
  const { signOut, user } = useAuth();
  const subscriptions = useSubscriptions();
  const activeSubs = (subscriptions.data ?? []).filter((s) => s.active).length;

  const tiles: { to: string; label: string; detail: string; icon: typeof Coins; chip: string }[] = [
    { to: "/income-entries", label: "Income", detail: "Salary and side income", icon: Coins, chip: "bg-destructive/20 text-destructive" },
    { to: "/calendar", label: "Calendar", detail: "Bills and due dates", icon: CalendarDays, chip: "bg-success/20 text-success" },
    { to: "/reports", label: "Reports", detail: "Statements and exports", icon: FileText, chip: "bg-chart-4/30 text-chart-8" },
    { to: "/giving", label: "Charity and giving", detail: "Tithes and offerings", icon: HeartHandshake, chip: "bg-destructive/20 text-destructive" },
    { to: "/subscriptions", label: "Subscriptions", detail: activeSubs > 0 ? `${activeSubs} active` : "Track recurring costs", icon: Repeat, chip: "bg-warning/25 text-warning-foreground" },
    { to: "/debts", label: "Debts", detail: "Balances and payoff", icon: Scale, chip: "bg-warning/25 text-warning-foreground" },
    { to: "/investments", label: "Investments", detail: "Portfolio", icon: TrendingUp, chip: "bg-success/20 text-success" },
    { to: "/stewardship", label: "Daily reflections", detail: "One thought a day", icon: NotebookPen, chip: "bg-warning/25 text-warning-foreground" },
    { to: "/advisor", label: "AI Advisor", detail: "Insights for you", icon: Sparkles, chip: "bg-destructive/20 text-destructive" },
    { to: "/goals", label: "Goals", detail: "Progress", icon: Target, chip: "bg-warning/25 text-warning-foreground" },
    { to: "/accounts", label: "Accounts", detail: "Balances and transfers", icon: Landmark, chip: "bg-success/20 text-success" },
    { to: "/family", label: "Family", detail: "Shared money, chores", icon: Users, chip: "bg-info/20 text-info" },
    { to: "/onboarding", label: "Message detection", detail: "M-PESA and bank alerts", icon: MessageSquareText, chip: "bg-success/20 text-success" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="More" />

      <div className="grid grid-cols-2 gap-3">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              className="rounded-3xl bg-card p-4 shadow-card transition active:scale-[0.98]"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${t.chip}`}>
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <div className="mt-3 text-[15px] font-bold leading-tight">{t.label}</div>
              <div className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{t.detail}</div>
            </Link>
          );
        })}

        <Link to="/settings" className="rounded-3xl bg-card p-4 shadow-card transition active:scale-[0.98]">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning/25 text-warning-foreground">
            <UserRound className="h-[18px] w-[18px]" />
          </span>
          <div className="mt-3 text-[15px] font-bold leading-tight">My Profile</div>
          <div className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
            {user?.email ?? "Account and preferences"}
          </div>
        </Link>
      </div>

      <button
        type="button"
        onClick={() => void signOut()}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-secondary py-3.5 text-[15px] font-semibold text-secondary-foreground active:scale-[0.99]"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );
}
