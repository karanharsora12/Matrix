import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import {
  Box,
  Building2,
  LayoutDashboard,
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  Briefcase,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  HelpCircle,
  LogOut,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Sales", icon: TrendingUp, href: "/sales" },
  { label: "Purchases", icon: ShoppingCart, href: "/purchases" },
  { label: "Inventory", icon: Package, href: "/inventory" },
  { label: "Customers", icon: Users, href: "/customers" },
  { label: "Finance", icon: DollarSign, href: "/finance" },
  { label: "HR", icon: Briefcase, href: "/hr" },
  { label: "Reports", icon: BarChart3, href: "/reports" },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/sales": "Sales",
  "/purchases": "Purchases",
  "/inventory": "Inventory",
  "/customers": "Customers",
  "/finance": "Finance",
  "/hr": "HR",
  "/reports": "Reports",
  "/settings": "Settings",
};

export default function ERPLaoyut() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const currentTitle =
    pageTitles[location.pathname] ||
    location.pathname.split("/").pop() ||
    "Dashboard";

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen overflow-hidden">
        <aside
          className={cn(
            "flex flex-col border-r border-zinc-200 bg-white transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-900",
            collapsed ? "w-[72px]" : "w-[260px]"
          )}
        >
          <div className="flex h-14 items-center gap-2 border-b border-zinc-200 px-4 dark:border-zinc-800">
            <Box className="h-6 w-6 shrink-0 text-blue-600" />
            {!collapsed && (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                  MATRIX
                </span>
                <Badge
                  variant="secondary"
                  className="h-5 px-1.5 text-[10px] font-medium"
                >
                  ERP
                </Badge>
              </div>
            )}
          </div>

          <div className="px-3 py-3">
            <button
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
                collapsed && "justify-center px-0"
              )}
            >
              <Building2 className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <span className="truncate">Acme Corporation</span>
              )}
            </button>
          </div>

          <nav className="flex-1 space-y-0.5 px-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              const link = (
                <a
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                    collapsed && "justify-center px-0",
                    isActive
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </a>
              );

              return collapsed ? (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              ) : (
                <div key={item.href}>{link}</div>
              );
            })}
          </nav>

          <div className="mt-auto space-y-0.5 px-3 pb-3">
            {(() => {
              const settingsLink = (
                <a
                  href="/settings"
                  className={cn(
                    "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                    collapsed && "justify-center px-0",
                    location.pathname === "/settings"
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                  )}
                >
                  <Settings className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>Settings</span>}
                </a>
              );

              return collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>{settingsLink}</TooltipTrigger>
                  <TooltipContent side="right">Settings</TooltipContent>
                </Tooltip>
              ) : (
                <div>{settingsLink}</div>
              );
            })()}

            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white",
                collapsed && "px-0"
              )}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </aside>

        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/80 px-6 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
            <span className="text-sm font-semibold text-zinc-900 dark:text-white">
              {currentTitle}
            </span>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  placeholder="Search..."
                  className="h-9 w-64 pl-9 text-sm"
                  readOnly
                />
                <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800">
                  ⌘K
                </kbd>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <HelpCircle className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="ml-1 gap-2 px-2 py-1.5"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-blue-600 text-xs text-white">
                        RK
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden text-left lg:block">
                      <p className="text-sm font-medium leading-none text-zinc-900 dark:text-white">
                        Rajesh Kumar
                      </p>
                      <p className="text-xs leading-none text-zinc-500 dark:text-zinc-400">
                        Admin
                      </p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">
                        Rajesh Kumar
                      </span>
                      <span className="text-xs text-zinc-500">
                        rajesh@acme.com
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 via-white to-slate-100 p-6 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
