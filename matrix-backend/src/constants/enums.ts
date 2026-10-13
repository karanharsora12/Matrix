export enum CommonListType {
  MEASURE_UNIT = "MU",
  ATTRIBUTE = "A",
}

export enum TransactionMenu {
  PAYMENT = "PAYMENT",
  RECEIPT = "RECEIPT",
  JOURNAL = "JOURNAL",
  CONTRA = "CONTRA",
}

export const TRANSACTION_MENU_DAYBOOK_GROUP_MAP: Record<
  TransactionMenu,
  string[]
> = {
  [TransactionMenu.PAYMENT]: ["PAY"],
  [TransactionMenu.RECEIPT]: ["RCT"],
  [TransactionMenu.JOURNAL]: ["JRN"],
  [TransactionMenu.CONTRA]: ["CTR"],
};
