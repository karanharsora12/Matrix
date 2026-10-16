import React, { useState } from "react";
import {
  Calendar,
  FileSpreadsheet,
  FileText,
  Link2,
  Link2Off,
  MessageSquareText,
  Search,
  User,
  UserCheck,
  Receipt,
  X,
} from "lucide-react";
import { AccountHelp } from "@/components/common/AccountHelp";
import { DaybookSelect } from "@/components/common/DaybookSelect";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEligibleReceipts, type EligibleReceipt } from "@/api/sales";
import { formatDate } from "@/utils/date";
import { money } from "../types";
import type { RepairingBillFormData } from "../types";

interface RepairingBillHeaderCardProps {
  readOnly: boolean;
  form: RepairingBillFormData;
  onChangeForm: React.Dispatch<React.SetStateAction<RepairingBillFormData>>;
  onOpenQuickAccount: () => void;
  onSelectDaybook?: (daybookId: number) => void;
  onSelectReceipt: (receipt: EligibleReceipt) => void;
  onClearReceipt: () => void;
  currentSaleId?: number;
}

export const RepairingBillHeaderCard: React.FC<RepairingBillHeaderCardProps> = ({
  readOnly,
  form,
  onChangeForm,
  onOpenQuickAccount,
  onSelectDaybook,
  onSelectReceipt,
  onClearReceipt,
  currentSaleId,
}) => {
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptSearch, setReceiptSearch] = useState("");

  const { data: eligibleReceipts = [], isLoading: isLoadingReceipts } =
    useEligibleReceipts({
      excludeSaleId: currentSaleId,
      search: receiptSearch || undefined,
      accountId: form.accountId > 0 ? form.accountId : undefined,
    });

  const handlePickReceipt = (receipt: EligibleReceipt) => {
    onSelectReceipt(receipt);
    setReceiptModalOpen(false);
  };

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
            {form.receiptId && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                <Receipt className="h-3 w-3" />
                Ref: #{form.receiptVoucherNo}
              </span>
            )}
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
                  value={form.customerReference}
                  placeholder="Job / Ref / Phone"
                  onChange={(e) =>
                    onChangeForm((cur) => ({
                      ...cur,
                      customerReference: e.target.value,
                    }))
                  }
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CARD 2: Voucher Details & Receipt Picker (3 cols) ── */}
      <section className="rounded-xl border border-slate-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                <Calendar className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                Voucher Details
              </h2>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div>
              <DaybookSelect
                disabled={readOnly}
                value={form.daybookId}
                menuKey="REPAIRING_BILL"
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

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                  Bill Date <span className="text-rose-500">*</span>
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
                  Bill No.
                </Label>
                <Input
                  disabled
                  value={form.voucherNo || ""}
                  className="mt-1 h-9 bg-slate-50 font-mono text-xs text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                />
              </div>
            </div>

            {/* Repairing Receipt Link Selector */}
            <div className="pt-1 border-t border-slate-100 dark:border-zinc-800">
              <Label className="text-xs font-medium text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Link2 className="h-3.5 w-3.5 text-primary-action" />
                  Receipt Reference
                </span>
                {form.receiptId && !readOnly && (
                  <button
                    type="button"
                    onClick={onClearReceipt}
                    className="text-[10px] text-rose-500 hover:text-rose-700 flex items-center gap-0.5"
                    title="Unlink receipt and convert to manual bill"
                  >
                    <Link2Off className="h-3 w-3" />
                    Unlink
                  </button>
                )}
              </Label>

              <div className="mt-1.5">
                {form.receiptId ? (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/70 p-2 text-xs text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <span className="font-semibold">
                      Receipt #{form.receiptVoucherNo}
                    </span>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      Advance: {money(form.advanceAdjusted)}
                    </span>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={readOnly}
                    onClick={() => setReceiptModalOpen(true)}
                    className="w-full h-8 text-xs font-medium text-slate-700 border-dashed border-slate-300 hover:border-primary-action hover:text-primary-action dark:border-zinc-700 dark:text-zinc-300"
                  >
                    <Receipt className="h-3.5 w-3.5 mr-1.5 text-primary-action" />
                    Select Repairing Receipt
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CARD 3: Repair Instructions & Remarks (4 cols) ── */}
      <section className="rounded-xl border border-slate-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-4 flex flex-col">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-zinc-800">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
            <MessageSquareText className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
            Billing Remarks & Delivery Notes
          </h2>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <Label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
            Notes, special repair charges, warranty, or delivery instructions
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
            placeholder="E.g., Delivered in good condition, repair clasp tested, 6 months warranty on stones..."
          />
        </div>
      </section>

      {/* ── DIALOG: Select Unbilled Repairing Receipt Modal ── */}
      <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Receipt className="h-4 w-4 text-primary-action" />
              Select Eligible Repairing Receipt
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by receipt no, customer name, mobile..."
                value={receiptSearch}
                onChange={(e) => setReceiptSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="max-h-[360px] overflow-y-auto rounded-lg border border-slate-200 dark:border-zinc-800">
              {isLoadingReceipts ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Loading eligible receipts...
                </div>
              ) : eligibleReceipts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No unbilled repairing receipts found.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider dark:bg-zinc-800 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
                    <tr>
                      <th className="p-2.5">Receipt No</th>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Customer</th>
                      <th className="p-2.5 text-right">Items</th>
                      <th className="p-2.5 text-right">Advance Paid</th>
                      <th className="p-2.5 text-right">Est. Total</th>
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {eligibleReceipts.map((rcpt) => (
                      <tr
                        key={rcpt.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 cursor-pointer"
                        onClick={() => handlePickReceipt(rcpt)}
                      >
                        <td className="p-2.5 font-medium text-primary-action">
                          {rcpt.voucherNo}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-zinc-400">
                          {formatDate(rcpt.voucherDate)}
                        </td>
                        <td className="p-2.5">
                          <div className="font-medium text-slate-800 dark:text-zinc-200">
                            {rcpt.accountName}
                          </div>
                          {rcpt.customerPhone && (
                            <div className="text-[11px] text-slate-400">
                              {rcpt.customerPhone}
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 text-right text-slate-600 dark:text-zinc-400">
                          {rcpt.itemCount}
                        </td>
                        <td className="p-2.5 text-right font-medium text-emerald-600 dark:text-emerald-400">
                          {money(rcpt.advancePaid)}
                        </td>
                        <td className="p-2.5 text-right font-semibold text-slate-800 dark:text-zinc-200">
                          {money(Number(rcpt.grandTotal))}
                        </td>
                        <td className="p-2.5 text-center">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 px-2 text-[11px] font-medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePickReceipt(rcpt);
                            }}
                          >
                            Select
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
