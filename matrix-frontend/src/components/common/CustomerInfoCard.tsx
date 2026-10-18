import React from "react";
import { FileSpreadsheet, User, UserCheck } from "lucide-react";
import { AccountHelp } from "@/components/common/AccountHelp";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface CustomerInfoCardProps {
  className?: string;
  readOnly?: boolean;
  title?: string;
  headerRight?: React.ReactNode;

  accountId?: number;
  accountName?: string;
  onSelectAccount?: (account: {
    id: number;
    accountName: string;
    [key: string]: any;
  }) => void;
  onClearAccount?: () => void;
  onOpenQuickAccount?: () => void;
  accountLabel?: string;
  accountPlaceholder?: string;
  required?: boolean;

  salesmanName?: string;
  onChangeSalesman?: (value: string) => void;
  salesmanLabel?: string;
  salesmanPlaceholder?: string;
  showSalesman?: boolean;

  reference?: string;
  onChangeReference?: (value: string) => void;
  referenceLabel?: string;
  referencePlaceholder?: string;
  showReference?: boolean;

  children?: React.ReactNode;
}

export const CustomerInfoCard: React.FC<CustomerInfoCardProps> = ({
  className,
  readOnly = false,
  title = "Customer Information",
  headerRight,
  accountName = "",
  onSelectAccount,
  onClearAccount,
  onOpenQuickAccount,
  accountLabel = "Customer Account",
  accountPlaceholder = "Search or select customer (F2)",
  required = true,
  salesmanName = "",
  onChangeSalesman,
  salesmanLabel = "Salesman / Attendant",
  salesmanPlaceholder = "Attendant name",
  showSalesman = true,
  reference = "",
  onChangeReference,
  referenceLabel = "Customer Reference / Tel",
  referencePlaceholder = "Job / Ref / Phone",
  showReference = true,
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
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <User className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
              {title}
            </h2>
          </div>
          {headerRight}
        </div>

        {/* ── Card Body ── */}
        <div className="p-4 space-y-3.5">
          {/* Account Selection */}
          <div>
            <Label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
              {accountLabel}{" "}
              {required && <span className="text-rose-500">*</span>}
            </Label>
            <div className="mt-1">
              {readOnly ? (
                <Input
                  disabled
                  value={accountName || "No customer selected"}
                  className="h-9 bg-slate-50 dark:bg-zinc-800 text-xs"
                />
              ) : (
                <AccountHelp
                  accountName={accountName}
                  placeholder={accountPlaceholder}
                  onSelect={(acc) => onSelectAccount?.(acc)}
                  onAddAccount={onOpenQuickAccount}
                  showAddButton={Boolean(onOpenQuickAccount)}
                  allowClear
                  onClear={onClearAccount}
                />
              )}
            </div>
          </div>

          {/* Salesman & Customer Reference */}
          {(showSalesman || showReference) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {showSalesman && (
                <div>
                  <Label className="text-xs font-medium text-slate-600 dark:text-zinc-400 flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                    {salesmanLabel}
                  </Label>
                  <Input
                    disabled={readOnly || !onChangeSalesman}
                    value={salesmanName}
                    placeholder={salesmanPlaceholder}
                    onChange={(e) => onChangeSalesman?.(e.target.value)}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              )}

              {showReference && (
                <div>
                  <Label className="text-xs font-medium text-slate-600 dark:text-zinc-400 flex items-center gap-1">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" />
                    {referenceLabel}
                  </Label>
                  <Input
                    disabled={readOnly || !onChangeReference}
                    value={reference}
                    placeholder={referencePlaceholder}
                    onChange={(e) => onChangeReference?.(e.target.value)}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              )}
            </div>
          )}

          {children}
        </div>
      </div>
    </section>
  );
};

export default CustomerInfoCard;
