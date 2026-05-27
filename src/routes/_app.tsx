import { createFileRoute, Outlet, Navigate, Link, useRouterState } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/salary": "Salary Breakdown",
  "/insights": "Insights",
  "/advisor": "AI Advisor",
  "/income": "Income",
  "/budgets": "Budgets",
  "/expenses": "Expenses",
  "/subscriptions": "Subscriptions",
  "/debts": "Debts",
  "/accounts": "Accounts",
  "/investments": "Investments",
  "/goals": "Goals",
  "/stewardship": "Stewardship",
  "/settings": "Settings",
};

function AppLayout() {
  const { user, loading, signOut } = useAuth();
  const path = useRouterState({ select: (r) => r.location.pathname });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-sm font-semibold">{TITLES[path] ?? "Nuru Steward"}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/settings">{user.email?.split("@")[0]}</Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 md:px-8">
            <div className="mx-auto w-full max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
