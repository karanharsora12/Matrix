export const CommonListType = {
  MEASURE_UNIT: "MU",
  ATTRIBUTE: "A",
};

export const TransactionMenu = {
  SALES: "SALES",
  PURCHASE: "PURCHASE",
  PAYMENT: "PAYMENT",
  RECEIPT: "RECEIPT",
  JOURNAL: "JOURNAL",
  CONTRA: "CONTRA",
  CREDIT_NOTE: "CREDIT_NOTE",
  DEBIT_NOTE: "DEBIT_NOTE",
} as const;

export type TransactionMenu =
  (typeof TransactionMenu)[keyof typeof TransactionMenu];

export const TransactionType = {
  CPAY: "CPAY",
  CREC: "CREC",
  BPAY: "BPAY",
  BREC: "BREC",
} as const;

export type TransactionType =
  (typeof TransactionType)[keyof typeof TransactionType];

export const TRANSACTION_TYPE_CONFIG: Record<
  TransactionType,
  {
    label: string;
    daybookGroupShortName: "CASH" | "BANK";
    isPayment: boolean;
  }
> = {
  CPAY: {
    label: "Cash Payment",
    daybookGroupShortName: "CASH",
    isPayment: true,
  },
  CREC: {
    label: "Cash Receipt",
    daybookGroupShortName: "CASH",
    isPayment: false,
  },
  BPAY: {
    label: "Bank Payment",
    daybookGroupShortName: "BANK",
    isPayment: true,
  },
  BREC: {
    label: "Bank Receipt",
    daybookGroupShortName: "BANK",
    isPayment: false,
  },
};

export const TRANSACTION_MENU_DAYBOOK_GROUP_MAP: Record<string, string[]> = {
  [TransactionMenu.SALES]: ["SAL"],
  [TransactionMenu.PURCHASE]: ["PUR"],
  [TransactionMenu.PAYMENT]: ["CASH", "BANK", "PAY"],
  [TransactionMenu.RECEIPT]: ["CASH", "BANK", "RCT"],
  [TransactionMenu.JOURNAL]: ["JRN"],
  [TransactionMenu.CONTRA]: ["CTR"],
  [TransactionMenu.CREDIT_NOTE]: ["SAL"],
  [TransactionMenu.DEBIT_NOTE]: ["PUR"],
};

export function getDaybooksByMenu<
  T extends { daybookGroupId: number },
  G extends { id: number; shortName: string },
>(transactionMenu: string, daybooks: T[], daybookGroups: G[]): T[] {
  const targetGroupShortNames =
    TRANSACTION_MENU_DAYBOOK_GROUP_MAP[transactionMenu];
  if (!targetGroupShortNames || targetGroupShortNames.length === 0)
    return daybooks;

  const targetGroupIds = daybookGroups
    .filter((g) => targetGroupShortNames.includes(g.shortName))
    .map((g) => g.id);

  if (targetGroupIds.length === 0) return [];

  return daybooks.filter((d) => targetGroupIds.includes(d.daybookGroupId));
}
