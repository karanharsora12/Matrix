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
            <Button size="sm" type="button" variant="outline" onClick={onPrint}>
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">{printText}</span>
            </Button>
          )}

          {/* Navigation action - Back */}
          {onBack && (
            <Button size="sm" type="button" variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
              {backText}
            </Button>
          )}

          {/* Destructive/Reset action - Clear */}
          {onClear && (
            <Button size="sm" type="button" variant="outline" onClick={onClear}>
              <RotateCcw className="h-4 w-4" />
              {clearText}
            </Button>
          )}

          {/* Primary action - Save */}
          {onSave && (
            <Button
              size="sm"
              type="button"
              onClick={onSave}
              disabled={isSaveDisabled || isSaving}
              className={cn(saveButtonClassName)}
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
