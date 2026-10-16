import React from "react";
import { n } from "../types";
import type { RepairingBillFormData, RepairingBillTotals } from "../types";

interface RepairingBillSummaryProps {
  readOnly: boolean;
  form: RepairingBillFormData;
  onChangeForm: React.Dispatch<React.SetStateAction<RepairingBillFormData>>;
  totals: RepairingBillTotals;
}

export const RepairingBillSummary: React.FC<RepairingBillSummaryProps> = ({
  readOnly,
  form,
  onChangeForm,
  totals,
}) => {
  return (
    <section className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-12 text-xs">
      {/* ── CARD 1: Bill Calculation (4 cols) ── */}
      <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-4">
        <div>
          <div className="border-b border-slate-100 pb-1.5 mb-2 font-semibold text-slate-800 dark:text-zinc-200 dark:border-zinc-800">
            Bill Calculation
          </div>

          <div className="space-y-1 text-xs">
            {/* Material / Items */}
            <div className="flex items-center justify-between py-0.5">
              <span className="text-slate-600 dark:text-zinc-400">
                Material / Item
              </span>
              <span className="font-medium text-slate-800 dark:text-zinc-200">
                ₹{totals.taxableTotal.toFixed(2)}
              </span>
            </div>

            {/* Labour Charges */}
            <div className="flex items-center justify-between py-0.5">
              <span className="text-slate-600 dark:text-zinc-400">
                Labour Charges
              </span>
              <span className="font-medium text-slate-800 dark:text-zinc-200">
                ₹{totals.labourTotal.toFixed(2)}
              </span>
            </div>

            {/* Discount */}
            <div className="flex items-center justify-between py-0.5">
              <span className="text-slate-600 dark:text-zinc-400">
                Discount
              </span>
              <div className="flex items-center gap-1.5">
                {!readOnly && (
                  <div className="flex items-center rounded border border-slate-200 bg-slate-50 px-1 dark:border-zinc-700 dark:bg-zinc-800">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={form.discountRate || ""}
                      onChange={(e) =>
                        onChangeForm((cur) => ({
                          ...cur,
                          discountRate: n(e.target.value),
                        }))
                      }
                      className="h-4 w-7 bg-transparent text-center text-xs outline-none font-medium"
                    />
                    <span className="text-[10px] text-slate-400 font-medium">
                      %
                    </span>
                  </div>
                )}
                <span className="w-16 text-right font-semibold text-amber-600 dark:text-amber-400">
                  {totals.discountAmount > 0
                    ? `-₹${totals.discountAmount.toFixed(2)}`
                    : "₹0.00"}
                </span>
              </div>
            </div>

            {/* GST / Tax */}
            <div className="flex items-center justify-between py-0.5">
              <span className="text-slate-600 dark:text-zinc-400">
                GST / Tax
              </span>
              <div className="flex items-center gap-1.5">
                {!readOnly && (
                  <div className="flex items-center rounded border border-slate-200 bg-slate-50 px-1 dark:border-zinc-700 dark:bg-zinc-800">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={form.taxRate || ""}
                      onChange={(e) =>
                        onChangeForm((cur) => ({
                          ...cur,
                          taxRate: n(e.target.value),
                        }))
                      }
                      className="h-4 w-7 bg-transparent text-center text-xs outline-none font-medium"
                    />
                    <span className="text-[10px] text-slate-400 font-medium">
                      %
                    </span>
                  </div>
                )}
                <span className="w-16 text-right font-semibold text-slate-800 dark:text-zinc-200">
                  {totals.taxAmount > 0
                    ? `+₹${totals.taxAmount.toFixed(2)}`
                    : "₹0.00"}
                </span>
              </div>
            </div>

            {/* Round Off */}
            {totals.roundOff !== 0 && (
              <div className="flex items-center justify-between py-0.5 text-slate-500 dark:text-zinc-400">
                <span>Round Off</span>
                <span className="w-16 text-right font-medium">
                  {totals.roundOff > 0
                    ? `+₹${totals.roundOff.toFixed(2)}`
                    : `₹${totals.roundOff.toFixed(2)}`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Total Bill Amount */}
        <div className="mt-2 border-t border-slate-200 pt-1.5 dark:border-zinc-700">
          <div className="flex items-center justify-between font-bold">
            <span className="text-slate-800 dark:text-zinc-200">
              Total Bill
            </span>
            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
              ₹{totals.grandTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* ── CARD 2: Payment & Settlement (5 cols) ── */}
      <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-5">
        <div>
          <div className="border-b border-slate-100 pb-1.5 mb-2 font-semibold text-slate-800 dark:text-zinc-200 dark:border-zinc-800">
            Payment & Settlement
          </div>

          <div className="space-y-1.5 text-xs">
            {/* Advance Adjusted */}
            {totals.advanceAdjusted > 0 && (
              <div className="flex items-center justify-between py-0.5">
                <span className="text-slate-600 dark:text-zinc-400">
                  Receipt Adv.{" "}
                  {form.receiptVoucherNo ? `(#${form.receiptVoucherNo})` : ""}
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  -₹{totals.advanceAdjusted.toFixed(2)}
                </span>
              </div>
            )}

            {/* Cash Paid */}
            <div className="flex items-center justify-between gap-2 py-0.5">
              <span className="text-slate-600 dark:text-zinc-400 font-medium">
                Cash Paid
              </span>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">
                  ₹
                </span>
                <input
                  disabled={readOnly}
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={form.cashAmount || ""}
                  onChange={(e) =>
                    onChangeForm((cur) => ({
                      ...cur,
                      cashAmount: n(e.target.value),
                    }))
                  }
                  className="h-7 w-28 rounded border border-slate-200 bg-slate-50/50 pl-5 pr-2 text-right text-xs font-semibold outline-none focus:border-primary-action dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
            </div>

            {/* Bank Paid */}
            <div className="flex items-center justify-between gap-2 py-0.5">
              <span className="text-slate-600 dark:text-zinc-400 font-medium">
                Bank / UPI Paid
              </span>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">
                  ₹
                </span>
                <input
                  disabled={readOnly}
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={form.bankAmount || ""}
                  onChange={(e) =>
                    onChangeForm((cur) => ({
                      ...cur,
                      bankAmount: n(e.target.value),
                    }))
                  }
                  className="h-7 w-28 rounded border border-slate-200 bg-slate-50/50 pl-5 pr-2 text-right text-xs font-semibold outline-none focus:border-primary-action dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
            </div>

            {/* Remarks */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                Remarks
              </span>
              <input
                disabled={readOnly}
                placeholder="Payment or bill remarks..."
                value={form.remarks || ""}
                onChange={(e) =>
                  onChangeForm((cur) => ({ ...cur, remarks: e.target.value }))
                }
                className="h-7 flex-1 rounded border border-slate-200 bg-slate-50/50 px-2 text-xs outline-none focus:border-primary-action dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>
        </div>

        {/* Balance Due */}
        <div className="mt-2 border-t border-slate-200 pt-1.5 dark:border-zinc-700">
          <div className="flex items-center justify-between font-bold">
            <span className="text-slate-800 dark:text-zinc-200">
              Balance Due
            </span>
            <span
              className={`text-sm font-extrabold ${
                totals.balance === 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : totals.balance < 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-slate-900 dark:text-zinc-100"
              }`}
            >
              ₹{totals.balance.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* ── CARD 3: Other Summary (3 cols) ── */}
      <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-3">
        <div>
          {/* Tab Header like the reference */}
          <div className="border-b border-slate-100 pb-1 mb-2 dark:border-zinc-800 flex items-center">
            <span className="border-b-2 border-primary-action text-primary-action font-semibold text-xs pb-1">
              Other Summary
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Bill OS */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 dark:text-zinc-400 font-medium">
                Bill OS
              </span>
              <div className="h-7 w-24 rounded border border-slate-200 bg-slate-50/60 px-2 flex items-center justify-end font-semibold text-slate-800 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-200">
                {totals.balance.toFixed(2)}
              </div>
            </div>

            {/* Ledger OS */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 dark:text-zinc-400 font-medium">
                Ledger OS
              </span>
              <div className="h-7 w-24 rounded border border-slate-200 bg-slate-50/60 px-2 flex items-center justify-end font-semibold text-slate-800 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-200">
                0.00
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
