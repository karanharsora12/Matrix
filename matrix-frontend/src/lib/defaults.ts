import type { ColDef } from "ag-grid-community";

export const MenuList = {
  // Inventory
  INVENTORY: "Inventory",
  ITEM_GROUP: "ItemGroup",
  ITEMS: "Items",
  ITEM_CODES: "ItemCodes",

  // Accounts
  ACCOUNTS: "Accounts",
  ACCOUNT_GROUPS: "AccountGroups",
  ACCOUNT_TYPES: "AccountTypes",

  // Master / Other Master
  DAYBOOKS: "Daybooks",
  DAYBOOK_GROUPS: "DaybookGroups",
  METALS: "Metals",
  RATE_TYPES: "RateTypes",

  // Transactions
  SALES: "Sales",
  PURCHASE: "Purchase",
  CASH_PAYMENT: "CashPayment",
  CASH_RECEIPT: "CashReceipt",
  BANK_PAYMENT: "BankPayment",
  BANK_RECEIPT: "BankReceipt",
  JOURNAL: "Journal",
  CONTRA: "Contra",

  // Admin Setup
  MENU_SETUP: "MenuSetup",
  USERS: "Users",
} as const;

export const ADD_EDIT_COLUMNS: ColDef[] = [
  {
    field: "addBy",
    headerName: "Add By",
    width: 150,
  },
  {
    field: "editBy",
    headerName: "Edit By",
    width: 150,
  },
  {
    field: "createdAt",
    headerName: "Add Date",
    width: 150,
  },
  {
    field: "updatedAt",
    headerName: "Edit Date",
    width: 150,
  },
];

export const BASE_LISTING_COLUMNS_MAP: Record<string, ColDef[]> = {
  [MenuList.ITEM_GROUP]: [
    { field: "id", headerName: "ID", width: 60, type: "numericColumn" },
    { field: "itemGroupName", headerName: "Item Group Name", width: 180 },
    { field: "shortName", headerName: "Short Name", width: 100 },
    { field: "metalName", headerName: "Metal", width: 100 },
    { field: "salesRateTypeName", headerName: "Sales Rate Type", width: 120 },
    {
      field: "salesRate",
      headerName: "Sales Rate",
      width: 100,
      type: "numericColumn",
    },
    {
      field: "purchaseRateTypeName",
      headerName: "Purchase Rate Type",
      width: 140,
    },
    {
      field: "purchaseRate",
      headerName: "Purchase Rate",
      width: 100,
      type: "numericColumn",
    },
    { field: "measureUnitCode", headerName: "MU", width: 80 },
  ],

  [MenuList.ITEMS]: [
    { field: "id", headerName: "ID", width: 60, type: "numericColumn" },
    { field: "itemName", headerName: "Item Name", width: 200 },
    { field: "shortName", headerName: "Short Name", width: 120 },
    { field: "isActive", headerName: "Active", width: 80 },
    { field: "attributes", headerName: "Attributes", width: 200 },
  ],

  [MenuList.ITEM_CODES]: [
    { field: "id", headerName: "ID", width: 60, type: "numericColumn" },
    { field: "itemCodeName", headerName: "Item Code", width: 200 },
    { field: "itemName", headerName: "Item", width: 200 },
    { field: "attributeValues", headerName: "Attribute Values", width: 300 },
    { field: "isActive", headerName: "Active", width: 80 },
  ],

  [MenuList.ACCOUNTS]: [
    { field: "id", headerName: "ID", width: 80, type: "numericColumn" },
    { field: "accountName", headerName: "Account Name", width: 180 },
    { field: "userName", headerName: "Username", width: 120 },
    { field: "email", headerName: "Email", width: 200 },
    { field: "firstName", headerName: "First Name", width: 120 },
    { field: "middleName", headerName: "Middle Name", width: 120 },
    { field: "lastName", headerName: "Last Name", width: 120 },
    { field: "accountTypeName", headerName: "Type", width: 120 },
    { field: "accountGroupName", headerName: "Group", width: 120 },
    { field: "isActive", headerName: "Active", width: 80 },
  ],

  [MenuList.DAYBOOKS]: [
    { field: "id", headerName: "ID", width: 60, type: "numericColumn" },
    { field: "daybookName", headerName: "Daybook Name", width: 180 },
    { field: "shortName", headerName: "Short Name", width: 100 },
    { field: "daybookGroupName", headerName: "Daybook Group", width: 140 },
    { field: "voucherPrefix", headerName: "Prefix", width: 100 },
    { field: "allowManualNumber", headerName: "Manual No.", width: 100 },
    { field: "description", headerName: "Description", width: 200 },
    { field: "isActive", headerName: "Active", width: 80 },
  ],

  [MenuList.DAYBOOK_GROUPS]: [
    { field: "id", headerName: "ID", width: 60, type: "numericColumn" },
    { field: "groupName", headerName: "Group Name", width: 200 },
    { field: "shortName", headerName: "Short Name", width: 120 },
    { field: "description", headerName: "Description", width: 250 },
    { field: "isActive", headerName: "Active", width: 80 },
  ],

  [MenuList.SALES]: [
    { field: "voucherNo", headerName: "Voucher No.", width: 130 },
    { field: "voucherDate", headerName: "Voucher Date", width: 120 },
    { field: "daybookGroupName", headerName: "Daybook Group", width: 140 },
    { field: "daybookName", headerName: "Daybook", width: 160 },
    { field: "accountName", headerName: "Account Name", width: 250 },
    {
      field: "discountAmount",
      headerName: "Disc. Amount",
      width: 120,
      type: "numericColumn",
    },
    {
      field: "kasarAmount",
      headerName: "Kasar Amount",
      width: 120,
      type: "numericColumn",
    },
    {
      field: "roundOff",
      headerName: "ROF Amount",
      width: 100,
      type: "numericColumn",
    },
    {
      field: "taxAmount",
      headerName: "Tax Amount",
      width: 120,
      type: "numericColumn",
    },
    {
      field: "tdsAmount",
      headerName: "TDS Amount",
      width: 120,
      type: "numericColumn",
    },
    {
      field: "grandTotal",
      headerName: "Grand Total",
      width: 140,
      type: "numericColumn",
    },
    { field: "salesmanName", headerName: "Salesman", width: 150 },
    { field: "remarks", headerName: "Remarks", width: 200 },
  ],

  [MenuList.PURCHASE]: [
    { field: "voucherNo", headerName: "Voucher No.", width: 130 },
    { field: "voucherDate", headerName: "Voucher Date", width: 120 },
    { field: "daybookGroupName", headerName: "Daybook Group", width: 140 },
    { field: "daybookName", headerName: "Daybook", width: 160 },
    { field: "accountName", headerName: "Account Name", width: 250 },
    {
      field: "discountAmount",
      headerName: "Disc. Amount",
      width: 120,
      type: "numericColumn",
    },
    {
      field: "taxAmount",
      headerName: "Tax Amount",
      width: 120,
      type: "numericColumn",
    },
    {
      field: "roundOff",
      headerName: "ROF Amount",
      width: 100,
      type: "numericColumn",
    },
    {
      field: "grandTotal",
      headerName: "Grand Total",
      width: 140,
      type: "numericColumn",
    },
    { field: "remarks", headerName: "Remarks", width: 200 },
  ],

  [MenuList.CASH_PAYMENT]: [
    { field: "voucherNo", headerName: "Voucher No.", width: 130 },
    { field: "voucherDate", headerName: "Voucher Date", width: 120 },
    { field: "daybookName", headerName: "Daybook", width: 180 },
    { field: "accountName", headerName: "Account", width: 250 },
    {
      field: "totalAmount",
      headerName: "Amount",
      width: 140,
      type: "numericColumn",
    },
    { field: "reference", headerName: "Type", width: 130 },
    { field: "remarks", headerName: "Narration", width: 200 },
  ],

  [MenuList.CASH_RECEIPT]: [
    { field: "voucherNo", headerName: "Voucher No.", width: 130 },
    { field: "voucherDate", headerName: "Voucher Date", width: 120 },
    { field: "daybookName", headerName: "Daybook", width: 180 },
    { field: "accountName", headerName: "Account", width: 250 },
    {
      field: "totalAmount",
      headerName: "Amount",
      width: 140,
      type: "numericColumn",
    },
    { field: "reference", headerName: "Type", width: 130 },
    { field: "remarks", headerName: "Narration", width: 200 },
  ],

  [MenuList.BANK_PAYMENT]: [
    { field: "voucherNo", headerName: "Voucher No.", width: 130 },
    { field: "voucherDate", headerName: "Voucher Date", width: 120 },
    { field: "daybookName", headerName: "Daybook", width: 180 },
    { field: "accountName", headerName: "Account", width: 250 },
    {
      field: "totalAmount",
      headerName: "Amount",
      width: 140,
      type: "numericColumn",
    },
    { field: "reference", headerName: "Type", width: 130 },
    { field: "remarks", headerName: "Narration", width: 200 },
  ],

  [MenuList.BANK_RECEIPT]: [
    { field: "voucherNo", headerName: "Voucher No.", width: 130 },
    { field: "voucherDate", headerName: "Voucher Date", width: 120 },
    { field: "daybookName", headerName: "Daybook", width: 180 },
    { field: "accountName", headerName: "Account", width: 250 },
    {
      field: "totalAmount",
      headerName: "Amount",
      width: 140,
      type: "numericColumn",
    },
    { field: "reference", headerName: "Type", width: 130 },
    { field: "remarks", headerName: "Narration", width: 200 },
  ],

  [MenuList.MENU_SETUP]: [
    { field: "id", headerName: "ID", width: 60, type: "numericColumn" },
    { field: "menuCaption", headerName: "Caption", width: 180 },
    { field: "menuName", headerName: "Name", width: 150 },
    { field: "menuPath", headerName: "Path", width: 180 },
    { field: "menuIcon", headerName: "Icon", width: 100 },
    { field: "listRight", headerName: "List", width: 70 },
    { field: "viewRight", headerName: "View", width: 70 },
    { field: "addRight", headerName: "Add", width: 70 },
    { field: "editRight", headerName: "Edit", width: 70 },
    { field: "showListingTotalRight", headerName: "Total", width: 70 },
    { field: "exportRight", headerName: "Export", width: 70 },
    { field: "printRight", headerName: "Print", width: 70 },
  ],
};

export interface ListingColumnOptions {
  includeAddEdit?: boolean;
  overrides?: Record<string, Partial<ColDef>>;
  actionColumn?: Partial<ColDef>;
}

/**
 * Returns listing columns for a given menu, with options for overrides, ADD_EDIT_COLUMNS, and action column.
 */
export function getListingColumns(
  menu: string,
  options: ListingColumnOptions = { includeAddEdit: true },
): ColDef[] {
  if (!menu)
    return options.includeAddEdit !== false ? [...ADD_EDIT_COLUMNS] : [];

  const lower = String(menu).toLowerCase();
  const matchedKey = Object.keys(BASE_LISTING_COLUMNS_MAP).find(
    (k) => k.toLowerCase() === lower,
  );

  let columns = matchedKey
    ? BASE_LISTING_COLUMNS_MAP[matchedKey].map((col) => ({ ...col }))
    : [];

  if (options.overrides) {
    columns = columns.map((col) => {
      const override =
        (col.field ? options.overrides?.[col.field] : undefined) ??
        (col.headerName ? options.overrides?.[col.headerName] : undefined);
      return override ? { ...col, ...override } : col;
    });
  }

  if (options.includeAddEdit !== false) {
    columns = [...columns, ...ADD_EDIT_COLUMNS];
  }

  if (options.actionColumn) {
    columns.push({
      headerName: "",
      width: 60,
      ...options.actionColumn,
    });
  }

  return columns;
}
