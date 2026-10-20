import type { OrderLineItem } from "@/api/orders";
import { todayISO } from "@/utils/date";

export type RepairLine = OrderLineItem & { key: string };

export interface RepairingReceiptFormData {
  daybookId: number;
  voucherNo: string;
  srNo: number;
  voucherDate: string;
  accountId: number;
  accountName: string;
  salesmanName: string;
  reference: string;
  remarks: string;
  cashAmount: number;
  bankAmount: number;
  cashDaybookId: number;
  bankDaybookId: number;
  cashReference: string;
  bankReference: string;
}

export interface RepairingReceiptTotals {
  itemCount: number;
  totalPcs: number;
  totalGrossWt: number;
  totalNetWt: number;
  taxableTotal: number;
  labourTotal: number;
  grandTotal: number;
  received: number;
  balance: number;
  validLinesCount?: number;
}

export const n = (value: unknown): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

export const money = (value: number): string =>
  value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  });

export const formatWeight = (value: number): string =>
  `${value.toFixed(3)} g`;

export const emptyLine = (): RepairLine => ({
  key: crypto.randomUUID(),
  itemId: 0,
  itemGroupId: null,
  tagNo: "",
  itemDescription: "",
  pcs: 1,
  grossWt: 0,
  netWt: 0,
  rate: 0,
  labourRate: 0,
  rateTypeId: null,
  rateType: "",
  labourAmount: 0,
  amount: 0,
  deliveryDate: todayISO(),
});
