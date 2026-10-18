import React from "react";
import { MessageSquareText } from "lucide-react";
import { CustomerInfoCard } from "@/components/common/CustomerInfoCard";
import { VoucherDetailsCard } from "@/components/common/VoucherDetailsCard";
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
        reference={form.reference}
        onChangeReference={(val) =>
          onChangeForm((cur) => ({ ...cur, reference: val }))
        }
      />

      <VoucherDetailsCard
        className="lg:col-span-3"
        readOnly={readOnly}
        daybookId={form.daybookId}
        menuKey="REPAIRING_RECEIPT"
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
        voucherNo={form.voucherNo || ""}
      />

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
