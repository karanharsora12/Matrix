import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MenuItemNode {
  id: number;
  menuName: string;
  menuCaption: string;
  menuIcon?: string;
  menuPath?: string;
  fullPath: string;
  children?: MenuItemNode[];
  [key: string]: any;
}

export interface FlattenedMenu {
  id: number;
  menuName: string;
  menuCaption: string;
  menuIcon?: string;
  fullPath: string;
  rootCategory: string;
  breadcrumbs: string[];
}

interface GlobalMenuSearchProps {
  menus: MenuItemNode[];
  className?: string;
}

// Helper to flatten nested menus with breadcrumbs and root categories
function flattenMenusWithHierarchy(
  menuList: MenuItemNode[],
  parentBreadcrumbs: string[] = [],
  rootCat?: string,
): FlattenedMenu[] {
  let result: FlattenedMenu[] = [];

  for (const menu of menuList) {
    const currentBreadcrumbs = [...parentBreadcrumbs, menu.menuCaption];
    const category = rootCat || menu.menuCaption;

    if (menu.children && menu.children.length > 0) {
      result = [
        ...result,
        ...flattenMenusWithHierarchy(
          menu.children,
          currentBreadcrumbs,
          category,
        ),
      ];
    } else if (menu.fullPath) {
      result.push({
        id: menu.id,
        menuName: menu.menuName,
        menuCaption: menu.menuCaption,
        menuIcon: menu.menuIcon,
        fullPath: menu.fullPath,
        rootCategory: category,
        breadcrumbs: currentBreadcrumbs,
      });
    }
  }

  return result;
}

function getInitials(caption: string): string {
  if (!caption) return "M";
  const words = caption.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return caption.slice(0, 2).toUpperCase();
}

export const GlobalMenuSearch: React.FC<GlobalMenuSearchProps> = ({
  menus,
  className,
}) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Flatten all searchable menus
  const allSearchableMenus = useMemo(() => {
    return flattenMenusWithHierarchy(menus);
  }, [menus]);

  // Filtered menu list based on search query
  const filteredMenus = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return allSearchableMenus;
    }
    return allSearchableMenus.filter((item) => {
      const matchesCaption = item.menuCaption.toLowerCase().includes(q);
      const matchesName = item.menuName.toLowerCase().includes(q);
      const matchesBreadcrumb = item.breadcrumbs.some((b) =>
        b.toLowerCase().includes(q),
      );
      const matchesPath = item.fullPath.toLowerCase().includes(q);
      return matchesCaption || matchesName || matchesBreadcrumb || matchesPath;
    });
  }, [allSearchableMenus, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle menu item selection
  const handleSelect = useCallback(
    (item: FlattenedMenu) => {
      setIsOpen(false);
      setQuery("");
      inputRef.current?.blur();
      navigate(item.fullPath);
    },
    [navigate],
  );

  // Keyboard navigation inside input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredMenus.length === 0 ? 0 : (prev + 1) % filteredMenus.length,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredMenus.length === 0
          ? 0
          : (prev - 1 + filteredMenus.length) % filteredMenus.length,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredMenus[selectedIndex]) {
        handleSelect(filteredMenus[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Scroll active item into view during arrow key navigation
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const activeElem = listRef.current.querySelector(
      `[data-menu-index="${selectedIndex}"]`,
    );
    if (activeElem) {
      activeElem.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, isOpen]);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-60 sm:w-72 md:w-80", className)}
    >
      {/* Search Input Bar */}
      <div className="relative flex items-center w-full">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search menu..."
          className="h-9 w-full rounded-xl border border-zinc-200/90 bg-zinc-50/80 pl-9 pr-8 text-sm text-zinc-900 placeholder:text-zinc-400 transition-all hover:bg-white focus:border-primary-action/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-action/20 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:bg-zinc-800 dark:focus:border-primary-action/50 dark:focus:bg-zinc-900"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            title="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Simple, User-Friendly Dropdown (Width Matches Input Exactly) */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 w-full rounded-xl border border-zinc-200/90 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 z-50 overflow-hidden">
          <div
            ref={listRef}
            className="max-h-[320px] overflow-y-auto p-1.5 scroll-smooth"
          >
            {filteredMenus.length > 0 ? (
              filteredMenus.map((item, index) => {
                const isSelected = index === selectedIndex;
                const pathText =
                  item.breadcrumbs.length > 1
                    ? item.breadcrumbs.slice(0, -1).join(" › ")
                    : item.rootCategory;

                return (
                  <button
                    key={`menu-${item.id}-${item.fullPath}`}
                    data-menu-index={index}
                    type="button"
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "group flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors",
                      isSelected
                        ? "bg-primary-action/10 text-primary-action dark:bg-primary-action/20"
                        : "text-zinc-700 hover:bg-zinc-100/80 dark:text-zinc-300 dark:hover:bg-zinc-800/60",
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-md shrink-0 text-[11px] font-bold tracking-wide transition-colors",
                          isSelected
                            ? "bg-primary-action text-white"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 group-hover:bg-primary-action/15 group-hover:text-primary-action",
                        )}
                      >
                        {getInitials(item.menuCaption)}
                      </div>

                      <div className="min-w-0">
                        <div
                          className={cn(
                            "text-xs font-medium truncate",
                            isSelected
                              ? "text-primary-action dark:text-white"
                              : "text-zinc-800 dark:text-zinc-200",
                          )}
                        >
                          {item.menuCaption}
                        </div>
                        {pathText && (
                          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                            {pathText}
                          </div>
                        )}
                      </div>
                    </div>

                    <ChevronRight
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-transform",
                        isSelected
                          ? "text-primary-action opacity-100 translate-x-0.5"
                          : "text-zinc-300 opacity-0 group-hover:opacity-100",
                      )}
                    />
                  </button>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
                <p className="font-medium">No menu found</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Try searching with another keyword
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
