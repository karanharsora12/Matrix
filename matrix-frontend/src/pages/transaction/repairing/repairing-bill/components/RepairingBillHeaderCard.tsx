import { useEligibleReceipts, type EligibleReceipt } from "@/api/sales";
import { CustomerInfoCard } from "@/components/common/CustomerInfoCard";
import { VoucherDetailsCard } from "@/components/common/VoucherDetailsCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/utils/date";
import { MessageSquareText, Receipt, Search } from "lucide-react";
import React, { useState } from "react";
import type { RepairingBillFormData } from "../types";
import { money } from "../types";

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

export const RepairingBillHeaderCard: React.FC<
  RepairingBillHeaderCardProps
> = ({
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
      <CustomerInfoCard
        className="lg:col-span-5"
        readOnly={readOnly}
        accountName={form.accountName}
        onSelectAccount={(account) =>
          onChangeForm((current) => ({
            ...current,
            accountId: account.id,
            accountName: account.accountName,
          }))
        }
        onClearAccount={() =>
          onChangeForm((current) => ({
            ...current,
            accountId: 0,
            accountName: "",
          }))
        }
        onOpenQuickAccount={onOpenQuickAccount}
        salesmanName={form.salesmanName}
        onChangeSalesman={(val) =>
          onChangeForm((cur) => ({ ...cur, salesmanName: val }))
        }
        reference={form.customerReference}
        onChangeReference={(val) =>
          onChangeForm((cur) => ({ ...cur, customerReference: val }))
        }
        headerRight={
          form.receiptId ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
              <Receipt className="h-3 w-3" />
              Ref: #{form.receiptVoucherNo}
            </span>
          ) : undefined
        }
      />

      <VoucherDetailsCard
        className="lg:col-span-3"
        readOnly={readOnly}
        daybookId={form.daybookId}
        menuKey="REPAIRING_BILL"
        daybookRequired
        onSelectDaybook={(daybookId) => {
          if (onSelectDaybook) {
            onSelectDaybook(daybookId);
          } else {
            onChangeForm((cur) => ({ ...cur, daybookId }));
          }
        }}
        voucherDate={form.voucherDate}
        onChangeDate={(voucherDate) =>
          onChangeForm((current) => ({ ...current, voucherDate }))
        }
        dateLabel="Bill Date"
        voucherNo={form.voucherNo || ""}
        voucherNoLabel="Bill No."
        reference={{
          label: "Receipt Reference",
          isLinked: Boolean(form.receiptId),
          linkedTitle: `Receipt #${form.receiptVoucherNo}`,
          linkedSubtitle: `Advance: ${money(form.advanceAdjusted)}`,
          buttonText: "Select Repairing Receipt",
          onSelect: () => setReceiptModalOpen(true),
          onUnlink: onClearReceipt,
          unlinkTooltip: "Unlink receipt and convert to manual bill",
        }}
      />

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
