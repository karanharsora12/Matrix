import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon, Laptop, Palette, Check } from "lucide-react";

export interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const { mode, resolvedMode, setMode, openSettings } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title={`Theme: ${mode} (${resolvedMode})`}
          className={`h-9 w-9 rounded-lg text-zinc-500 hover:bg-primary-action/10 hover:text-primary-action dark:text-zinc-400 dark:hover:bg-primary-action/15 dark:hover:text-primary-action transition-colors ${
            className || ""
          }`}
        >
          {resolvedMode === "dark" ? (
            <Moon className="h-4 w-4 transition-transform duration-200" />
          ) : (
            <Sun className="h-4 w-4 transition-transform duration-200" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm shadow-xl p-1.5"
      >
        <DropdownMenuLabel className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Appearance
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => setMode("light")}
          className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer text-zinc-700 dark:text-zinc-300 focus:bg-primary-action/10 focus:text-primary-action dark:focus:bg-primary-action/15 dark:focus:text-primary-action"
        >
          <span className="flex items-center gap-2">
            <Sun className="h-3.5 w-3.5" />
            <span>Light</span>
          </span>
          {mode === "light" && (
            <Check className="h-3.5 w-3.5 text-primary-action" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setMode("dark")}
          className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer text-zinc-700 dark:text-zinc-300 focus:bg-primary-action/10 focus:text-primary-action dark:focus:bg-primary-action/15 dark:focus:text-primary-action"
        >
          <span className="flex items-center gap-2">
            <Moon className="h-3.5 w-3.5" />
            <span>Dark</span>
          </span>
          {mode === "dark" && (
            <Check className="h-3.5 w-3.5 text-primary-action" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setMode("system")}
          className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer text-zinc-700 dark:text-zinc-300 focus:bg-primary-action/10 focus:text-primary-action dark:focus:bg-primary-action/15 dark:focus:text-primary-action"
        >
          <span className="flex items-center gap-2">
            <Laptop className="h-3.5 w-3.5" />
            <span>System</span>
          </span>
          {mode === "system" && (
            <Check className="h-3.5 w-3.5 text-primary-action" />
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1 bg-zinc-100 dark:bg-zinc-800" />
        <DropdownMenuItem
          onClick={openSettings}
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer text-zinc-700 dark:text-zinc-300 focus:bg-primary-action/10 focus:text-primary-action dark:focus:bg-primary-action/15 dark:focus:text-primary-action"
        >
          <Palette className="h-3.5 w-3.5 text-primary-action" />
          <span>Theme Settings...</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
