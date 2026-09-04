import apiClient from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import { ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function SubMenuPopup({ item }: { item: any }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const Icon =
    (LucideIcons as any)[item.menuIcon || "Circle"] || LucideIcons.Circle;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <div>
        <DropdownMenuTrigger asChild>
          <Link
            to={item.fullPath}
            className={cn(
              "flex items-center justify-center rounded-md px-0 py-2 text-sm font-medium transition-colors my-0.5",
              location.pathname === item.fullPath ||
                location.pathname.startsWith(item.fullPath + "/")
                ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
          </Link>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="right"
          align="start"
          sideOffset={14}
          className="w-52 bg-white dark:bg-zinc-950 shadow-xl"
        >
          <DropdownMenuLabel>{item.menuCaption}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.children.map((child: any) => {
            const ChildIcon =
              (LucideIcons as any)[child.menuIcon || "Circle"] ||
              LucideIcons.Circle;
            const childActive =
              location.pathname === child.fullPath ||
              location.pathname.startsWith(child.fullPath + "/");

            return (
              <DropdownMenuItem key={child.id} asChild>
                <a
                  href={child.fullPath}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2.5",
                    childActive ? "text-blue-600 dark:text-blue-400" : "",
                  )}
                >
                  <ChildIcon className="h-4 w-4" />
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

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [menus, setMenus] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const location = useLocation();

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

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderMenu = (item: any, depth = 0): React.ReactNode => {
    const isActive =
      location.pathname === item.fullPath ||
      location.pathname.startsWith(item.fullPath + "/");
    const isExpanded = expanded[item.id];
    const hasChildren = item.children && item.children.length > 0;
    const Icon =
      (LucideIcons as any)[item.menuIcon || "Circle"] || LucideIcons.Circle;

    if (collapsed && hasChildren) {
      return <SubMenuPopup key={item.id} item={item} />;
    }

    const link = (
      <Link
        to={item.fullPath}
        onClick={(e) => {
          if (hasChildren) {
            toggleExpand(item.id, e);
          }
        }}
        className={cn(
          "flex items-center justify-between rounded-md px-2.5 py-2 text-sm font-medium transition-colors my-0.5",
          collapsed && "justify-center px-0",
          isActive && !hasChildren
            ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white",
        )}
        style={{
          paddingLeft: collapsed ? undefined : `${depth * 1 + 0.625}rem`,
        }}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{item.menuCaption}</span>}
        </div>
        {!collapsed && hasChildren && (
          <ChevronRight
            className={cn(
              "h-4 w-4 transition-transform",
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
          <TooltipContent side="right">{item.menuCaption}</TooltipContent>
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
              "flex flex-col overflow-hidden transition-all duration-300",
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
    <aside
      className={cn(
        "flex flex-col border-r border-zinc-200 bg-white transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-900",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      <div
        className={cn(
          "relative flex h-14 items-center border-b border-zinc-200 dark:border-zinc-800",
          collapsed ? "justify-center px-0" : "px-4",
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <LucideIcons.Box className="h-6 w-6 shrink-0 text-blue-600" />
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

        <Button
          variant="outline"
          size="icon"
          className="absolute -right-3.5 top-3.5 z-50 h-7 w-7 shrink-0 rounded-full border border-zinc-200 bg-white text-zinc-400 hover:text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-300"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {menus.map((menu) => renderMenu(menu))}
      </nav>
    </aside>
  );
}
