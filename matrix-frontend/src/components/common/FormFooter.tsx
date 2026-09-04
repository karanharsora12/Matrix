import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Printer, RotateCcw, ArrowLeft, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FormFooterProps {
  onSave?: () => void;
  onClear?: () => void;
  onPrint?: () => void;
  onBack?: () => void;

  saveText?: string;
  clearText?: string;
  printText?: string;
  backText?: string;

  isSaveDisabled?: boolean;
  isSaving?: boolean;

  showIsActive?: boolean;
  isActive?: boolean;
  onIsActiveChange?: (checked: boolean) => void;
  isActiveLabel?: string;

  className?: string;
  saveButtonClassName?: string;
}

export const FormFooter: React.FC<FormFooterProps> = ({
  onSave,
  onClear,
  onPrint,
  onBack,
  saveText = "Save",
  clearText = "Clear",
  printText = "Print",
  backText = "Back",
  isSaveDisabled = false,
  isSaving = false,
  showIsActive = false,
  isActive = true,
  onIsActiveChange,
  isActiveLabel = "Active",
  className,
  saveButtonClassName,
}) => {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 border-t border-slate-200 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60",
        "dark:border-slate-800 dark:bg-slate-900/80 dark:supports-[backdrop-filter]:bg-slate-900/60",
        className,
      )}
    >
      <div className="flex w-full flex-col gap-3 px-6 py-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Left side - Active toggle */}
        <div className="flex items-center">
          {showIsActive && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="footer-is-active"
                checked={isActive}
                onChange={(e) => onIsActiveChange?.(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 text-white"
              />
              <Label
                htmlFor="footer-is-active"
                className="cursor-pointer select-none text-sm font-medium text-slate-700 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                {isActiveLabel}
              </Label>
            </div>
          )}
        </div>

        {/* Right side - Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Secondary actions - Print */}
          {onPrint && (
            <Button
              type="button"
              variant="outline"
              onClick={onPrint}
              className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:border-slate-600"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">{printText}</span>
            </Button>
          )}

          {/* Navigation action - Back */}
          {onBack && (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:border-slate-600"
            >
              <ArrowLeft className="h-4 w-4" />
              {backText}
            </Button>
          )}

          {/* Destructive/Reset action - Clear */}
          {onClear && (
            <Button
              type="button"
              variant="outline"
              onClick={onClear}
              className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:border-slate-600"
            >
              <RotateCcw className="h-4 w-4" />
              {clearText}
            </Button>
          )}

          {/* Primary action - Save */}
          {onSave && (
            <Button
              type="button"
              onClick={onSave}
              disabled={isSaveDisabled || isSaving}
              className={cn(
                "min-w-[120px] gap-2 bg-zinc-900 text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md",
                "dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200",
                "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
                saveButtonClassName,
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {saveText}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormFooter;
