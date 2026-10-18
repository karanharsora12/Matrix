import React from "react";
import { Calendar, Link2, Link2Off, Receipt } from "lucide-react";
import { DaybookSelect } from "@/components/common/DaybookSelect";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface VoucherReferenceConfig {
  label?: string;
  isLinked?: boolean;
  linkedTitle?: React.ReactNode;
  linkedSubtitle?: React.ReactNode;
  buttonText?: string;
  buttonIcon?: React.ReactNode;
  onSelect?: () => void;
  onUnlink?: () => void;
  unlinkTooltip?: string;
}

export interface VoucherDetailsCardProps {
  className?: string;
  readOnly?: boolean;
  title?: string;

  // Daybook
  daybookId?: number;
  menuKey?: string;
  daybookLabel?: string;
  daybookRequired?: boolean;
  onSelectDaybook?: (daybookId: number) => void;

  // Date
  voucherDate?: string;
  onChangeDate?: (date: string) => void;
  dateLabel?: string;
  dateRequired?: boolean;

  // Voucher No
  voucherNo?: string;
  voucherNoLabel?: string;
  voucherNoPlaceholder?: string;

  // Reference / Linked Voucher
  reference?: VoucherReferenceConfig;

  // Optional extensions
  children?: React.ReactNode;
}

export const VoucherDetailsCard: React.FC<VoucherDetailsCardProps> = ({
  className,
  readOnly = false,
  title = "Voucher Details",
  daybookId = 0,
  menuKey,
  daybookRequired = true,
  onSelectDaybook,
  voucherDate = "",
  onChangeDate,
  dateLabel = "Voucher Date",
  dateRequired = true,
  voucherNo = "",
  voucherNoLabel = "Voucher No.",
  voucherNoPlaceholder = "",
  reference,
  children,
}) => {
  return (
    <section
      className={cn(
        "rounded-xl border border-slate-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between",
        className,
      )}
    >
      <div>
        {/* ── Card Header ── */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Calendar className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
              {title}
            </h2>
          </div>
        </div>

        {/* ── Card Body ── */}
        <div className="p-4 space-y-3">
          {/* Daybook Dropdown */}
          <div>
            <DaybookSelect
              disabled={readOnly}
              value={daybookId}
              menuKey={menuKey}
              required={daybookRequired}
              autoSelectFirst={!daybookId}
              onChange={(id) => onSelectDaybook?.(id)}
            />
          </div>

          {/* Date & Voucher No Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                {dateLabel}{" "}
                {dateRequired && <span className="text-rose-500">*</span>}
              </Label>
              <div className="mt-1">
                <DatePicker
                  disabled={readOnly || !onChangeDate}
                  value={voucherDate}
                  onChange={(d) => onChangeDate?.(d)}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                {voucherNoLabel}
              </Label>
              <Input
                disabled
                value={voucherNo}
                placeholder={voucherNoPlaceholder}
                className="mt-1 h-9 bg-slate-50 font-mono text-xs text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
              />
            </div>
          </div>

          {reference && (
            <div className="pt-1 border-t border-slate-100 dark:border-zinc-800">
              <Label className="text-xs font-medium text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Link2 className="h-3.5 w-3.5 text-primary-action" />
                  {reference.label || "Receipt Reference"}
                </span>
                {reference.isLinked && !readOnly && reference.onUnlink && (
                  <button
                    type="button"
                    onClick={reference.onUnlink}
                    className="text-[10px] text-rose-500 hover:text-rose-700 flex items-center gap-0.5 transition-colors"
                    title={reference.unlinkTooltip || "Unlink reference"}
                  >
                    <Link2Off className="h-3 w-3" />
                    Unlink
                  </button>
                )}
              </Label>

              <div className="mt-1.5">
                {reference.isLinked ? (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/70 p-2 text-xs text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <span className="font-semibold">
                      {reference.linkedTitle}
                    </span>
                    {reference.linkedSubtitle && (
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        {reference.linkedSubtitle}
                      </span>
                    )}
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={readOnly}
                    onClick={reference.onSelect}
                    className="w-full h-8 text-xs font-medium text-slate-700 border-dashed border-slate-300 hover:border-primary-action hover:text-primary-action dark:border-zinc-700 dark:text-zinc-300"
                  >
                    {reference.buttonIcon || (
                      <Receipt className="h-3.5 w-3.5 mr-1.5 text-primary-action" />
                    )}
                    {reference.buttonText || "Select Reference"}
                  </Button>
                )}
              </div>
            </div>
          )}
          {children}
        </div>
      </div>
    </section>
  );
};

export default VoucherDetailsCard;
