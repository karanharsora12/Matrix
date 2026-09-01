import { Outlet, useLocation } from "react-router-dom";
import {
  Settings,
  Search,
  Bell,
  HelpCircle,
  LogOut,
  User,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/Sidebar";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/settings": "Settings",
};

export default function ERPLaoyut() {
  const location = useLocation();

  const currentTitle =
    pageTitles[location.pathname] ||
    location.pathname.split("/").pop() ||
    "Dashboard";

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/80 px-4 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:px-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-9 w-9 lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
              <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                {currentTitle}
              </span>
            </div>

            <div className="hidden sm:block">
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
              <Button
                variant="ghost"
                size="icon"
                className="hidden h-9 w-9 sm:inline-flex"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="ml-1 gap-2 px-2 py-1.5">
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
                      <span className="text-sm font-medium">Rajesh Kumar</span>
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

          <main className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
