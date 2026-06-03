import { createFileRoute, Outlet, Navigate, Link, useRouterState } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileTabBar } from "@/components/mobile-tabbar";
import { AIChatbot } from "@/components/ai-chatbot";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/calendar": "Calendar",
  "/insights": "Insights",
  "/advisor": "AI Advisor",
  "/history": "History",
  "/statements": "Statements",
  "/income-entries": "Income",
  "/budgets": "Budgets",
  "/expenses": "Expenses",
  "/tithe": "Tithe",
  "/subscriptions": "Subscriptions",
  "/debts": "Debts",
  "/accounts": "Accounts",
  "/investments": "Investments",
  "/goals": "Goals",
  "/stewardship": "Stewardship",
  "/settings": "My Profile",
};

function AppLayout() {
  const { user, loading, signOut } = useAuth();
  const profile = useProfile();
  const path = useRouterState({ select: (r) => r.location.pathname });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;

  const handle = profile.data?.username || profile.data?.full_name?.split(" ")[0] || user.email?.split("@")[0];

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-3 backdrop-blur md:px-4">
            <div className="flex items-center gap-2 md:gap-3">
              <SidebarTrigger />
              <h1 className="text-sm font-semibold">{TITLES[path] ?? "Nuru Steward"}</h1>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <Button asChild variant="ghost" size="sm" className="max-w-[140px] truncate">
                <Link to="/settings">@{handle}</Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 px-3 pt-4 pb-24 md:px-8 md:pt-6 md:pb-8">
            <div className="mx-auto w-full max-w-7xl">
              <Outlet />
            </div>
          </main>
          <MobileTabBar />
          <AIChatbot />
        </div>
      </div>
    </SidebarProvider>
  );
}
