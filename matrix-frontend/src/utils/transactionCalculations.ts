export interface LineItemCalculationInput {
  pcs?: number | string;
  quantity?: number | string;
  rate?: number | string;
  rateType?: string;
  grossWt?: number | string;
  netWt?: number | string;
  labourAmount?: number | string;
  otherAmount?: number | string;
  discountAmount?: number | string;
  amount?: number | string;
}

export const calculateLineItemAmount = <T extends LineItemCalculationInput>(
  line: T,
  field?: keyof T,
): T => {
  const current = { ...line };

  if (field === "grossWt" || current.netWt == null || current.netWt === 0) {
    current.netWt = current.grossWt ?? 0;
  }

  const rate = Number(current.rate || 0);
  const labour = Number(current.labourAmount || 0);
  const other = Number(current.otherAmount || 0);
  const discount = Number(current.discountAmount || 0);
  const pieces = Number(current.pcs || current.quantity || 1);

  let baseAmount = 0;
  const rt = (current.rateType || "").toLowerCase();
  if (rt.includes("pc") || rt.includes("piece")) {
    baseAmount = pieces * rate;
  } else if (rt.includes("flat") || rt.includes("fix")) {
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

export const calculateTransactionTotals = <T extends LineItemCalculationInput>(
  lines: T[],
  taxRate: number = 0,
  couponDiscount: number = 0,
  payments: {
    cashAmount?: number | string;
    bankAmount?: number | string;
    advanceAmount?: number | string;
  } = {},
) => {
  let pcs = 0;
  let grossWt = 0;
  let netWt = 0;
  let totalLabour = 0;
  let totalLineDiscount = 0;
  let subtotal = 0;

  lines.forEach((line) => {
    pcs += Number(line.pcs || line.quantity || 0);
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
  const advance = Number(payments.advanceAmount || 0);
  const totalPaid = cash + bank + advance;
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
