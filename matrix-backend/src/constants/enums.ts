export enum CommonListType {
  MEASURE_UNIT = "MU",
  ATTRIBUTE = "A",
}

export enum TransactionMenu {
  SALES = "SALES",
  PAYMENT = "PAYMENT",
  RECEIPT = "RECEIPT",
  JOURNAL = "JOURNAL",
  CONTRA = "CONTRA",
  CREDIT_NOTE = "CREDIT_NOTE",
}

export const TRANSACTION_MENU_DAYBOOK_GROUP_MAP: Record<
  TransactionMenu,
  string[]
> = {
  [TransactionMenu.SALES]: ["SAL"],
  [TransactionMenu.PAYMENT]: ["PAY"],
  [TransactionMenu.RECEIPT]: ["RCT"],
  [TransactionMenu.JOURNAL]: ["JRN"],
  [TransactionMenu.CONTRA]: ["CTR"],
  [TransactionMenu.CREDIT_NOTE]: ["SAL"],
};
