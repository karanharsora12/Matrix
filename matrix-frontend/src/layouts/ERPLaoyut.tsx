import { Header } from "@/components/Header";
import { Sidebar, SidebarContext } from "@/components/Sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Outlet } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";

export default function ERPLaoyut() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("matrix-sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("matrix-sidebar-collapsed", String(next));
      } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        toggleCollapsed();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleCollapsed]);

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarContext.Provider
        value={{ collapsed, toggleCollapsed, mobileOpen, setMobileOpen }}
      >
        <div className="flex h-screen overflow-hidden">
          <Sidebar />

          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />

            <main className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarContext.Provider>
    </TooltipProvider>
  );
}
