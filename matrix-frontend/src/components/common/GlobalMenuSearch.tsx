import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import * as LucideIcons from "lucide-react";
import {
  Search,
  X,
  Clock,
  CornerDownLeft,
  ArrowRight,
  Compass,
} from "lucide-react";
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
  isOpen: boolean;
  onClose: () => void;
  menus: MenuItemNode[];
}

const RECENT_SEARCHES_KEY = "matrix_recent_menu_searches";
const MAX_RECENTS = 5;

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

// Quick fallback icon component
function MenuIcon({
  iconName,
  className,
}: {
  iconName?: string;
  className?: string;
}) {
  const IconComponent =
    (LucideIcons as any)[iconName || "Compass"] ||
    (LucideIcons as any)["Dot"] ||
    Compass;
  return <IconComponent className={cn("h-4 w-4 shrink-0", className)} />;
}

export const GlobalMenuSearch: React.FC<GlobalMenuSearchProps> = ({
  isOpen,
  onClose,
  menus,
}) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<FlattenedMenu[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Flatten all menu items
  const allSearchableMenus = useMemo(() => {
    return flattenMenusWithHierarchy(menus);
  }, [menus]);

  // Extract distinct top-level categories
  const categories = useMemo(() => {
    const cats = Array.from(
      new Set(allSearchableMenus.map((m) => m.rootCategory)),
    ).filter(Boolean);
    return ["All", ...cats];
  }, [allSearchableMenus]);

  // Filtered menu list based on query and category
  const filteredMenus = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allSearchableMenus.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" || item.rootCategory === selectedCategory;
      if (!matchesCategory) return false;

      if (!q) return true;

      const matchesCaption = item.menuCaption.toLowerCase().includes(q);
      const matchesName = item.menuName.toLowerCase().includes(q);
      const matchesBreadcrumb = item.breadcrumbs.some((b) =>
        b.toLowerCase().includes(q),
      );
      const matchesPath = item.fullPath.toLowerCase().includes(q);

      return matchesCaption || matchesName || matchesBreadcrumb || matchesPath;
    });
  }, [allSearchableMenus, query, selectedCategory]);

  // Popular quick links when query is empty
  const quickLinks = useMemo(() => {
    const popularTitles = [
      "Items",
      "Item Groups",
      "Repairing Receipt",
      "Repairing Bill",
      "Cash Receipt",
      "Cash Payment",
      "Accounts",
      "Daybooks",
    ];
    return allSearchableMenus.filter((m) =>
      popularTitles.includes(m.menuCaption),
    );
  }, [allSearchableMenus]);

  // Reset selected index when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCategory]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Save selected item to recent searches and navigate
  const handleSelect = useCallback(
    (item: FlattenedMenu) => {
      try {
        const nextRecents = [
          item,
          ...recentSearches.filter((r) => r.fullPath !== item.fullPath),
        ].slice(0, MAX_RECENTS);
        setRecentSearches(nextRecents);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(nextRecents));
      } catch (e) {
        console.error("Failed to save recent search", e);
      }

      onClose();
      navigate(item.fullPath);
    },
    [navigate, onClose, recentSearches],
  );

  const clearRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {}
  };

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
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
      onClose();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeElem = listRef.current.querySelector(
      `[data-menu-index="${selectedIndex}"]`,
    );
    if (activeElem) {
      activeElem.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-md transition-opacity" />

      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200/90 bg-white/95 shadow-2xl backdrop-blur-2xl transition-all duration-200 dark:border-zinc-800/90 dark:bg-zinc-900/95 dark:shadow-black/70 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Bar */}
        <div className="relative flex items-center border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-800/80">
          <Search className="h-5 w-5 text-primary-action shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search menus, features, transactions, or master..."
            className="flex-1 bg-transparent px-3 text-base font-medium text-zinc-900 placeholder-zinc-400 outline-none dark:text-zinc-100 dark:placeholder-zinc-500"
          />

          <div className="flex items-center gap-1.5 shrink-0">
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
                title="Clear query"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[11px] font-semibold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 shadow-sm">
              ESC
            </kbd>
          </div>
        </div>

        {/* Category Pills Bar */}
        {categories.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto border-b border-zinc-100 px-4 py-2 text-xs no-scrollbar dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "rounded-full px-2.5 py-1 font-medium transition-all text-xs shrink-0",
                    isSelected
                      ? "bg-primary-action text-white shadow-sm"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-400 dark:hover:bg-zinc-700",
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}

        {/* Results Area */}
        <div
          ref={listRef}
          className="max-h-[380px] overflow-y-auto p-2 scroll-smooth"
        >
          {/* Default State: When Query is Empty */}
          {!query.trim() && (
            <div className="space-y-4 p-2">
              {/* Recent Visits Section */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-2 pb-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      <Clock className="h-3.5 w-3.5" /> Recent Searches
                    </span>
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      className="text-[11px] font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((item) => (
                      <button
                        key={`recent-${item.id}-${item.fullPath}`}
                        type="button"
                        onClick={() => handleSelect(item)}
                        className="group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-all hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 group-hover:bg-primary-action/10 group-hover:text-primary-action dark:bg-zinc-800 dark:text-zinc-400 transition-colors">
                            <MenuIcon iconName={item.menuIcon} />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-zinc-800 group-hover:text-primary-action dark:text-zinc-200 transition-colors">
                              {item.menuCaption}
                            </div>
                            <div className="text-[11px] text-zinc-400 dark:text-zinc-500">
                              {item.breadcrumbs.slice(0, -1).join(" › ") ||
                                item.rootCategory}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-zinc-300 opacity-0 group-hover:opacity-100 group-hover:text-primary-action transition-all transform group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick / Popular Links */}
              {quickLinks.length > 0 && (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {quickLinks.map((item) => (
                      <button
                        key={`quick-${item.id}-${item.fullPath}`}
                        type="button"
                        onClick={() => handleSelect(item)}
                        className="group flex items-center justify-between rounded-xl border border-zinc-100/90 bg-zinc-50/50 p-2.5 text-left transition-all hover:border-primary-action/30 hover:bg-primary-action/5 hover:shadow-sm dark:border-zinc-800/60 dark:bg-zinc-800/40 dark:hover:bg-primary-action/10"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-zinc-600 shadow-xs group-hover:text-primary-action dark:bg-zinc-800 dark:text-zinc-300 transition-colors shrink-0">
                            <MenuIcon iconName={item.menuIcon} />
                          </div>
                          <div className="truncate">
                            <span className="block text-xs font-semibold text-zinc-800 group-hover:text-primary-action dark:text-zinc-200 truncate">
                              {item.menuCaption}
                            </span>
                            <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                              {item.rootCategory}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-zinc-300 group-hover:text-primary-action shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active Search Results */}
          {query.trim() && (
            <div className="space-y-1">
              {filteredMenus.length > 0 ? (
                filteredMenus.map((item, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <button
                      key={`filtered-${item.id}-${item.fullPath}`}
                      data-menu-index={index}
                      type="button"
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        "group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-all duration-150",
                        isSelected
                          ? "bg-primary-action/10 text-primary-action dark:bg-primary-action/20 dark:text-white ring-1 ring-primary-action/40 shadow-xs"
                          : "text-zinc-700 hover:bg-zinc-100/70 dark:text-zinc-300 dark:hover:bg-zinc-800/50",
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg transition-colors shrink-0",
                            isSelected
                              ? "bg-primary-action text-white shadow-xs"
                              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 group-hover:text-primary-action",
                          )}
                        >
                          <MenuIcon
                            iconName={item.menuIcon}
                            className="h-4 w-4"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "text-sm font-semibold truncate",
                                isSelected
                                  ? "text-primary-action dark:text-white"
                                  : "text-zinc-900 dark:text-zinc-100",
                              )}
                            >
                              {item.menuCaption}
                            </span>
                            <span className="rounded-sm bg-zinc-100 px-1.5 py-0.2 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                              {item.rootCategory}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                            {item.breadcrumbs.join(" › ")}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {isSelected && (
                          <span className="hidden sm:inline-flex items-center gap-1 rounded bg-primary-action/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary-action dark:bg-primary-action/30 dark:text-primary-action">
                            Select <CornerDownLeft className="h-3 w-3" />
                          </span>
                        )}
                        <ArrowRight
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isSelected
                              ? "text-primary-action translate-x-0.5"
                              : "text-zinc-300 opacity-0 group-hover:opacity-100",
                          )}
                        />
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-3">
                    <Search className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    No results found
                  </h3>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs mx-auto">
                    We couldn't find any menu matching &ldquo;{query}&rdquo;.
                    Check for typos or try selecting a different category.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
