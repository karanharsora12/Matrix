import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/context/ThemeContext";
import { PRESET_ACCENTS } from "@/utils/themeColors";
import {
  Sun,
  Moon,
  Laptop,
  Check,
  Palette,
  RotateCcw,
  Sparkles,
  Layers,
  Sliders,
  CheckCircle2,
} from "lucide-react";

export interface ThemeSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ThemeSettingsModal: React.FC<ThemeSettingsModalProps> = ({
  open,
  onOpenChange,
}) => {
  const {
    mode,
    resolvedMode,
    accent,
    customColor,
    activeHex,
    setMode,
    setAccent,
    setCustomColor,
    resetDefaults,
  } = useTheme();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm transition-colors duration-200"
              style={{ backgroundColor: activeHex }}
            >
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Theme & Appearance
                <Badge
                  variant="outline"
                  className="text-[11px] font-semibold border-primary-action/30 text-primary-action capitalize"
                >
                  {resolvedMode} Mode
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Customize Matrix ERP interface mode, accent colors, and live appearance.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Section 1: Appearance Mode */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Interface Mode
              </Label>
              <span className="text-[11px] text-zinc-400">
                Current: <b className="capitalize text-zinc-700 dark:text-zinc-200">{mode}</b>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Light Mode Card */}
              <button
                type="button"
                onClick={() => setMode("light")}
                className={`relative flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border-2 transition-all duration-200 text-left ${
                  mode === "light"
                    ? "border-primary-action bg-primary-action/10 dark:bg-primary-action/15 shadow-sm"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-800/50 hover:bg-zinc-100/70 dark:hover:bg-zinc-800"
                }`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                  <Sun className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Light
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Clean & bright
                  </div>
                </div>
                {mode === "light" && (
                  <div
                    className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: activeHex }}
                  >
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                )}
              </button>

              {/* Dark Mode Card */}
              <button
                type="button"
                onClick={() => setMode("dark")}
                className={`relative flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border-2 transition-all duration-200 text-left ${
                  mode === "dark"
                    ? "border-primary-action bg-primary-action/10 dark:bg-primary-action/15 shadow-sm"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-800/50 hover:bg-zinc-100/70 dark:hover:bg-zinc-800"
                }`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
                  <Moon className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Dark
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Deep charcoal slate
                  </div>
                </div>
                {mode === "dark" && (
                  <div
                    className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: activeHex }}
                  >
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                )}
              </button>

              {/* System Mode Card */}
              <button
                type="button"
                onClick={() => setMode("system")}
                className={`relative flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border-2 transition-all duration-200 text-left ${
                  mode === "system"
                    ? "border-primary-action bg-primary-action/10 dark:bg-primary-action/15 shadow-sm"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-800/50 hover:bg-zinc-100/70 dark:hover:bg-zinc-800"
                }`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                  <Laptop className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    System
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Syncs with OS
                  </div>
                </div>
                {mode === "system" && (
                  <div
                    className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: activeHex }}
                  >
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Section 2: Accent Color Presets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Accent Color Themes
              </Label>
              <span className="text-[11px] text-zinc-400">
                Active: <b className="text-primary-action font-mono">{activeHex}</b>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PRESET_ACCENTS.map((preset) => {
                const isSelected = accent === preset.id;
                const swatchColor =
                  resolvedMode === "dark" ? preset.dark : preset.light;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setAccent(preset.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-primary-action bg-primary-action/15 dark:bg-primary-action/25 ring-1 ring-primary-action shadow-xs"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full shadow-inner transition-transform"
                      style={{ backgroundColor: swatchColor }}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {preset.name}
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Custom Accent Color Option */}
              <button
                type="button"
                onClick={() => setAccent("custom")}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                  accent === "custom"
                    ? "border-primary-action bg-primary-action/15 dark:bg-primary-action/25 ring-1 ring-primary-action shadow-xs"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full shadow-inner"
                  style={{ backgroundColor: customColor }}
                >
                  {accent === "custom" && (
                    <Check className="h-3.5 w-3.5 text-white stroke-[3]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    Custom Color
                  </div>
                </div>
              </button>
            </div>

            {/* Custom Color Input if Custom is selected */}
            {accent === "custom" && (
              <div className="mt-3 p-3.5 rounded-xl border border-primary-action/30 bg-primary-action/5 dark:bg-primary-action/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded-lg border border-zinc-300 p-0.5 bg-white dark:border-zinc-700 dark:bg-zinc-800"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Pick Accent Color
                    </Label>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      Select any custom brand color
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400">HEX:</span>
                  <Input
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    placeholder="#3B82A0"
                    className="h-8 w-24 text-xs font-mono text-center bg-white dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                    maxLength={7}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Live Interactive ERP Preview */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <Sparkles className="h-3.5 w-3.5 text-primary-action" />
              <span>Live Component Preview</span>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/70 p-4 space-y-3.5">
              {/* Mini ERP Layout Mockup */}
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 shadow-xs space-y-3">
                {/* Header Mockup */}
                <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800 text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: activeHex }}
                    >
                      M
                    </div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                      Matrix ERP
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                      style={{ backgroundColor: activeHex }}
                    >
                      Active
                    </span>
                    <div className="h-5 w-5 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                </div>

                {/* Body Mockup: Sidebar + Content */}
                <div className="grid grid-cols-12 gap-3 text-xs">
                  {/* Mini Sidebar */}
                  <div className="col-span-4 space-y-1 pr-2 border-r border-zinc-100 dark:border-zinc-800">
                    <div
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold text-white shadow-xs"
                      style={{ backgroundColor: activeHex }}
                    >
                      <Layers className="h-3 w-3" />
                      <span>Sales Orders</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      <Sliders className="h-3 w-3" />
                      <span>Inventory</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Repairing Bill</span>
                    </div>
                  </div>

                  {/* Mini Main Content Area */}
                  <div className="col-span-8 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                        Transaction Grid
                      </span>
                      <Button
                        size="sm"
                        className="h-6 text-[10px] px-2 text-white"
                        style={{ backgroundColor: activeHex }}
                      >
                        New Entry
                      </Button>
                    </div>

                    {/* Mini Data Row */}
                    <div
                      className="p-2 rounded-lg border flex items-center justify-between text-[11px]"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${activeHex} 8%, transparent)`,
                        borderColor: `color-mix(in srgb, ${activeHex} 30%, transparent)`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-sm flex items-center justify-center text-white text-[8px]"
                          style={{ backgroundColor: activeHex }}
                        >
                          ✓
                        </div>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          RB-2026-0042
                        </span>
                      </div>
                      <span className="font-bold font-mono" style={{ color: activeHex }}>
                        ₹14,500.00
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 px-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetDefaults}
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to Defaults
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs px-4 text-white"
            style={{ backgroundColor: activeHex }}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
