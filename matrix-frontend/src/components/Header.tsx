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
import { Input } from "@/components/ui/input";
import type { RootState } from "@/store";
import { logout } from "@/store/authSlice";
import apiClient from "@/api/client";
import { Bell, HelpCircle, LogOut, Search, Settings, User } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  const [menus, setMenus] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const response = await apiClient.get("/menus");
        setMenus(response.data);
      } catch (error) {
        console.error("Failed to fetch menus", error);
      }
    };
    fetchMenus();
  }, []);

  const flattenMenus = (menuList: any[]): any[] => {
    let result: any[] = [];
    for (const menu of menuList) {
      if (menu.children && menu.children.length > 0) {
        result = [...result, ...flattenMenus(menu.children)];
      } else {
        result.push(menu);
      }
    }
    return result;
  };

  const searchableMenus = flattenMenus(menus);
  const filteredMenus = searchableMenus.filter((menu) =>
    menu.menuCaption.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsSearchOpen(true);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/80 px-4 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:px-6">
      <div className="hidden sm:block">
        <div className="relative" ref={searchRef}>
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            ref={inputRef}
            placeholder="Search menus..."
            className="h-9 w-64 pl-9 text-sm"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800">
            ⌘K
          </kbd>

          {isSearchOpen && searchQuery && (
            <div className="absolute top-full left-0 mt-2 w-64 rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950 max-h-64 overflow-y-auto">
              {filteredMenus.length > 0 ? (
                <div className="py-1">
                  {filteredMenus.map((menu) => (
                    <button
                      key={menu.id}
                      className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      onClick={() => {
                        navigate(menu.fullPath);
                        setIsSearchOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      {menu.menuCaption}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 text-sm text-zinc-500 text-center">
                  No results found.
                </div>
              )}
            </div>
          )}
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
                <AvatarFallback className="bg-blue-600 text-xs text-white uppercase">
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
          <DropdownMenuContent align="end" className="w-48">
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
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 cursor-pointer"
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
    </header>
  );
}
