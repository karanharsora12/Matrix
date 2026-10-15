import React from "react";
import {
  Calendar,
  FileSpreadsheet,
  MessageSquareText,
  User,
  UserCheck,
} from "lucide-react";
import { AccountHelp } from "@/components/common/AccountHelp";
import { DaybookSelect } from "@/components/common/DaybookSelect";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RepairingReceiptFormData } from "../types";

interface CustomerOrderDetailsCardProps {
  readOnly: boolean;
  form: RepairingReceiptFormData;
  onChangeForm: React.Dispatch<React.SetStateAction<RepairingReceiptFormData>>;
  onOpenQuickAccount: () => void;
  onSelectDaybook?: (daybookId: number) => void;
}

export const CustomerOrderDetailsCard: React.FC<
  CustomerOrderDetailsCardProps
> = ({ readOnly, form, onChangeForm, onOpenQuickAccount, onSelectDaybook }) => {
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {/* ── CARD 1: Customer Identification (5 cols) ── */}
      <section className="rounded-xl border border-slate-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <User className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                Customer Information
              </h2>
            </div>
          </div>

          <div className="p-4 space-y-3.5">
            <div>
              <Label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                Customer Account <span className="text-rose-500">*</span>
              </Label>
              <div className="mt-1">
                {readOnly ? (
                  <Input
                    disabled
                    value={form.accountName || "No customer selected"}
                    className="h-9 bg-slate-50 dark:bg-zinc-800"
                  />
                ) : (
                  <AccountHelp
                    accountName={form.accountName}
                    placeholder="Search or select customer (F2)"
                    onSelect={(account) =>
                      onChangeForm((current) => ({
                        ...current,
                        accountId: account.id,
                        accountName: account.accountName,
                      }))
                    }
                    onAddAccount={onOpenQuickAccount}
                    showAddButton
                    allowClear
                    onClear={() =>
                      onChangeForm((current) => ({
                        ...current,
                        accountId: 0,
                        accountName: "",
                      }))
                    }
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-slate-600 dark:text-zinc-400 flex items-center gap-1">
                  <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                  Salesman / Attendant
                </Label>
                <Input
                  disabled={readOnly}
                  value={form.salesmanName}
                  placeholder="Attendant name"
                  onChange={(e) =>
                    onChangeForm((cur) => ({
                      ...cur,
                      salesmanName: e.target.value,
                    }))
                  }
                  className="mt-1 h-9 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-600 dark:text-zinc-400 flex items-center gap-1">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" />
                  Customer Reference / Tel
                </Label>
                <Input
                  disabled={readOnly}
                  value={form.reference}
                  placeholder="Job / Ref / Phone"
                  onChange={(e) =>
                    onChangeForm((cur) => ({
                      ...cur,
                      reference: e.target.value,
                    }))
                  }
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CARD 2: Order Metadata & Date (3 cols) ── */}
      <section className="rounded-xl border border-slate-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-zinc-800">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Calendar className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
              Voucher Details
            </h2>
          </div>

          <div className="p-4 space-y-3.5">
            <div>
              <DaybookSelect
                disabled={readOnly}
                value={form.daybookId}
                menuKey="REPAIRING_RECEIPT"
                required
                autoSelectFirst={!form.daybookId}
                onChange={(daybookId) => {
                  if (onSelectDaybook) {
                    onSelectDaybook(daybookId);
                  } else {
                    onChangeForm((cur) => ({ ...cur, daybookId }));
                  }
                }}
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                Voucher Date <span className="text-rose-500">*</span>
              </Label>
              <div className="mt-1">
                <DatePicker
                  disabled={readOnly}
                  value={form.voucherDate}
                  onChange={(voucherDate) =>
                    onChangeForm((current) => ({ ...current, voucherDate }))
                  }
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                Voucher No.
              </Label>
              <Input
                disabled
                value={form.voucherNo || ""}
                className="mt-1 h-9 bg-slate-50 font-mono text-xs text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-4 flex flex-col">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-zinc-800">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
            <MessageSquareText className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
            Repair Instructions & Remarks
          </h2>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <Label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
            Special customer instructions, sizing details, or delivery notes
          </Label>
          <textarea
            disabled={readOnly}
            value={form.remarks}
            onChange={(event) =>
              onChangeForm((current) => ({
                ...current,
                remarks: event.target.value,
              }))
            }
            className="mt-1.5 flex-1 min-h-[92px] w-full resize-none rounded-lg border border-slate-200 bg-transparent p-2.5 text-xs text-slate-800 placeholder-slate-400 transition-colors focus:border-primary-action focus:outline-none focus:ring-1 focus:ring-primary-action dark:border-zinc-800 dark:text-zinc-200 dark:placeholder-zinc-500"
            placeholder="E.g., Polish 22kt ring, repair clasp on chain, deliver before Saturday 4 PM..."
          />
        </div>
      </section>
    </div>
  );
};
