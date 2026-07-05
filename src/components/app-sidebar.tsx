import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Wallet, Receipt, TrendingUp, Target, BookOpen, Sparkles,
  UserCircle, Sprout, Landmark, Repeat, CreditCard, Coins, Bot, History, CalendarDays, FileText, Church, Crown,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { useProfile } from "@/lib/queries";

const overview = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Calendar", url: "/calendar", icon: CalendarDays },
  { title: "Insights", url: "/insights", icon: Sparkles },
  { title: "AI Advisor", url: "/advisor", icon: Bot },
  { title: "History", url: "/history", icon: History },
  { title: "Statements", url: "/statements", icon: FileText },
] as const;

const money = [
  { title: "Income", url: "/income-entries", icon: Coins },
  { title: "Budgets", url: "/budgets", icon: Wallet },
  { title: "Expenses", url: "/expenses", icon: Receipt },
  { title: "Charity & Giving", url: "/giving", icon: Church },
  { title: "Subscriptions", url: "/subscriptions", icon: Repeat },
  { title: "Debts", url: "/debts", icon: CreditCard },
] as const;

const wealth = [
  { title: "Accounts", url: "/accounts", icon: Landmark },
  { title: "Investments", url: "/investments", icon: TrendingUp },
  { title: "Goals", url: "/goals", icon: Target },
  { title: "Stewardship", url: "/stewardship", icon: BookOpen },
] as const;

export function AppSidebar() {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const collapsed = !isMobile && state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const profile = useProfile();
  const familyEnabled = !!profile.data?.family_plan_enabled;

  const closeAfterNav = () => {
    if (isMobile) setOpenMobile(false);
  };

  const renderGroup = (label: string, items: ReadonlyArray<{ title: string; url: string; icon: typeof LayoutDashboard }>) => (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={path === item.url}>
                <Link to={item.url} onClick={closeAfterNav} className="flex items-center gap-3">
                  <item.icon className="h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/dashboard" onClick={closeAfterNav} className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-card">
            <Sprout className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-semibold">Fanika</div>
              <div className="text-[11px] text-muted-foreground">Stewardship</div>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Overview", overview)}
        {renderGroup("Money", money)}
        {renderGroup("Wealth", wealth)}
        {familyEnabled && (
          <SidebarGroup>
            <SidebarGroupLabel>Family</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={path === "/family"}>
                    <Link to="/family" onClick={closeAfterNav} className="flex items-center gap-3">
                      <Crown className="h-4 w-4 text-[oklch(0.7_0.15_60)]" />
                      {!collapsed && <span>Family Hub</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={path === "/settings"}>
                  <Link to="/settings" onClick={closeAfterNav} className="flex items-center gap-3">
                    <UserCircle className="h-4 w-4" />
                    {!collapsed && <span>My Profile</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
