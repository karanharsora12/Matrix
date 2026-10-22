import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { RootState } from "@/store";
import { logout } from "@/store/authSlice";
import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import { MobileSidebarTrigger } from "@/components/Sidebar";
import {
  LogOut,
  Palette,
  Settings,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ThemeSettingsModal } from "@/components/theme/ThemeSettingsModal";

import { GlobalMenuSearch } from "@/components/common/GlobalMenuSearch";

export function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const { isSettingsOpen, setIsSettingsOpen, openSettings } = useTheme();

  const [menus, setMenus] = useState<any[]>([]);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const response = await apiClient.post(API_ENDPOINTS.MENUS.BASE);
        setMenus(response.data);
      } catch (error) {
        console.error("Failed to fetch menus", error);
      }
    };
    fetchMenus();
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200/80 bg-white/95 px-4 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/95 sm:px-6">
      <div className="flex items-center gap-2">
        <MobileSidebarTrigger />
        <GlobalMenuSearch menus={menus} />
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="ml-1 gap-2 rounded-lg px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
            >
              <Avatar className="h-7 w-7 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary-action text-xs font-semibold text-white uppercase">
                  {user?.name?.substring(0, 2) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left lg:block">
                <p className="text-sm font-medium leading-none text-zinc-900 dark:text-white">
                  {user?.name || "User"}
                </p>
                <p className="text-xs leading-none text-zinc-500 dark:text-zinc-400">
                  Admin
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 rounded-xl border-zinc-200 dark:border-zinc-800"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">
                  {user?.name || "User"}
                </span>
                <span className="text-xs text-zinc-500 truncate">
                  {user?.email || ""}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
            <DropdownMenuItem className="rounded-lg focus:bg-primary-action/10 focus:text-primary-action cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={openSettings}
              className="rounded-lg focus:bg-primary-action/10 focus:text-primary-action cursor-pointer"
            >
              <Palette className="mr-2 h-4 w-4" />
              Theme Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg focus:bg-primary-action/10 focus:text-primary-action cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
            <DropdownMenuItem
              className="rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer"
              onClick={() => {
                dispatch(logout());
                navigate("/login");
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ThemeSettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </header>
  );
}
