import React from "react";
import {
  Banknote,
  CheckCircle2,
  Coins,
  FileCheck,
  Landmark,
  WalletCards,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { money, n } from "../types";
import type {
  RepairingReceiptFormData,
  RepairingReceiptTotals,
} from "../types";

interface ReceiptCollectionSummaryProps {
  readOnly: boolean;
  form: RepairingReceiptFormData;
  onChangeForm: React.Dispatch<React.SetStateAction<RepairingReceiptFormData>>;
  totals: RepairingReceiptTotals;
  cashDaybookName?: string;
  bankDaybookName?: string;
}

export const ReceiptCollectionSummary: React.FC<
  ReceiptCollectionSummaryProps
> = ({
  readOnly,
  form,
  onChangeForm,
  totals,
  cashDaybookName = "Cash Receipt Daybook",
  bankDaybookName = "Bank Receipt Daybook",
}) => {
  const percentAdvance =
    totals.grandTotal > 0
      ? Math.min(100, Math.round((totals.received / totals.grandTotal) * 100))
      : 0;

  return (
    <section className="mt-4 grid gap-4 lg:grid-cols-12">
      {/* ── CARD 1: Executive Total Valuation Card (4 cols) ── */}
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 p-4 text-white dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 lg:col-span-4 flex flex-col justify-between">
        <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Repair Order Value
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <Coins className="h-3.5 w-3.5" />
            </span>
          </div>

          <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {money(totals.grandTotal)}
          </div>
        </div>

        <div className="mt-4 space-y-2 border-t border-slate-800/80 pt-3 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">Taxable Item Charges:</span>
            <span className="font-medium text-slate-200">
              {money(totals.taxableTotal)}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">Labour / Making Charges:</span>
            <span className="font-semibold text-emerald-400">
              {money(totals.labourTotal)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
            <span>
              Items: {totals.itemCount} ({totals.totalPcs} pcs)
            </span>
            <span>Net Wt: {totals.totalNetWt.toFixed(3)}g</span>
          </div>
        </div>
      </div>

      {/* ── CARD 2: Advance Collection Tile (5 cols) ── */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <WalletCards className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                Advance Payment Intake
              </h2>
            </div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
              Optional Advance
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Cash Advance */}
            <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 dark:border-zinc-800 dark:bg-zinc-850/50">
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Banknote className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Cash (₹)
                </Label>
                <span
                  className="text-[10px] text-slate-400 font-medium truncate max-w-[100px]"
                  title={cashDaybookName}
                >
                  {cashDaybookName}
                </span>
              </div>
              <Input
                disabled={readOnly}
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                value={form.cashAmount || ""}
                onChange={(event) =>
                  onChangeForm((current) => ({
                    ...current,
                    cashAmount: n(event.target.value),
                  }))
                }
                className="h-9 font-semibold text-emerald-700 bg-white dark:bg-zinc-900 dark:text-emerald-400"
              />
            </div>

            {/* Bank / UPI Advance */}
            <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 dark:border-zinc-800 dark:bg-zinc-850/50">
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Landmark className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  Bank / UPI (₹)
                </Label>
                <span
                  className="text-[10px] text-slate-400 font-medium truncate max-w-[100px]"
                  title={bankDaybookName}
                >
                  {bankDaybookName}
                </span>
              </div>
              <Input
                disabled={readOnly}
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                value={form.bankAmount || ""}
                onChange={(event) =>
                  onChangeForm((current) => ({
                    ...current,
                    bankAmount: n(event.target.value),
                  }))
                }
                className="h-9 font-semibold text-blue-700 bg-white dark:bg-zinc-900 dark:text-blue-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── CARD 3: Settlement Status & Balance Due (3 cols) ── */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                <FileCheck className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                Settlement Status
              </h2>
            </div>
            {totals.balance === 0 && totals.grandTotal > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                Settled
              </span>
            ) : totals.balance < 0 ? (
              <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                Excess
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                Pending Due
              </span>
            )}
          </div>

          <div className="mt-3 space-y-2.5">
            <div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                Balance Outstanding at Delivery
              </span>
              <div
                className={`mt-0.5 text-xl font-bold tracking-tight ${
                  totals.balance < 0
                    ? "text-rose-600 dark:text-rose-400"
                    : totals.balance === 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-900 dark:text-zinc-100"
                }`}
              >
                {money(totals.balance)}
              </div>
            </div>

            {/* Advance Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-500 dark:text-zinc-400">
                <span>Advance Paid</span>
                <span className="font-semibold">{percentAdvance}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                  style={{ width: `${percentAdvance}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
