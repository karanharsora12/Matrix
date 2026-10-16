import type { SaleLineItem } from "@/api/sales";
import { todayISO } from "@/utils/date";

export type RepairingBillLine = SaleLineItem & { key: string };

export interface RepairingBillFormData {
  daybookId: number;
  voucherNo: string;
  srNo: number;
  voucherDate: string;
  accountId: number;
  accountName: string;
  salesmanName: string;
  customerReference: string;
  remarks: string;
  receiptId: number | null;
  receiptVoucherNo: string;

  taxRate: number;
  discountRate: number;
  discountAmount: number;

  advanceAdjusted: number;
  cashAmount: number;
  bankAmount: number;
  cashDaybookId: number;
  bankDaybookId: number;
  cashReference: string;
  bankReference: string;
}

export interface RepairingBillTotals {
  itemCount: number;
  totalPcs: number;
  totalGrossWt: number;
  totalNetWt: number;
  taxableTotal: number;
  labourTotal: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  roundOff: number;
  grandTotal: number;
  advanceAdjusted: number;
  settledAmount: number;
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

export const emptyBillLine = (): RepairingBillLine => ({
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
  labourAmount: 0,
  amount: 0,
  deliveryDate: todayISO(),
});
