import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import { ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import {
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
} from "react";
import { Link, useLocation } from "react-router-dom";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const COLLAPSED_WIDTH = 60;
const EXPANDED_WIDTH = 240;

interface SidebarContextType {
  collapsed: boolean;
  toggleCollapsed: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  toggleCollapsed: () => {},
  mobileOpen: false,
  setMobileOpen: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

function SubMenuPopup({ item }: { item: any }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const Icon = (LucideIcons as any)[item.menuIcon || "Dot"] || LucideIcons.Dot;

  const isActive =
    location.pathname === item.fullPath ||
    location.pathname.startsWith(item.fullPath + "/");

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <div>
        <DropdownMenuTrigger asChild>
          <Link
            to={item.fullPath}
            className={cn(
              "group relative flex items-center justify-center rounded-lg py-2 transition-all duration-200 my-0.5",
              isActive
                ? "bg-primary-action/10 text-primary-action dark:bg-primary-action/15 dark:text-primary-action"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-white",
            )}
          >
            <Icon
              className="h-[18px] w-[18px] shrink-0"
              strokeWidth={isActive ? 2.2 : 1.8}
            />
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary-action" />
            )}
          </Link>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="right"
          align="start"
          sideOffset={10}
          className="w-52 rounded-xl border-zinc-200 bg-white/95 shadow-xl backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/95"
        >
          <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {item.menuCaption}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
          {item.children.map((child: any) => {
            const ChildIcon =
              (LucideIcons as any)[child.menuIcon || "Dot"] || LucideIcons.Dot;
            const childActive =
              location.pathname === child.fullPath ||
              location.pathname.startsWith(child.fullPath + "/");

            return (
              <DropdownMenuItem key={child.id} asChild>
                <a
                  href={child.fullPath}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                    childActive
                      ? "bg-primary-action/10 text-primary-action dark:bg-primary-action/15 dark:text-primary-action"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
                  )}
                >
                  <ChildIcon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                  <span>{child.menuCaption}</span>
                </a>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </div>
    </DropdownMenu>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const [menus, setMenus] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const { collapsed } = useSidebar();

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

  const toggleExpand = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const renderMenu = (item: any, depth = 0): React.ReactNode => {
    const isActive =
      location.pathname === item.fullPath ||
      location.pathname.startsWith(item.fullPath + "/");
    const isExpanded = expanded[item.id];
    const hasChildren = item.children && item.children.length > 0;
    const Icon =
      (LucideIcons as any)[item.menuIcon || "Dot"] || LucideIcons.Dot;

    if (collapsed && hasChildren) {
      return <SubMenuPopup key={item.id} item={item} />;
    }

    const link = (
      <Link
        to={item.fullPath}
        onClick={(e) => {
          if (hasChildren) {
            toggleExpand(item.id, e);
          } else {
            onNavigate?.();
          }
        }}
        className={cn(
          "group relative flex items-center justify-between rounded-lg px-2.5 py-[7px] text-[13px] font-medium transition-all duration-200 my-[2px]",
          collapsed && "justify-center px-0 py-2",
          isActive && !hasChildren
            ? "bg-primary-action/10 text-primary-action dark:bg-primary-action/15 dark:text-primary-action"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-white",
        )}
        style={{
          paddingLeft: collapsed ? undefined : `${depth * 0.875 + 0.625}rem`,
        }}
      >
        {isActive && !hasChildren && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary-action" />
        )}
        <div className="flex items-center gap-2.5 overflow-hidden">
          <Icon
            className={cn(
              "shrink-0 transition-all duration-200",
              !item.menuIcon ? "h-5 w-5 -ml-0.5 -mr-0.5" : "h-[18px] w-[18px]",
              isActive ? "text-primary-action" : "",
            )}
            strokeWidth={!item.menuIcon ? 2.5 : 1.8}
          />
          {!collapsed && <span className="truncate">{item.menuCaption}</span>}
        </div>
        {!collapsed && hasChildren && (
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-transform duration-200 text-zinc-400",
              isExpanded ? "rotate-90" : "",
            )}
          />
        )}
      </Link>
    );

    const renderedItem =
      collapsed && !hasChildren ? (
        <Tooltip key={item.id}>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent
            side="right"
            sideOffset={8}
            className="rounded-lg border-zinc-200 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white dark:border-zinc-700 dark:bg-zinc-800"
          >
            {item.menuCaption}
          </TooltipContent>
        </Tooltip>
      ) : (
        <div key={item.id}>{link}</div>
      );

    return (
      <div key={item.id}>
        {renderedItem}
        {hasChildren && !collapsed && (
          <div
            className={cn(
              "flex flex-col overflow-hidden transition-all duration-200",
              isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0",
            )}
          >
            {item.children.map((child: any) => renderMenu(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="flex-1 overflow-y-auto px-2 py-1.5">
      {menus.map((menu) => renderMenu(menu))}
    </nav>
  );
}

function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center border-b border-zinc-100 dark:border-zinc-800/80 transition-all duration-300",
        collapsed ? "h-12 justify-center px-0" : "h-12 px-3.5",
      )}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-action">
          <LucideIcons.Box className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <span className="text-[15px] font-bold tracking-tight text-zinc-900 dark:text-white">
            MATRIX
          </span>
        )}
      </div>
    </div>
  );
}

function SidebarCollapseButton() {
  const { collapsed, toggleCollapsed } = useSidebar();

  return (
    <div className="flex items-center border-t border-zinc-100 dark:border-zinc-800/80 px-2 py-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full gap-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors duration-200",
              collapsed && "justify-center px-0",
            )}
            onClick={toggleCollapsed}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            ) : (
              <>
                <PanelLeftClose
                  className="h-4 w-4 shrink-0"
                  strokeWidth={1.8}
                />
                <span className="text-xs font-medium">Collapse</span>
              </>
            )}
          </Button>
        </TooltipTrigger>
        {collapsed && (
          <TooltipContent
            side="right"
            sideOffset={8}
            className="rounded-lg border-zinc-200 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white dark:border-zinc-700 dark:bg-zinc-800"
          >
            Expand sidebar
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  );
}

function SidebarDesktop() {
  const { collapsed } = useSidebar();

  return (
    <aside
      className="hidden md:flex flex-col border-r border-zinc-100 bg-white transition-[width] duration-300 ease-in-out dark:border-zinc-800/80 dark:bg-zinc-900"
      style={{ width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
    >
      <SidebarBrand collapsed={collapsed} />
      <SidebarNav />
      <SidebarCollapseButton />
    </aside>
  );
}

function SidebarMobile() {
  const { mobileOpen, setMobileOpen } = useSidebar();

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent
        side="left"
        className="w-[260px] p-0 border-zinc-100 dark:border-zinc-800/80"
      >
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SidebarBrand collapsed={false} />
        <SidebarNav onNavigate={() => setMobileOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

export function Sidebar() {
  return (
    <>
      <SidebarDesktop />
      <SidebarMobile />
    </>
  );
}

export function MobileSidebarTrigger() {
  const { setMobileOpen } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden h-9 w-9"
      onClick={() => setMobileOpen(true)}
    >
      <PanelLeftOpen className="h-5 w-5" strokeWidth={1.8} />
    </Button>
  );
}
