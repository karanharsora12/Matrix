export const WEB_ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  MASTER: {
    ADMIN_SETUP: "/master/admin-setup",
    MENU_SETUP: "/master/admin-setup/menu-setup",
    COMMON_LISTS: "/master/common-lists",
    RATE_TYPES: "/master/rate-types",
    METALS: "/master/metals",
    INVENTORY: {
      ITEM_GROUPS: "/master/inventory/item-groups",
      ITEMS: "/master/inventory/items",
    },
    ACCOUNTS_MANAGEMENT: {
      ACCOUNT_MASTER: "/master/accounts/account-master",
      ACCOUNT_MASTER_ADD: "/master/accounts/account-master/add",
      ACCOUNT_MASTER_EDIT: "/master/accounts/account-master/edit/:id",
    },
  },
};
