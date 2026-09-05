import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Printer,
  RotateCcw,
  ArrowLeft,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FormFooterProps {
  // Save Action
  onSave?: () => void;
  saveText?: string;
  isSaveDisabled?: boolean;
  isSaving?: boolean;
  saveButtonClassName?: string;

  // Clear Action
  onClear?: () => void;
  clearText?: string;

  // Print Action
  onPrint?: () => void;
  printText?: string;

  // Tag Print Action
  onTagPrint?: () => void;
  tagPrintText?: string;

  // Delete Action
  onDelete?: () => void;
  deleteText?: string;
  isDeleting?: boolean;
  isDeleteDisabled?: boolean;

  // Back Action
  onBack?: () => void;
  backText?: string;

  // Voucher / Record Navigator
  showVoucherNavigation?: boolean;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  isPrevDisabled?: boolean;
  isNextDisabled?: boolean;

  // Active toggle (for master forms)
  showIsActive?: boolean;
  isActive?: boolean;
  onIsActiveChange?: (checked: boolean) => void;
  isActiveLabel?: string;

  // Slots for custom actions
  extraActions?: React.ReactNode;
  leftSlot?: React.ReactNode;

  className?: string;
}

export const FormFooter: React.FC<FormFooterProps> = ({
  onSave,
  onClear,
  onPrint,
  onTagPrint,
  onDelete,
  onBack,
  saveText = "Save",
  clearText = "Clear",
  printText = "Print",
  tagPrintText = "Tag Print",
  deleteText = "Delete",
  backText = "Back",
  isSaveDisabled = false,
  isSaving = false,
  isDeleting = false,
  isDeleteDisabled = false,
  showVoucherNavigation = false,
  onNavigatePrev,
  onNavigateNext,
  isPrevDisabled = false,
  isNextDisabled = false,
  showIsActive = false,
  isActive = true,
  onIsActiveChange,
  isActiveLabel = "Active",
  extraActions,
  leftSlot,
  className,
  saveButtonClassName,
}) => {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 mt-auto border-t border-slate-200/80 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80",
        "dark:border-zinc-800 dark:bg-zinc-900/95 dark:supports-[backdrop-filter]:bg-zinc-900/80",
        className,
      )}
    >
      <div className="flex w-full flex-col gap-3 px-6 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {(showVoucherNavigation || onNavigatePrev || onNavigateNext) && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                type="button"
                className="h-7 w-7"
                onClick={onNavigatePrev}
                disabled={!onNavigatePrev || isPrevDisabled}
                title="Previous Record"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                type="button"
                className="h-7 w-7"
                onClick={onNavigateNext}
                disabled={!onNavigateNext || isNextDisabled}
                title="Next Record"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* Active toggle */}
          {showIsActive && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="footer-is-active"
                checked={isActive}
                onChange={(e) => onIsActiveChange?.(Boolean(e.target.value))}
                className="h-4 w-4 rounded border-slate-300 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 text-white"
              />
              <Label
                htmlFor="footer-is-active"
                className="cursor-pointer select-none text-xs font-medium text-slate-700 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                {isActiveLabel}
              </Label>
            </div>
          )}

          {leftSlot}
        </div>

        {/* Right side: Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tag Print */}
          {onTagPrint && (
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={onTagPrint}
              className="gap-1.5 text-xs text-slate-700 dark:text-zinc-300"
            >
              <Tag className="h-3.5 w-3.5 text-amber-600" />
              <span>{tagPrintText}</span>
            </Button>
          )}

          {/* Print Invoice */}
          {onPrint && (
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={onPrint}
              className="gap-1.5 text-xs text-slate-700 dark:text-zinc-300"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>{printText}</span>
            </Button>
          )}

          {/* Extra custom actions */}
          {extraActions}

          {/* Delete Action */}
          {onDelete && (
            <Button
              size="sm"
              type="button"
              variant="outline"
              disabled={isDeleteDisabled || isDeleting}
              onClick={onDelete}
              className="gap-1.5 border-rose-200 text-xs text-rose-600 hover:bg-rose-50 hover:border-rose-300 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/30"
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span>{deleteText}</span>
            </Button>
          )}

          {/* Destructive/Reset action - Clear */}
          {onClear && (
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={onClear}
              className="gap-1.5 text-xs text-slate-700 dark:text-zinc-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{clearText}</span>
            </Button>
          )}

          {/* Navigation action - Back */}
          {onBack && (
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={onBack}
              className="gap-1.5 text-xs text-slate-700 dark:text-zinc-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{backText}</span>
            </Button>
          )}

          {/* Primary action - Save */}
          {onSave && (
            <Button
              size="sm"
              type="button"
              onClick={onSave}
              disabled={isSaveDisabled || isSaving}
              className={cn(
                "min-w-[130px] gap-2 bg-zinc-900 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200",
                saveButtonClassName,
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>{saveText}</span>
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
