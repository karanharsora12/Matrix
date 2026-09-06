import type { SaleLineItem, Sale } from "@/api/sales";
import type { ItemGroup, RateType } from "@/api/inventory";

export const getItemGroupUpdates = (
  itemGroup: ItemGroup,
  rateTypes: RateType[],
  transactionType: "sales" | "purchase",
): Partial<SaleLineItem> => {
  const updates: Partial<SaleLineItem> = {
    itemGroupId: itemGroup.id,
    itemGroupName: itemGroup.itemGroupName,
  };

  if (itemGroup.measureUnitCode) {
    updates.uom = itemGroup.measureUnitCode;
  }

  const rateTypeId =
    transactionType === "sales"
      ? itemGroup.salesRateTypeId
      : itemGroup.purchaseRateTypeId;

  const rate =
    transactionType === "sales" ? itemGroup.salesRate : itemGroup.purchaseRate;

  if (rateTypeId) {
    const rateTypeObj = rateTypes.find((rt) => rt.id === rateTypeId);
    if (rateTypeObj) {
      updates.rateType = rateTypeObj.name;
    }
  }

  if (rate !== undefined && rate !== null) {
    updates.rate = rate;
  }

  return updates;
};

export const calculateLineItemAmount = (
  line: SaleLineItem,
  field?: keyof SaleLineItem,
): SaleLineItem => {
  const current = { ...line };

  if (field === "grossWt" || current.netWt == null || current.netWt === 0) {
    current.netWt = current.grossWt ?? 0;
  }

  const rate = Number(current.rate || 0);
  const labour = Number(current.labourAmount || 0);
  const other = Number(current.otherAmount || 0);
  const discount = Number(current.discountAmount || 0);
  const pieces = Number(current.pcs || 1);

  let baseAmount = 0;
  if (current.rateType === "Per Piece") {
    baseAmount = pieces * rate;
  } else if (current.rateType === "Flat / Fixed") {
    baseAmount = rate;
  } else {
    const wt = Number(current.netWt || 0);
    baseAmount = (wt > 0 ? wt : pieces) * rate;
  }

  current.amount = Math.max(
    0,
    Math.round(baseAmount + labour + other - discount),
  );

  return current;
};

export const calculateTransactionTotals = (
  lines: SaleLineItem[],
  taxRate: number = 3,
  couponDiscount: number = 0,
  payments: Partial<Sale> = {},
) => {
  let pcs = 0;
  let grossWt = 0;
  let netWt = 0;
  let totalLabour = 0;
  let totalLineDiscount = 0;
  let subtotal = 0;

  lines.forEach((line) => {
    pcs += Number((line as any).quantity || line.pcs || 0);
    grossWt += Number(line.grossWt || 0);
    netWt += Number(line.netWt || 0);
    totalLabour += Number(line.labourAmount || 0);
    totalLineDiscount += Number(line.discountAmount || 0);
    subtotal += Number(line.amount || 0);
  });

  const taxableAmount = Math.max(0, subtotal - couponDiscount);
  const taxAmount = (taxableAmount * taxRate) / 100;
  const rawTotal = taxableAmount + taxAmount;
  const roundedTotal = Math.round(rawTotal);
  const roundOff = Number((roundedTotal - rawTotal).toFixed(2));
  const grandTotal = roundedTotal;

  // Payments
  const cash = Number(payments.cashAmount || 0);
  const bank = Number(payments.bankAmount || 0);
  const card = Number(payments.cardAmount || 0);
  const advance = Number(payments.advanceAmount || 0);
  const urd = Number(payments.urdAmount || 0);
  const returns = Number(payments.salesReturnAmount || 0);
  const kasar = Number(payments.kasarAmount || 0);
  const gift = Number(payments.giftVoucherAmount || 0);
  const totalPaid = cash + bank + card + advance + urd + returns + kasar + gift;
  const balanceDue = grandTotal - totalPaid;

  return {
    pcs,
    grossWt: Number(grossWt.toFixed(3)),
    netWt: Number(netWt.toFixed(3)),
    totalLabour: Number(totalLabour.toFixed(2)),
    totalLineDiscount: Number(totalLineDiscount.toFixed(2)),
    subtotal: Number(subtotal.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    roundOff,
    grandTotal,
    totalPaid,
    balanceDue,
  };
};
