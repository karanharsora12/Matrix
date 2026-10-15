export const CommonListType = {
  MEASURE_UNIT: "MU",
  ATTRIBUTE: "A",
};

export const TransactionMenu = {
  PAYMENT: "PAYMENT",
  RECEIPT: "RECEIPT",
  JOURNAL: "JOURNAL",
  CONTRA: "CONTRA",
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
  [TransactionMenu.PAYMENT]: ["CASH", "BANK", "PAY"],
  [TransactionMenu.RECEIPT]: ["CASH", "BANK", "RCT"],
  [TransactionMenu.JOURNAL]: ["JRN"],
  [TransactionMenu.CONTRA]: ["CTR"],
};

export const MENU_DAYBOOK_CONFIG: Record<
  string,
  {
    daybookGroupShortName: string;
    daybookShortName?: string;
  }
> = {
  REPAIRING_RECEIPT: {
    daybookGroupShortName: "REP",
    daybookShortName: "REPRCT",
  },
  REPAIRING_BILL: {
    daybookGroupShortName: "REP",
    daybookShortName: "REPBIL",
  },
  CASH_PAYMENT: {
    daybookGroupShortName: "PAY",
    daybookShortName: "CSHPAY",
  },
  CASH_RECEIPT: {
    daybookGroupShortName: "RCT",
    daybookShortName: "CSHRCT",
  },
  BANK_PAYMENT: {
    daybookGroupShortName: "PAY",
    daybookShortName: "BNKPAY",
  },
  BANK_RECEIPT: {
    daybookGroupShortName: "RCT",
    daybookShortName: "BNKRCT",
  },
  JOURNAL: {
    daybookGroupShortName: "JRN",
    daybookShortName: "GENJRN",
  },
  CONTRA: {
    daybookGroupShortName: "CTR",
  },
};

export function getDaybooksForMenu<
  T extends { id: number; daybookGroupId: number; shortName?: string },
  G extends { id: number; shortName: string },
>(menuKey: string, daybooks: T[], daybookGroups: G[]): T[] {
  const config = MENU_DAYBOOK_CONFIG[menuKey];
  if (!config) return daybooks;

  const targetGroup = daybookGroups.find(
    (g) => g.shortName === config.daybookGroupShortName,
  );
  if (!targetGroup) return [];

  const groupDaybooks = daybooks.filter((d) => d.daybookGroupId === targetGroup.id);
  if (config.daybookShortName) {
    const matched = groupDaybooks.filter((d) => d.shortName === config.daybookShortName);
    if (matched.length > 0) return matched;
  }
  return groupDaybooks;
}

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
